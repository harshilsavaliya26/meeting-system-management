
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

public sealed class AnnouncementRequest
{
    public string Message { get; set; } = string.Empty;
}

[ApiController]
[Route("api/announcements")]
[Authorize]
public sealed class AnnouncementsController : ControllerBase
{
    private readonly Db _db;

    public AnnouncementsController(Db db)
    {
        _db = db;
    }

    private static async Task EnsureTable(MySqlConnection c)
    {
        await using var cmd = new MySqlCommand(
            @"CREATE TABLE IF NOT EXISTS platform_announcements (
                id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
                message VARCHAR(500) NOT NULL,
                created_by INT NULL,
                created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                active TINYINT(1) NOT NULL DEFAULT 1,
                INDEX idx_announcement_active_created (active, created_at)
            )",
            c
        );

        await cmd.ExecuteNonQueryAsync();
    }

    [HttpGet]
    public async Task<IActionResult> Latest()
    {
        await using var c = _db.Connect();
        await c.OpenAsync();

        await EnsureTable(c);

        await using var cmd = new MySqlCommand(
            @"SELECT id, message, created_at
              FROM platform_announcements
              WHERE active = 1
              ORDER BY created_at DESC, id DESC
              LIMIT 1",
            c
        );

        await using var rd = await cmd.ExecuteReaderAsync();

        if (!await rd.ReadAsync())
        {
            return Ok(null);
        }

        // Get column values using integer indexes.
        var id = rd.GetInt32(0);
        var message = rd.GetString(1);
        var createdAt = rd.GetDateTime(2);

        return Ok(new
        {
            id = id,
            message = message,
            createdAt = createdAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Publish(AnnouncementRequest request)
    {
        var message = (request.Message ?? string.Empty).Trim();

        if (message.Length < 3 || message.Length > 500)
        {
            return BadRequest(new
            {
                message = "Announcement must contain 3 to 500 characters."
            });
        }

        var uidText = User.FindFirst(
            System.Security.Claims.ClaimTypes.NameIdentifier
        )?.Value;

        int? uid = null;

        if (int.TryParse(uidText, out var parsed))
        {
            uid = parsed;
        }

        await using var c = _db.Connect();
        await c.OpenAsync();

        await EnsureTable(c);

        await using var tx = await c.BeginTransactionAsync();

        // Disable previous active announcement
        await using (var off = new MySqlCommand(
            "UPDATE platform_announcements SET active = 0 WHERE active = 1",
            c))
        {
            off.Transaction = (MySqlTransaction)tx;

            await off.ExecuteNonQueryAsync();
        }

        // Insert new announcement
        await using (var insert = new MySqlCommand(
            @"INSERT INTO platform_announcements
              (message, created_by, active)
              VALUES (@m, @u, 1)",
            c))
        {
            insert.Transaction = (MySqlTransaction)tx;

            insert.Parameters.AddWithValue("@m", message);

            if (uid.HasValue)
            {
                insert.Parameters.AddWithValue("@u", uid.Value);
            }
            else
            {
                insert.Parameters.AddWithValue("@u", DBNull.Value);
            }

            await insert.ExecuteNonQueryAsync();
        }

        await tx.CommitAsync();

        return Ok(new
        {
            message = "Announcement published to all users."
        });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "admin")]
    public async Task<IActionResult> Dismiss(int id)
    {
        await using var c = _db.Connect();
        await c.OpenAsync();

        await EnsureTable(c);

        await using var cmd = new MySqlCommand(
            "UPDATE platform_announcements SET active = 0 WHERE id = @id",
            c
        );

        cmd.Parameters.AddWithValue("@id", id);

        await cmd.ExecuteNonQueryAsync();

        return Ok(new
        {
            message = "Announcement removed."
        });
    }
}