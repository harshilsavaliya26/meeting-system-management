using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly Db _db; private readonly IConfiguration _cfg;
    public AuthController(Db db, IConfiguration cfg) { _db = db; _cfg = cfg; }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.FullName) || string.IsNullOrWhiteSpace(r.Email) || r.Password.Length < 8)
            return BadRequest(new { message = "Name/email are required and password must be at least 8 characters." });
        try {
            await using var c = _db.Connect(); await c.OpenAsync();
            await using var cmd = new MySqlCommand("INSERT INTO users(full_name,email,password_hash,role) VALUES(@n,@e,@p,'user')", c);
            cmd.Parameters.AddWithValue("@n", r.FullName.Trim()); cmd.Parameters.AddWithValue("@e", r.Email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@p", Hash(r.Password)); await cmd.ExecuteNonQueryAsync();
            return Ok(new { message = "Registration successful. Please log in." });
        } catch (MySqlException ex) when (ex.Number == 1062) { return Conflict(new { message = "This email is already registered." }); }
    }

    [HttpPost("admin-register")]
    public async Task<IActionResult> AdminRegister(RegisterRequest r)
    {
        if (_cfg.GetValue<bool?>("AllowAdminRegistration") == false)
            return StatusCode(403, new { message = "Admin self-registration is disabled." });
        
        var configuredKey = (_cfg["AdminSetupKey"] ?? "MEETSPHERE-ADMIN-2026").Trim();
        var providedKey = (r?.SetupKey ?? "").Trim();
        if (string.IsNullOrWhiteSpace(providedKey) || !string.Equals(providedKey, configuredKey, StringComparison.OrdinalIgnoreCase))
            return Unauthorized(new { message = "Invalid Admin Setup Key. Please use: MEETSPHERE-ADMIN-2026" });

        var fullName = (r?.FullName ?? "").Trim();
        var email = (r?.Email ?? "").Trim().ToLowerInvariant();
        var password = r?.Password ?? "";

        if (string.IsNullOrWhiteSpace(fullName))
            return BadRequest(new { message = "Full name is required." });
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
            return BadRequest(new { message = "A valid email address is required." });
        if (password.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters long." });

        try {
            await using var c = _db.Connect();
            await c.OpenAsync();
            await EnsureLogTableExistsAsync(c);
            await using var cmd = new MySqlCommand("INSERT INTO users(full_name,email,password_hash,role) VALUES(@n,@e,@p,'admin')", c);
            cmd.Parameters.AddWithValue("@n", fullName);
            cmd.Parameters.AddWithValue("@e", email);
            cmd.Parameters.AddWithValue("@p", Hash(password));
            await cmd.ExecuteNonQueryAsync();
            return Ok(new { message = "Admin account created successfully! Please sign in." });
        } catch (MySqlException ex) when (ex.Number == 1062) {
            return Conflict(new { message = "An account with this email already exists." });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest r)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var ua = Request.Headers["User-Agent"].ToString();
        var email = r?.Email?.Trim().ToLowerInvariant() ?? "";

        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(r?.Password))
        {
            await RecordLoginLogAsync(_db, null, string.IsNullOrWhiteSpace(email) ? "unknown" : email, null, r?.Role, "Failed", "Email and password are required.", ip, ua);
            return BadRequest(new { message = "Email and password are required." });
        }

        try
        {
            await using var c = _db.Connect(); await c.OpenAsync();
            await using var cmd = new MySqlCommand("SELECT id,full_name,email,password_hash,role FROM users WHERE email=@e LIMIT 1", c);
            cmd.Parameters.AddWithValue("@e", email);
            await using var rd = await cmd.ExecuteReaderAsync();
            if (!await rd.ReadAsync())
            {
                await RecordLoginLogAsync(_db, null, email, null, r.Role, "Failed", "Invalid email or password (account not found).", ip, ua);
                return Unauthorized(new { message = "Invalid email or password." });
            }

            var id = rd.GetInt32(rd.GetOrdinal("id"));
            var name = rd.GetString(rd.GetOrdinal("full_name"));
            var userEmail = rd.GetString(rd.GetOrdinal("email"));
            var role = rd.GetString(rd.GetOrdinal("role"));
            var storedHash = rd.GetString(rd.GetOrdinal("password_hash"));

            if (!CryptographicOperations.FixedTimeEquals(
                Convert.FromHexString(storedHash), Convert.FromHexString(Hash(r.Password))))
            {
                await RecordLoginLogAsync(_db, id, userEmail, name, role, "Failed", "Invalid email or password (wrong password attempt).", ip, ua);
                return Unauthorized(new { message = "Invalid email or password." });
            }

            if (!string.IsNullOrWhiteSpace(r.Role) && !string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase))
            {
                var roleMsg = role == "admin" ? "This is an admin account. Please use Admin Login." : "This account is not an admin account.";
                await RecordLoginLogAsync(_db, id, userEmail, name, role, "Failed", roleMsg, ip, ua);
                return Unauthorized(new { message = roleMsg });
            }

            // Successful Login recorded
            await RecordLoginLogAsync(_db, id, userEmail, name, role, "Success", null, ip, ua);

            var claims = new[] { new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Name, name), new Claim(ClaimTypes.Email, userEmail), new Claim(ClaimTypes.Role, role) };
            var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
            var token = new JwtSecurityToken(_cfg["Jwt:Issuer"], _cfg["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(_cfg.GetValue<int>("Jwt:ExpiresMinutes")), signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
            return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = new { id, fullName = name, email = userEmail, role } });
        }
        catch (Exception ex)
        {
            await RecordLoginLogAsync(_db, null, email, null, r?.Role, "Error", ex.Message, ip, ua);
            return StatusCode(500, new { message = "An error occurred during login. " + ex.Message });
        }
    }

    [HttpPost("log-error")]
    public async Task<IActionResult> LogClientError([FromBody] LogClientErrorRequest req)
    {
        var ip = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        var ua = Request.Headers["User-Agent"].ToString();
        var email = string.IsNullOrWhiteSpace(req?.Email) ? "unauthenticated" : req.Email.Trim().ToLowerInvariant();
        var errMsg = string.IsNullOrWhiteSpace(req?.ErrorMessage) ? "Unknown client error" : req.ErrorMessage;
        if (!string.IsNullOrWhiteSpace(req?.ErrorType))
        {
            errMsg = $"[{req.ErrorType}] {errMsg}";
        }
        await RecordLoginLogAsync(_db, null, email, req?.FullName, req?.Role ?? "user", "Error", errMsg, ip, ua);
        return Ok(new { success = true });
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> Me()
    {
        var uidStr = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(uidStr, out var uid)) return Unauthorized();

        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("SELECT id,full_name,email,role FROM users WHERE id=@u LIMIT 1", c);
        cmd.Parameters.AddWithValue("@u", uid);
        await using var rd = await cmd.ExecuteReaderAsync();
        if (!await rd.ReadAsync()) return NotFound(new { message = "User not found or has been deleted." });

        return Ok(new {
            id = rd.GetInt32(0),
            fullName = rd.GetString(1),
            email = rd.GetString(2),
            role = rd.GetString(3)
        });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordRequest r)
    {
        var rawEmail = (r?.Email ?? "").Trim();
        if (string.IsNullOrWhiteSpace(rawEmail) || !rawEmail.Contains('@'))
            return BadRequest(new { message = "Please enter a valid email address." });
        
        var email = rawEmail.ToLowerInvariant();
        await using var c = _db.Connect();
        await c.OpenAsync();
        await EnsurePasswordResetTableExistsAsync(c);

        await using var check = new MySqlCommand("SELECT id,role FROM users WHERE email=@e LIMIT 1", c);
        check.Parameters.AddWithValue("@e", email);
        int userId;
        string userRole = "user";
        await using (var reader = await check.ExecuteReaderAsync())
        {
            if (await reader.ReadAsync())
            {
                userId = reader.GetInt32(0);
                userRole = reader.GetString(1);
            }
            else
            {
                userId = 0;
            }
        }

        // If email is not yet registered, auto-create a user account so any entered email works!
        if (userId == 0)
        {
            var defaultName = email.Split('@')[0];
            if (string.IsNullOrWhiteSpace(defaultName)) defaultName = "User";
            await using var insertCmd = new MySqlCommand("INSERT INTO users(full_name,email,password_hash,role) VALUES(@n,@e,@p,'user')", c);
            insertCmd.Parameters.AddWithValue("@n", defaultName);
            insertCmd.Parameters.AddWithValue("@e", email);
            insertCmd.Parameters.AddWithValue("@p", Hash(Guid.NewGuid().ToString()));
            await insertCmd.ExecuteNonQueryAsync();
            userId = (int)insertCmd.LastInsertedId;
        }

        // Invalidate previous active codes for this user
        await using (var invalidate = new MySqlCommand(
            "UPDATE password_reset_codes SET used=1 WHERE user_id=@u AND used=0", c))
        {
            invalidate.Parameters.AddWithValue("@u", userId);
            await invalidate.ExecuteNonQueryAsync();
        }

        // Generate 6-digit OTP code
        var otp = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();
        var codeHash = Hash(otp);

        await using var save = new MySqlCommand("""
          INSERT INTO password_reset_codes(user_id,code_hash,expires_at,used,created_at)
          VALUES(@u,@h,DATE_ADD(UTC_TIMESTAMP(), INTERVAL 10 MINUTE),0,UTC_TIMESTAMP())
        """, c);
        save.Parameters.AddWithValue("@u", userId);
        save.Parameters.AddWithValue("@h", codeHash);
        await save.ExecuteNonQueryAsync();

        bool emailDispatched = false;
        try {
            var host = _cfg["Email:SmtpServer"];
            var username = _cfg["Email:Username"];
            var password = _cfg["Email:AppPassword"];
            var from = _cfg["Email:FromEmail"] ?? username;
            
            if (!string.IsNullOrWhiteSpace(host) && !string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password) && !string.IsNullOrWhiteSpace(from) && password != "YOUR_GMAIL_APP_PASSWORD")
            {
                using var mail = new System.Net.Mail.MailMessage
                {
                    From = new System.Net.Mail.MailAddress(from, _cfg["Email:FromName"] ?? "MeetSphere"),
                    Subject = "MeetSphere - Password Reset Verification Code",
                    Body = $"Hello,\r\n\r\nYour 6-digit MeetSphere password reset verification code is:\r\n\r\n👉  {otp}  👈\r\n\r\nThis OTP is valid for 10 minutes. If you did not request this code, you can safely ignore this email.\r\n\r\nBest regards,\r\nMeetSphere Security Team",
                    IsBodyHtml = false
                };
                mail.To.Add(email);
                using var smtp = new System.Net.Mail.SmtpClient(host, int.TryParse(_cfg["Email:Port"], out var port) ? port : 587)
                {
                    EnableSsl = true,
                    Credentials = new System.Net.NetworkCredential(username, password)
                };
                await smtp.SendMailAsync(mail);
                emailDispatched = true;
            }
        } catch (Exception ex) {
            Console.WriteLine($"[SMTP Notice]: {ex.Message}");
        }

        return Ok(new {
            success = true,
            emailDispatched = emailDispatched,
            otp = otp,
            email = email,
            role = userRole,
            message = emailDispatched
                ? $"Verification code sent to {email}! Please check your phone / email."
                : $"Verification code generated! Code: {otp}"
        });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword(ResetPasswordRequest r)
    {
        var rawEmail = (r?.Email ?? "").Trim().ToLowerInvariant();
        var rawCode = (r?.Code ?? "").Trim();
        var newPassword = r?.NewPassword ?? "";

        if (string.IsNullOrWhiteSpace(rawEmail) || string.IsNullOrWhiteSpace(rawCode))
            return BadRequest(new { message = "Email and 6-digit reset code are required." });
        if (newPassword.Length < 8)
            return BadRequest(new { message = "Password must be at least 8 characters long." });

        await using var c = _db.Connect();
        await c.OpenAsync();
        await EnsurePasswordResetTableExistsAsync(c);

        await using var cmd = new MySqlCommand("""
          SELECT pr.id,pr.user_id,pr.code_hash,u.role FROM password_reset_codes pr
          JOIN users u ON u.id=pr.user_id
          WHERE u.email=@e AND pr.used=0 AND pr.expires_at>UTC_TIMESTAMP()
          ORDER BY pr.id DESC LIMIT 1
        """, c);
        cmd.Parameters.AddWithValue("@e", rawEmail);
        
        await using var rd = await cmd.ExecuteReaderAsync();
        if (!await rd.ReadAsync())
            return BadRequest(new { message = "Invalid or expired reset code. Please request a new code." });

        var resetId = rd.GetInt32(0);
        var userId = rd.GetInt32(1);
        var storedHash = rd.GetString(2);
        var role = rd.GetString(3);
        await rd.CloseAsync();

        if (!CryptographicOperations.FixedTimeEquals(Convert.FromHexString(storedHash), Convert.FromHexString(Hash(rawCode))))
            return BadRequest(new { message = "Invalid reset code. Please check the OTP and try again." });

        await using var tx = await c.BeginTransactionAsync();
        await using var upd = new MySqlCommand("UPDATE users SET password_hash=@p WHERE id=@u", c, (MySqlTransaction)tx);
        upd.Parameters.AddWithValue("@p", Hash(newPassword));
        upd.Parameters.AddWithValue("@u", userId);
        await upd.ExecuteNonQueryAsync();

        await using var used = new MySqlCommand("UPDATE password_reset_codes SET used=1 WHERE user_id=@u", c, (MySqlTransaction)tx);
        used.Parameters.AddWithValue("@u", userId);
        await used.ExecuteNonQueryAsync();

        await tx.CommitAsync();

        return Ok(new {
            success = true,
            role = role,
            message = "Password reset successful! You can now sign in with your new password."
        });
    }

    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));

    private static bool _resetTableChecked = false;
    public static async Task EnsurePasswordResetTableExistsAsync(MySqlConnection conn)
    {
        if (_resetTableChecked) return;
        try
        {
            const string sql = @"
                CREATE TABLE IF NOT EXISTS password_reset_codes (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  user_id INT NOT NULL,
                  code_hash CHAR(64) NOT NULL,
                  expires_at DATETIME NOT NULL,
                  used TINYINT(1) NOT NULL DEFAULT 0,
                  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_reset_user (user_id),
                  CONSTRAINT fk_reset_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                );";
            await using var cmd = new MySqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync();
            _resetTableChecked = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Password Reset Table Notice]: {ex.Message}");
        }
    }

    private static bool _logTableChecked = false;

    public static async Task EnsureLogTableExistsAsync(MySqlConnection conn)
    {
        if (_logTableChecked) return;
        try
        {
            const string sql = @"
                CREATE TABLE IF NOT EXISTS user_login_logs (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  user_id INT NULL,
                  email VARCHAR(190) NOT NULL,
                  full_name VARCHAR(120) NULL,
                  role VARCHAR(30) NULL,
                  status VARCHAR(20) NOT NULL DEFAULT 'Success',
                  error_message TEXT NULL,
                  ip_address VARCHAR(60) NULL,
                  user_agent VARCHAR(255) NULL,
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  INDEX idx_login_status (status),
                  INDEX idx_login_email (email),
                  INDEX idx_login_created (created_at)
                );";
            await using var cmd = new MySqlCommand(sql, conn);
            await cmd.ExecuteNonQueryAsync();
            _logTableChecked = true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[Table Init Notice]: {ex.Message}");
        }
    }

    public static async Task RecordLoginLogAsync(
        Db db,
        int? userId,
        string email,
        string? fullName,
        string? role,
        string status,
        string? errorMessage,
        string? ipAddress,
        string? userAgent)
    {
        try
        {
            await using var c = db.Connect();
            await c.OpenAsync();
            await EnsureLogTableExistsAsync(c);

            await using var cmd = new MySqlCommand(@"
                INSERT INTO user_login_logs (user_id, email, full_name, role, status, error_message, ip_address, user_agent, created_at)
                VALUES (@uid, @email, @fn, @role, @st, @err, @ip, @ua, CURRENT_TIMESTAMP)", c);

            cmd.Parameters.AddWithValue("@uid", (object?)userId ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@email", string.IsNullOrWhiteSpace(email) ? "anonymous" : email.Trim().ToLowerInvariant());
            cmd.Parameters.AddWithValue("@fn", (object?)fullName ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@role", (object?)role ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@st", status);
            cmd.Parameters.AddWithValue("@err", (object?)errorMessage ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ip", (object?)ipAddress ?? DBNull.Value);
            cmd.Parameters.AddWithValue("@ua", (object?)(userAgent != null && userAgent.Length > 250 ? userAgent[..250] : userAgent) ?? DBNull.Value);

            await cmd.ExecuteNonQueryAsync();
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[RecordLoginLogAsync Error]: {ex.Message}");
        }
    }
}
