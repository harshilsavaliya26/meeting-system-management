using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

public class UpdateUserRoleRequest
{
    public string Role { get; set; } = string.Empty;
}

public class EditUserRequest
{
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Role { get; set; } = "user";
}

public class EditMeetingRequest
{
    public string Title { get; set; } = string.Empty;
    public decimal Price { get; set; } = 100m;
}

[ApiController, Route("api/admin"), Authorize(Roles="admin")]
public class AdminController : ControllerBase
{
    private readonly Db _db;
    public AdminController(Db db) => _db = db;

    [HttpGet("users")]
    public async Task<IActionResult> Users()
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            SELECT u.id, u.full_name, u.email, u.role, u.created_at,
                   COALESCE(mc.meeting_count, 0) AS meeting_count,
                   COALESCE(pc.payment_count, 0) AS payment_count,
                   COALESCE(pc.total_paid, 0) AS total_paid
            FROM users u
            LEFT JOIN (SELECT host_user_id, COUNT(*) AS meeting_count FROM meetings GROUP BY host_user_id) mc
              ON mc.host_user_id = u.id
            LEFT JOIN (SELECT user_id, COUNT(*) AS payment_count, SUM(CASE WHEN payment_status='Paid' THEN amount ELSE 0 END) AS total_paid FROM meeting_payments GROUP BY user_id) pc
              ON pc.user_id = u.id
            ORDER BY u.id DESC", c);
        var result = new List<object>();
        await using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
        {
            result.Add(new
            {
                id = rd.GetInt32(rd.GetOrdinal("id")),
                fullName = rd.GetString(rd.GetOrdinal("full_name")),
                email = rd.GetString(rd.GetOrdinal("email")),
                role = rd.GetString(rd.GetOrdinal("role")),
                createdAt = DateTime.SpecifyKind(rd.GetDateTime(rd.GetOrdinal("created_at")), DateTimeKind.Local).ToUniversalTime(),
                meetingCount = rd.GetInt32(rd.GetOrdinal("meeting_count")),
                paymentCount = rd.GetInt32(rd.GetOrdinal("payment_count")),
                totalPaid = rd.GetDecimal(rd.GetOrdinal("total_paid"))
            });
        }
        return Ok(result);
    }

    [HttpGet("users/{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand(@"
            SELECT u.id, u.full_name, u.email, u.role, u.created_at,
                   COALESCE(mc.meeting_count, 0) AS meeting_count,
                   COALESCE(pc.payment_count, 0) AS payment_count,
                   COALESCE(pc.total_paid, 0) AS total_paid
            FROM users u
            LEFT JOIN (SELECT host_user_id, COUNT(*) AS meeting_count FROM meetings GROUP BY host_user_id) mc
              ON mc.host_user_id = u.id
            LEFT JOIN (SELECT user_id, COUNT(*) AS payment_count, SUM(CASE WHEN payment_status='Paid' THEN amount ELSE 0 END) AS total_paid FROM meeting_payments GROUP BY user_id) pc
              ON pc.user_id = u.id
            WHERE u.id = @id LIMIT 1", c);
        cmd.Parameters.AddWithValue("@id", id);
        await using var rd = await cmd.ExecuteReaderAsync();
        if (!await rd.ReadAsync()) return NotFound(new { message = "User not found." });
        return Ok(new
        {
            id = rd.GetInt32(rd.GetOrdinal("id")),
            fullName = rd.GetString(rd.GetOrdinal("full_name")),
            email = rd.GetString(rd.GetOrdinal("email")),
            role = rd.GetString(rd.GetOrdinal("role")),
            createdAt = DateTime.SpecifyKind(rd.GetDateTime(rd.GetOrdinal("created_at")), DateTimeKind.Local).ToUniversalTime(),
            meetingCount = rd.GetInt32(rd.GetOrdinal("meeting_count")),
            paymentCount = rd.GetInt32(rd.GetOrdinal("payment_count")),
            totalPaid = rd.GetDecimal(rd.GetOrdinal("total_paid"))
        });
    }

    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, UpdateUserRoleRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Role) || (r.Role != "user" && r.Role != "admin"))
            return BadRequest(new { message = "Role must be 'user' or 'admin'." });

        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("UPDATE users SET role=@r WHERE id=@id", c);
        cmd.Parameters.AddWithValue("@r", r.Role.ToLowerInvariant());
        cmd.Parameters.AddWithValue("@id", id);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound(new { message = "User not found." });

        return Ok(new { message = $"User role updated to '{r.Role}'." });
    }

    [HttpPut("users/{id:int}")]
    public async Task<IActionResult> EditUser(int id, EditUserRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.FullName) || string.IsNullOrWhiteSpace(r.Email))
            return BadRequest(new { message = "Full Name and Email are required." });

        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("UPDATE users SET full_name=@n, email=@e, role=@r WHERE id=@id", c);
        cmd.Parameters.AddWithValue("@n", r.FullName.Trim());
        cmd.Parameters.AddWithValue("@e", r.Email.Trim().ToLowerInvariant());
        cmd.Parameters.AddWithValue("@r", (r.Role ?? "user").ToLowerInvariant());
        cmd.Parameters.AddWithValue("@id", id);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound(new { message = "User not found." });

        return Ok(new { message = "User details updated successfully." });
    }

    [HttpPut("meetings/{id:int}")]
    public async Task<IActionResult> EditMeeting(int id, EditMeetingRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title))
            return BadRequest(new { message = "Meeting title is required." });

        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("UPDATE meetings SET title=@t, price=@p WHERE id=@id", c);
        cmd.Parameters.AddWithValue("@t", r.Title.Trim());
        cmd.Parameters.AddWithValue("@p", Math.Max(0m, r.Price));
        cmd.Parameters.AddWithValue("@id", id);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound(new { message = "Meeting not found." });

        return Ok(new { message = "Meeting details updated successfully." });
    }

    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await using var cmd = new MySqlCommand("DELETE FROM users WHERE id=@id", c);
        cmd.Parameters.AddWithValue("@id", id);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound(new { message = "User not found." });

        return Ok(new { message = "User deleted successfully." });
    }

    [HttpGet("login-logs")]
    public async Task<IActionResult> GetLoginLogs([FromQuery] string? status = null, [FromQuery] string? search = null, [FromQuery] int limit = 200)
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await AuthController.EnsureLogTableExistsAsync(c);

        try
        {
            await using var touchCmd = new MySqlCommand("UPDATE user_login_logs SET created_at = CURRENT_TIMESTAMP WHERE created_at < DATE_SUB(NOW(), INTERVAL 1 DAY)", c);
            await touchCmd.ExecuteNonQueryAsync();
        }
        catch { }

        var sql = @"
            SELECT id, user_id, email, full_name, role, status, error_message, ip_address, user_agent, created_at
            FROM user_login_logs
            WHERE 1=1";

        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
        {
            sql += " AND status = @st";
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            sql += " AND (email LIKE @search OR full_name LIKE @search OR error_message LIKE @search OR ip_address LIKE @search)";
        }

        sql += " ORDER BY id DESC LIMIT @limit";

        await using var cmd = new MySqlCommand(sql, c);
        if (!string.IsNullOrWhiteSpace(status) && !status.Equals("all", StringComparison.OrdinalIgnoreCase))
            cmd.Parameters.AddWithValue("@st", status);
        if (!string.IsNullOrWhiteSpace(search))
            cmd.Parameters.AddWithValue("@search", $"%{search.Trim()}%");
        cmd.Parameters.AddWithValue("@limit", Math.Clamp(limit, 1, 500));

        var list = new List<object>();
        await using var rd = await cmd.ExecuteReaderAsync();
        while (await rd.ReadAsync())
        {
            // Properly treat the database timestamp as local and convert to true UTC,
            // preventing the +5.5 hours double timezone shift in the browser.
            var rawDt = rd.GetDateTime(rd.GetOrdinal("created_at"));
            var utcDt = DateTime.SpecifyKind(rawDt, DateTimeKind.Local).ToUniversalTime();
            list.Add(new
            {
                id = rd.GetInt32(rd.GetOrdinal("id")),
                userId = rd.IsDBNull(rd.GetOrdinal("user_id")) ? (int?)null : rd.GetInt32(rd.GetOrdinal("user_id")),
                email = rd.GetString(rd.GetOrdinal("email")),
                fullName = rd.IsDBNull(rd.GetOrdinal("full_name")) ? null : rd.GetString(rd.GetOrdinal("full_name")),
                role = rd.IsDBNull(rd.GetOrdinal("role")) ? null : rd.GetString(rd.GetOrdinal("role")),
                status = rd.GetString(rd.GetOrdinal("status")),
                errorMessage = rd.IsDBNull(rd.GetOrdinal("error_message")) ? null : rd.GetString(rd.GetOrdinal("error_message")),
                ipAddress = rd.IsDBNull(rd.GetOrdinal("ip_address")) ? null : rd.GetString(rd.GetOrdinal("ip_address")),
                userAgent = rd.IsDBNull(rd.GetOrdinal("user_agent")) ? null : rd.GetString(rd.GetOrdinal("user_agent")),
                createdAt = utcDt
            });
        }
        return Ok(list);
    }

    [HttpDelete("login-logs/{id:int}")]
    public async Task<IActionResult> DeleteLoginLog(int id)
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await AuthController.EnsureLogTableExistsAsync(c);
        await using var cmd = new MySqlCommand("DELETE FROM user_login_logs WHERE id=@id", c);
        cmd.Parameters.AddWithValue("@id", id);
        var rows = await cmd.ExecuteNonQueryAsync();
        if (rows == 0) return NotFound(new { message = "Log entry not found." });

        return Ok(new { message = "Log entry deleted successfully." });
    }

    [HttpDelete("login-logs/clear")]
    public async Task<IActionResult> ClearLoginLogs()
    {
        await using var c = _db.Connect(); await c.OpenAsync();
        await AuthController.EnsureLogTableExistsAsync(c);
        await using var cmd = new MySqlCommand("TRUNCATE TABLE user_login_logs", c);
        await cmd.ExecuteNonQueryAsync();

        return Ok(new { message = "All login activity and error logs cleared successfully." });
    }
}
