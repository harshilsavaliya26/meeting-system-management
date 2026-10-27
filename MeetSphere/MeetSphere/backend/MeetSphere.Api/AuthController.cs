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
        if (!_cfg.GetValue<bool>("AllowAdminRegistration")) return StatusCode(403, new { message = "Admin self-registration is disabled." });
        var setupKey = _cfg["AdminSetupKey"] ?? "";
        if (string.IsNullOrWhiteSpace(r.SetupKey) || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(r.SetupKey), Encoding.UTF8.GetBytes(setupKey)))
            return Unauthorized(new { message = "Invalid Admin Setup Key." });
        if (string.IsNullOrWhiteSpace(r.FullName) || string.IsNullOrWhiteSpace(r.Email) || r.Password.Length < 8)
            return BadRequest(new { message = "Name/email are required and password must be at least 8 characters." });
        try {
            await using var c = _db.Connect(); await c.OpenAsync();
            await using var cmd = new MySqlCommand("INSERT INTO users(full_name,email,password_hash,role) VALUES(@n,@e,@p,'admin')", c);
            cmd.Parameters.AddWithValue("@n", r.FullName.Trim()); cmd.Parameters.AddWithValue("@e", r.Email.Trim().ToLowerInvariant()); cmd.Parameters.AddWithValue("@p", Hash(r.Password));
            await cmd.ExecuteNonQueryAsync(); return Ok(new { message = "Admin account created. Please log in." });
        } catch (MySqlException ex) when (ex.Number == 1062) { return Conflict(new { message = "This email is already registered." }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest r)
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("SELECT id,full_name,email,password_hash,role FROM users WHERE email=@e LIMIT 1", c);
        cmd.Parameters.AddWithValue("@e", r.Email.Trim().ToLowerInvariant());
        await using var rd = await cmd.ExecuteReaderAsync();
        if (!await rd.ReadAsync() || !CryptographicOperations.FixedTimeEquals(
            Convert.FromHexString(rd.GetString(rd.GetOrdinal("password_hash"))), Convert.FromHexString(Hash(r.Password))))
            return Unauthorized(new { message = "Invalid email or password." });
        var id = rd.GetInt32(rd.GetOrdinal("id")); var name = rd.GetString(rd.GetOrdinal("full_name")); var email = rd.GetString(rd.GetOrdinal("email")); var role = rd.GetString(rd.GetOrdinal("role"));
        if (!string.IsNullOrWhiteSpace(r.Role) && !string.Equals(r.Role, role, StringComparison.OrdinalIgnoreCase)) return Unauthorized(new { message = role == "admin" ? "This is an admin account. Please use Admin Login." : "This account is not an admin account." });
        var claims = new[] { new Claim(ClaimTypes.NameIdentifier, id.ToString()), new Claim(ClaimTypes.Name, name), new Claim(ClaimTypes.Email, email), new Claim(ClaimTypes.Role, role) };
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_cfg["Jwt:Key"]!));
        var token = new JwtSecurityToken(_cfg["Jwt:Issuer"], _cfg["Jwt:Audience"], claims, expires: DateTime.UtcNow.AddMinutes(_cfg.GetValue<int>("Jwt:ExpiresMinutes")), signingCredentials: new SigningCredentials(signingKey, SecurityAlgorithms.HmacSha256));
        return Ok(new { token = new JwtSecurityTokenHandler().WriteToken(token), user = new { id, fullName = name, email, role } });
    }
    private static string Hash(string value) => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(value)));
}
