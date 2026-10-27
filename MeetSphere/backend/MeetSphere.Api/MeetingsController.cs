
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

[ApiController, Route("api/meetings"), Authorize]
public class MeetingsController : ControllerBase
{
    private readonly Db _db;
    public MeetingsController(Db db)=>_db=db;

    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var admin=User.IsInRole("admin"); var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await using var c=_db.Connect(); await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);
        var sql=admin
          ? """SELECT m.id,m.title,m.meeting_code,m.price,m.scheduled_at,m.created_at,u.full_name AS host,1 AS has_paid FROM meetings m JOIN users u ON u.id=m.host_user_id ORDER BY m.created_at DESC"""
          : """SELECT m.id,m.title,m.meeting_code,m.price,m.scheduled_at,m.created_at,u.full_name AS host,1 AS has_paid FROM meetings m JOIN users u ON u.id=m.host_user_id WHERE m.host_user_id=@uid ORDER BY m.created_at DESC""";
        await using var cmd=new MySqlCommand(sql,c); if(!admin)cmd.Parameters.AddWithValue("@uid",uid);
        return Ok(await ReadMeetings(cmd));
    }

    [HttpGet("discover")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> Discover()
    {
        var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await using var c=_db.Connect(); await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);
        var sql = """
          SELECT m.id,m.title,m.meeting_code,m.price,m.scheduled_at,m.created_at,u.full_name AS host,
                 EXISTS(SELECT 1 FROM meeting_payments p WHERE p.meeting_id=m.id AND p.user_id=@uid AND p.payment_status='Paid') AS has_paid
          FROM meetings m JOIN users u ON u.id=m.host_user_id
          WHERE m.host_user_id<>@uid ORDER BY m.created_at DESC
        """;
        await using var cmd=new MySqlCommand(sql,c); cmd.Parameters.AddWithValue("@uid",uid);
        return Ok(await ReadMeetings(cmd));
    }

    [HttpGet("access/{code}")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> CheckAccess(string code)
    {
        var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin=User.IsInRole("admin");
        await using var c=_db.Connect(); await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);
        await using var cmd=new MySqlCommand("""
            SELECT m.id, m.title, m.meeting_code, m.price, m.host_user_id, u.full_name AS host,
                   EXISTS(SELECT 1 FROM meeting_payments p WHERE p.meeting_id=m.id AND p.user_id=@uid AND p.payment_status='Paid') AS has_paid
            FROM meetings m JOIN users u ON u.id=m.host_user_id
            WHERE m.meeting_code=@code LIMIT 1
        """, c);
        cmd.Parameters.AddWithValue("@code", code);
        cmd.Parameters.AddWithValue("@uid", uid);
        await using var rd=await cmd.ExecuteReaderAsync();
        if(!await rd.ReadAsync()) return NotFound(new{message="Meeting not found."});
        var id=rd.GetInt32(0);
        var title=rd.GetString(1);
        var meetingCode=rd.GetString(2);
        var price=rd.GetDecimal(3);
        var hostId=rd.GetInt32(4);
        var host=rd.GetString(5);
        var hasPaid=rd.GetBoolean(6);

        bool canAccess = isAdmin || hostId == uid || price <= 0 || hasPaid;
        return Ok(new {
            hasAccess = canAccess,
            meetingId = id,
            title,
            meetingCode,
            price,
            host,
            isHost = hostId == uid,
            hasPaid
        });
    }

    [HttpGet("stats")]
    [Authorize]
    public async Task<IActionResult> GetStats()
    {
        var uid = int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var isAdmin = User.IsInRole("admin");
        await using var c = _db.Connect(); await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);

        int totalMeetings = 0;
        int myMeetings = 0;
        int totalUsers = 0;
        int totalPaidCount = 0;
        decimal totalRevenue = 0m;

        await using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM meetings", c))
            totalMeetings = Convert.ToInt32(await cmd.ExecuteScalarAsync());

        await using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM meetings WHERE host_user_id=@uid", c))
        {
            cmd.Parameters.AddWithValue("@uid", uid);
            myMeetings = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        await using (var cmd = new MySqlCommand("SELECT COUNT(*) FROM users", c))
            totalUsers = Convert.ToInt32(await cmd.ExecuteScalarAsync());

        await using (var cmd = new MySqlCommand("SELECT COUNT(*), COALESCE(SUM(amount), 0) FROM meeting_payments WHERE payment_status='Paid'", c))
        {
            await using var rd = await cmd.ExecuteReaderAsync();
            if (await rd.ReadAsync())
            {
                totalPaidCount = rd.GetInt32(0);
                totalRevenue = rd.GetDecimal(1);
            }
        }

        return Ok(new
        {
            totalMeetings,
            myMeetings,
            totalUsers,
            totalPaidCount,
            totalRevenue,
            systemHealth = "Operational",
            serverTime = DateTime.UtcNow
        });
    }

    [HttpPost]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> Create(CreateMeetingRequest r)
    {
        if(string.IsNullOrWhiteSpace(r.Title))return BadRequest(new{message="Meeting title is required."});
        var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        // Generate a 10-digit numeric-only meeting code (Zoom-compatible format)
        var rng = new Random();
        var code = string.Concat(Enumerable.Range(0, 10).Select(_ => rng.Next(0, 10).ToString()));
        await using var c=_db.Connect();await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);

        var detailsJson = r.Details.HasValue ? System.Text.Json.JsonSerializer.Serialize(r.Details.Value) : null;
        var price = Math.Max(0m, r.Price);
        await using var cmd=new MySqlCommand("INSERT INTO meetings(title,meeting_code,host_user_id,price,scheduled_at,details_json) VALUES(@t,@code,@uid,@price,@s,@details)",c);
        cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@code",code);cmd.Parameters.AddWithValue("@uid",uid);
        cmd.Parameters.AddWithValue("@price",price);
        cmd.Parameters.AddWithValue("@s",r.ScheduledAt.HasValue?r.ScheduledAt.Value:DBNull.Value);
        cmd.Parameters.AddWithValue("@details",detailsJson is null ? DBNull.Value : detailsJson);
        await cmd.ExecuteNonQueryAsync();
        var meetingId = cmd.LastInsertedId;

        // Record the host's paid hosting fee in the same payment ledger.
        // This makes the payment visible in both User Payment History
        // and the Admin Revenue Audit.
        if (price > 0)
        {
            await using var paymentCmd = new MySqlCommand("""
                INSERT INTO meeting_payments
                (meeting_id,user_id,meeting_title,user_name,user_email,amount,method,
                 transaction_id,payment_status,created_at,paid_at)
                SELECT @meetingId,u.id,@title,u.full_name,u.email,@amount,'Hosting Fee',
                       @txn,'Paid',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP
                FROM users u WHERE u.id=@uid
            """, c);
            var hostTxn = "HOST_" + Guid.NewGuid().ToString("N")[..20].ToUpperInvariant();
            paymentCmd.Parameters.AddWithValue("@meetingId", meetingId);
            paymentCmd.Parameters.AddWithValue("@uid", uid);
            paymentCmd.Parameters.AddWithValue("@title", r.Title.Trim());
            paymentCmd.Parameters.AddWithValue("@amount", price);
            paymentCmd.Parameters.AddWithValue("@txn", hostTxn);
            await paymentCmd.ExecuteNonQueryAsync();
        }

        return Ok(new{message="Meeting created",meetingCode=code,id=meetingId,price});
    }

    [HttpDelete("{id:int}")]
    [Authorize]
    public async Task<IActionResult> Delete(int id)
    {
        var admin = User.IsInRole("admin");
        var uidClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(uidClaim, out var uid))
        {
            return Unauthorized(new { message = "Invalid user identity" });
        }

        await using var c = _db.Connect();
        await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);

        var sql = admin
            ? "DELETE FROM meetings WHERE id=@id"
            : "DELETE FROM meetings WHERE id=@id AND host_user_id=@uid";

        await using var cmd = new MySqlCommand(sql, c);
        cmd.Parameters.AddWithValue("@id", id);
        if (!admin) cmd.Parameters.AddWithValue("@uid", uid);

        var affected = await cmd.ExecuteNonQueryAsync();
        if (affected > 0)
        {
            try
            {
                await using var pCmd = new MySqlCommand("DELETE FROM meeting_payments WHERE meeting_id=@id", c);
                pCmd.Parameters.AddWithValue("@id", id);
                await pCmd.ExecuteNonQueryAsync();
            }
            catch {}
            return Ok(new { message = "Meeting deleted" });
        }

        return NotFound(new { message = "Meeting not found or you are not authorized to delete it" });
    }

    [HttpDelete("code/{code}")]
    [Authorize]
    public async Task<IActionResult> DeleteByCode(string code)
    {
        var admin = User.IsInRole("admin");
        var uidClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(uidClaim, out var uid))
        {
            return Unauthorized(new { message = "Invalid user identity" });
        }

        await using var c = _db.Connect();
        await c.OpenAsync();
        await EnsureTablesAndColumnsAsync(c);

        var sql = admin
            ? "DELETE FROM meetings WHERE meeting_code=@code"
            : "DELETE FROM meetings WHERE meeting_code=@code AND host_user_id=@uid";

        await using var cmd = new MySqlCommand(sql, c);
        cmd.Parameters.AddWithValue("@code", code.Trim());
        if (!admin) cmd.Parameters.AddWithValue("@uid", uid);

        var affected = await cmd.ExecuteNonQueryAsync();
        return affected > 0 ? Ok(new { message = "Meeting deleted" }) : NotFound(new { message = "Meeting not found or you are not authorized to delete it" });
    }

    public static async Task EnsureTablesAndColumnsAsync(MySqlConnection c)
    {
        try {
            await using var cmd1 = new MySqlCommand("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS price DECIMAL(12,2) NOT NULL DEFAULT 0", c);
            await cmd1.ExecuteNonQueryAsync();
        } catch {}
        try {
            await using var cmd2 = new MySqlCommand("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS details_json LONGTEXT NULL", c);
            await cmd2.ExecuteNonQueryAsync();
        } catch {}
        try {
            await using var cmd3 = new MySqlCommand("""
                CREATE TABLE IF NOT EXISTS meeting_payments (
                  id INT AUTO_INCREMENT PRIMARY KEY,
                  meeting_id INT NOT NULL,
                  user_id INT NOT NULL,
                  meeting_title VARCHAR(180) NOT NULL,
                  user_name VARCHAR(120) NOT NULL,
                  user_email VARCHAR(190) NOT NULL,
                  amount DECIMAL(12,2) NOT NULL,
                  method VARCHAR(40) NOT NULL DEFAULT 'Razorpay',
                  transaction_id VARCHAR(190) NOT NULL,
                  gateway_order_id VARCHAR(190) NULL,
                  gateway_payment_id VARCHAR(190) NULL,
                  payment_status VARCHAR(30) NOT NULL DEFAULT 'Created',
                  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                  paid_at DATETIME NULL,
                  INDEX idx_payment_user (user_id),
                  INDEX idx_payment_meeting (meeting_id),
                  INDEX idx_payment_order (gateway_order_id)
                )
            """, c);
            await cmd3.ExecuteNonQueryAsync();
        } catch {}

        // Existing installations may already have meeting_payments with an older schema.
        // CREATE TABLE IF NOT EXISTS does not migrate an existing table, so add any
        // missing payment columns before any payment query/insert is executed.
        var paymentColumns = new (string Name, string Definition)[]
        {
            ("meeting_id", "INT NOT NULL DEFAULT 0"),
            ("user_id", "INT NOT NULL DEFAULT 0"),
            ("meeting_title", "VARCHAR(180) NOT NULL DEFAULT ''"),
            ("user_name", "VARCHAR(120) NOT NULL DEFAULT ''"),
            ("user_email", "VARCHAR(190) NOT NULL DEFAULT ''"),
            ("amount", "DECIMAL(12,2) NOT NULL DEFAULT 0"),
            ("method", "VARCHAR(40) NOT NULL DEFAULT 'Online Payment'"),
            ("transaction_id", "VARCHAR(190) NOT NULL DEFAULT ''"),
            ("gateway_order_id", "VARCHAR(190) NULL"),
            ("gateway_payment_id", "VARCHAR(190) NULL"),
            ("payment_status", "VARCHAR(30) NOT NULL DEFAULT 'Created'"),
            ("created_at", "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"),
            ("paid_at", "DATETIME NULL")
        };
        foreach (var col in paymentColumns)
        {
            try
            {
                await using var check = new MySqlCommand(
                    "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='meeting_payments' AND COLUMN_NAME=@name", c);
                check.Parameters.AddWithValue("@name", col.Name);
                var exists = Convert.ToInt32(await check.ExecuteScalarAsync()) > 0;
                if (!exists)
                {
                    await using var alter = new MySqlCommand($"ALTER TABLE meeting_payments ADD COLUMN {col.Name} {col.Definition}", c);
                    await alter.ExecuteNonQueryAsync();
                }
            }
            catch { }
        }
    }

    private static async Task<List<object>> ReadMeetings(MySqlCommand cmd)
    {
        var list=new List<object>();await using var rd=await cmd.ExecuteReaderAsync();
        while(await rd.ReadAsync()){
            int priceOrdinal = -1;
            try { priceOrdinal = rd.GetOrdinal("price"); } catch {}
            decimal price = priceOrdinal >= 0 && !rd.IsDBNull(priceOrdinal) ? rd.GetDecimal(priceOrdinal) : 0m;

            int hasPaidOrdinal = -1;
            try { hasPaidOrdinal = rd.GetOrdinal("has_paid"); } catch {}
            bool hasPaid = hasPaidOrdinal >= 0 && !rd.IsDBNull(hasPaidOrdinal) && Convert.ToBoolean(rd.GetValue(hasPaidOrdinal));

            object item=new{
                id=rd.GetInt32(rd.GetOrdinal("id")),title=rd.GetString(rd.GetOrdinal("title")),
                meetingCode=rd.GetString(rd.GetOrdinal("meeting_code")),
                price,
                hasPaid,
                scheduledAt=rd.IsDBNull(rd.GetOrdinal("scheduled_at"))?(DateTime?)null:DateTime.SpecifyKind(rd.GetDateTime(rd.GetOrdinal("scheduled_at")),DateTimeKind.Local).ToUniversalTime(),
                createdAt=DateTime.SpecifyKind(rd.GetDateTime(rd.GetOrdinal("created_at")),DateTimeKind.Local).ToUniversalTime(),
                host=rd.GetString(rd.GetOrdinal("host"))
            }; list.Add(item);
        } return list;
    }
}
