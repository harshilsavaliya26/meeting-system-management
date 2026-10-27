using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

[ApiController]
[Route("api/workspace")]
[Authorize]
public class WorkspaceController : ControllerBase
{
    private readonly Db _db;
    public WorkspaceController(Db db) => _db = db;
    private int Uid => int.TryParse(User.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : 0;
    private bool IsAdmin => User.IsInRole("admin");

    private async Task Ensure(MySqlConnection c)
    {
        // MySql.Data does not reliably execute a batch of CREATE TABLE statements
        // unless multi-statements are explicitly enabled. Create each table with a
        // separate command so the workspace pages work with a normal MySQL connection.
        var statements = new[]
        {
            @"CREATE TABLE IF NOT EXISTS calendar_items (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(180) NOT NULL,
                start_at DATETIME NOT NULL, end_at DATETIME NULL, location VARCHAR(180) NULL,
                notes VARCHAR(500) NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_cal_user(user_id),
                CONSTRAINT fk_cal_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;",
            @"CREATE TABLE IF NOT EXISTS notes (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(180) NOT NULL,
                content TEXT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_note_user(user_id),
                CONSTRAINT fk_note_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;",
            @"CREATE TABLE IF NOT EXISTS contacts (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(120) NOT NULL,
                email VARCHAR(190) NULL, phone VARCHAR(40) NULL, company VARCHAR(120) NULL, notes VARCHAR(500) NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_contact_user(user_id),
                CONSTRAINT fk_contact_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;",
            @"CREATE TABLE IF NOT EXISTS automations (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, name VARCHAR(180) NOT NULL,
                trigger_name VARCHAR(120) NOT NULL, action_name VARCHAR(180) NOT NULL, enabled TINYINT(1) NOT NULL DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, INDEX idx_auto_user(user_id),
                CONSTRAINT fk_auto_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;",
            @"CREATE TABLE IF NOT EXISTS subscriptions (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, plan_name VARCHAR(60) NOT NULL,
                amount DECIMAL(12,2) NOT NULL DEFAULT 0, status VARCHAR(30) NOT NULL DEFAULT 'Active',
                started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NULL,
                transaction_id VARCHAR(190) NULL, INDEX idx_sub_user(user_id),
                CONSTRAINT fk_sub_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;",
            @"CREATE TABLE IF NOT EXISTS action_items (
                id INT AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, title VARCHAR(180) NOT NULL,
                due_date DATE NULL, priority VARCHAR(20) NOT NULL DEFAULT 'Normal', done TINYINT(1) NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_action_user(user_id), INDEX idx_action_due(due_date),
                CONSTRAINT fk_action_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;"
        };
        foreach (var sql in statements)
        {
            await using var cmd = new MySqlCommand(sql, c);
            await cmd.ExecuteNonQueryAsync();
        }
    }

    [HttpGet("calendar")]
    public async Task<IActionResult> Calendar()
    {
        await using var c=_db.Connect(); await c.OpenAsync(); await Ensure(c);
        var sql=IsAdmin ? "SELECT x.*,u.full_name userName,u.email userEmail FROM calendar_items x JOIN users u ON u.id=x.user_id ORDER BY x.start_at" : "SELECT x.*,u.full_name userName,u.email userEmail FROM calendar_items x JOIN users u ON u.id=x.user_id WHERE x.user_id=@uid ORDER BY x.start_at";
        return Ok(await Query(c,sql,Uid));
    }
    [HttpPost("calendar")]
    public async Task<IActionResult> AddCalendar([FromBody] CalendarRequest r)
    { if(string.IsNullOrWhiteSpace(r.Title)||r.StartAt==default)return BadRequest(new{message="Title and start date/time are required."}); return await InsertCalendar(r); }
    private async Task<IActionResult> InsertCalendar(CalendarRequest r)
    { await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);await using var cmd=new MySqlCommand("INSERT INTO calendar_items(user_id,title,start_at,end_at,location,notes) VALUES(@u,@t,@s,@e,@l,@n)",c);cmd.Parameters.AddWithValue("@u",Uid);cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@s",r.StartAt);cmd.Parameters.AddWithValue("@e",r.EndAt.HasValue?(object)r.EndAt.Value:DBNull.Value);cmd.Parameters.AddWithValue("@l",(object?)r.Location??DBNull.Value);cmd.Parameters.AddWithValue("@n",(object?)r.Notes??DBNull.Value);await cmd.ExecuteNonQueryAsync();return Ok(new{message="Calendar event saved."}); }
    [HttpPut("calendar/{id:int}")]
    public async Task<IActionResult> EditCalendar(int id,[FromBody] CalendarRequest r)
    {
        if(string.IsNullOrWhiteSpace(r.Title)||r.StartAt==default)return BadRequest(new{message="Title and start date/time are required."});
        await using var c=_db.Connect(); await c.OpenAsync(); await Ensure(c);
        var sql=IsAdmin?"UPDATE calendar_items SET title=@t,start_at=@s,end_at=@e,location=@l,notes=@n WHERE id=@id":"UPDATE calendar_items SET title=@t,start_at=@s,end_at=@e,location=@l,notes=@n WHERE id=@id AND user_id=@u";
        await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@s",r.StartAt);cmd.Parameters.AddWithValue("@e",r.EndAt.HasValue?(object)r.EndAt.Value:DBNull.Value);cmd.Parameters.AddWithValue("@l",(object?)r.Location??DBNull.Value);cmd.Parameters.AddWithValue("@n",(object?)r.Notes??DBNull.Value);cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);var count=await cmd.ExecuteNonQueryAsync();return count>0?Ok(new{updated=count}):NotFound(new{message="Calendar event not found."});
    }
    [HttpDelete("calendar/{id:int}")]
    public async Task<IActionResult> DeleteCalendar(int id)=>await DeleteOwned("calendar_items",id);

    [HttpGet("notes")]
    public async Task<IActionResult> Notes(){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"SELECT n.*,u.full_name userName,u.email userEmail FROM notes n JOIN users u ON u.id=n.user_id ORDER BY n.updated_at DESC":"SELECT * FROM notes WHERE user_id=@uid ORDER BY updated_at DESC";return Ok(await Query(c,sql,Uid));}
    [HttpPost("notes")]
    public async Task<IActionResult> AddNote([FromBody] NoteRequest r){if(string.IsNullOrWhiteSpace(r.Title))return BadRequest(new{message="Note title is required."});await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);await using var cmd=new MySqlCommand("INSERT INTO notes(user_id,title,content) VALUES(@u,@t,@c)",c);cmd.Parameters.AddWithValue("@u",Uid);cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@c",(object?)r.Content??"");await cmd.ExecuteNonQueryAsync();return Ok(new{message="Note saved."});}
    [HttpPut("notes/{id:int}")]
    public async Task<IActionResult> EditNote(int id,[FromBody] NoteRequest r){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"UPDATE notes SET title=@t,content=@c WHERE id=@id":"UPDATE notes SET title=@t,content=@c WHERE id=@id AND user_id=@u";await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@c",r.Content??"");cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);return Ok(new{updated=await cmd.ExecuteNonQueryAsync()});}
    [HttpDelete("notes/{id:int}")] public async Task<IActionResult> DeleteNote(int id)=>await DeleteOwned("notes",id);

    [HttpGet("contacts")]
    public async Task<IActionResult> Contacts(){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"SELECT x.*,u.full_name userName,u.email userEmail FROM contacts x JOIN users u ON u.id=x.user_id ORDER BY x.name":"SELECT * FROM contacts WHERE user_id=@uid ORDER BY name";return Ok(await Query(c,sql,Uid));}
    [HttpPost("contacts")]
    public async Task<IActionResult> AddContact([FromBody] ContactRequest r){if(string.IsNullOrWhiteSpace(r.Name))return BadRequest(new{message="Contact name is required."});await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);await using var cmd=new MySqlCommand("INSERT INTO contacts(user_id,name,email,phone,company,notes) VALUES(@u,@n,@e,@p,@co,@no)",c);cmd.Parameters.AddWithValue("@u",Uid);cmd.Parameters.AddWithValue("@n",r.Name.Trim());cmd.Parameters.AddWithValue("@e",(object?)r.Email??DBNull.Value);cmd.Parameters.AddWithValue("@p",(object?)r.Phone??DBNull.Value);cmd.Parameters.AddWithValue("@co",(object?)r.Company??DBNull.Value);cmd.Parameters.AddWithValue("@no",(object?)r.Notes??DBNull.Value);await cmd.ExecuteNonQueryAsync();return Ok(new{message="Contact saved."});}
    [HttpPut("contacts/{id:int}")] public async Task<IActionResult> EditContact(int id,[FromBody] ContactRequest r){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"UPDATE contacts SET name=@n,email=@e,phone=@p,company=@co,notes=@no WHERE id=@id":"UPDATE contacts SET name=@n,email=@e,phone=@p,company=@co,notes=@no WHERE id=@id AND user_id=@u";await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@n",r.Name.Trim());cmd.Parameters.AddWithValue("@e",(object?)r.Email??DBNull.Value);cmd.Parameters.AddWithValue("@p",(object?)r.Phone??DBNull.Value);cmd.Parameters.AddWithValue("@co",(object?)r.Company??DBNull.Value);cmd.Parameters.AddWithValue("@no",(object?)r.Notes??DBNull.Value);cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);return Ok(new{updated=await cmd.ExecuteNonQueryAsync()});}
    [HttpDelete("contacts/{id:int}")] public async Task<IActionResult> DeleteContact(int id)=>await DeleteOwned("contacts",id);

    [HttpGet("automations")]
    public async Task<IActionResult> Automations(){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"SELECT x.*,u.full_name userName,u.email userEmail FROM automations x JOIN users u ON u.id=x.user_id ORDER BY x.id DESC":"SELECT * FROM automations WHERE user_id=@uid ORDER BY id DESC";return Ok(await Query(c,sql,Uid));}
    [HttpPost("automations")]
    public async Task<IActionResult> AddAutomation([FromBody] AutomationRequest r){if(string.IsNullOrWhiteSpace(r.Name)||string.IsNullOrWhiteSpace(r.TriggerName)||string.IsNullOrWhiteSpace(r.ActionName))return BadRequest(new{message="Automation name, trigger and action are required."});await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);await using var cmd=new MySqlCommand("INSERT INTO automations(user_id,name,trigger_name,action_name,enabled) VALUES(@u,@n,@t,@a,@e)",c);cmd.Parameters.AddWithValue("@u",Uid);cmd.Parameters.AddWithValue("@n",r.Name.Trim());cmd.Parameters.AddWithValue("@t",r.TriggerName.Trim());cmd.Parameters.AddWithValue("@a",r.ActionName.Trim());cmd.Parameters.AddWithValue("@e",r.Enabled?1:0);await cmd.ExecuteNonQueryAsync();return Ok(new{message="Automation saved."});}
    [HttpPut("automations/{id:int}")]
    public async Task<IActionResult> EditAutomation(int id,[FromBody] AutomationRequest r)
    {
        if(string.IsNullOrWhiteSpace(r.Name)||string.IsNullOrWhiteSpace(r.TriggerName)||string.IsNullOrWhiteSpace(r.ActionName))return BadRequest(new{message="Automation name, trigger and action are required."});
        await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"UPDATE automations SET name=@n,trigger_name=@t,action_name=@a,enabled=@e WHERE id=@id":"UPDATE automations SET name=@n,trigger_name=@t,action_name=@a,enabled=@e WHERE id=@id AND user_id=@u";await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@n",r.Name.Trim());cmd.Parameters.AddWithValue("@t",r.TriggerName.Trim());cmd.Parameters.AddWithValue("@a",r.ActionName.Trim());cmd.Parameters.AddWithValue("@e",r.Enabled?1:0);cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);var count=await cmd.ExecuteNonQueryAsync();return count>0?Ok(new{updated=count}):NotFound(new{message="Automation not found."});
    }
    [HttpPut("automations/{id:int}/toggle")] public async Task<IActionResult> ToggleAutomation(int id){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?"UPDATE automations SET enabled=1-enabled WHERE id=@id":"UPDATE automations SET enabled=1-enabled WHERE id=@id AND user_id=@u";await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);return Ok(new{updated=await cmd.ExecuteNonQueryAsync()});}
    [HttpDelete("automations/{id:int}")] public async Task<IActionResult> DeleteAutomation(int id)=>await DeleteOwned("automations",id);

    // Shared follow-up action items: users see only their own; admins can audit and manage all users' items.
    [HttpGet("actions")]
    public async Task<IActionResult> Actions()
    {
        await using var c = _db.Connect(); await c.OpenAsync(); await Ensure(c);
        var sql = IsAdmin
            ? "SELECT a.id,a.user_id,a.title,a.due_date dueDate,a.priority,a.done,a.created_at createdAt,u.full_name userName,u.email userEmail FROM action_items a JOIN users u ON u.id=a.user_id ORDER BY a.done,a.due_date,a.id DESC"
            : "SELECT id,user_id,title,due_date dueDate,priority,done,created_at createdAt FROM action_items WHERE user_id=@uid ORDER BY done,due_date,id DESC";
        return Ok(await Query(c, sql, Uid));
    }

    [HttpPost("actions")]
    public async Task<IActionResult> AddAction([FromBody] ActionItemRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return BadRequest(new { message = "Action title is required." });
        await using var c = _db.Connect(); await c.OpenAsync(); await Ensure(c);
        await using var cmd = new MySqlCommand("INSERT INTO action_items(user_id,title,due_date,priority,done) VALUES(@u,@t,@d,@p,@done)", c);
        cmd.Parameters.AddWithValue("@u", Uid); cmd.Parameters.AddWithValue("@t", r.Title.Trim());
        cmd.Parameters.AddWithValue("@d", r.DueDate.HasValue ? (object)r.DueDate.Value.Date : DBNull.Value);
        cmd.Parameters.AddWithValue("@p", NormalizePriority(r.Priority)); cmd.Parameters.AddWithValue("@done", r.Done ? 1 : 0);
        await cmd.ExecuteNonQueryAsync(); return Ok(new { id = cmd.LastInsertedId, message = "Action saved." });
    }

    [HttpPut("actions/{id:int}")]
    public async Task<IActionResult> EditAction(int id, [FromBody] ActionItemRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.Title)) return BadRequest(new { message = "Action title is required." });
        await using var c = _db.Connect(); await c.OpenAsync(); await Ensure(c);
        var sql = IsAdmin ? "UPDATE action_items SET title=@t,due_date=@d,priority=@p,done=@done WHERE id=@id" : "UPDATE action_items SET title=@t,due_date=@d,priority=@p,done=@done WHERE id=@id AND user_id=@u";
        await using var cmd = new MySqlCommand(sql, c); cmd.Parameters.AddWithValue("@t", r.Title.Trim());
        cmd.Parameters.AddWithValue("@d", r.DueDate.HasValue ? (object)r.DueDate.Value.Date : DBNull.Value);
        cmd.Parameters.AddWithValue("@p", NormalizePriority(r.Priority)); cmd.Parameters.AddWithValue("@done", r.Done ? 1 : 0); cmd.Parameters.AddWithValue("@id", id);
        if (!IsAdmin) cmd.Parameters.AddWithValue("@u", Uid);
        var count = await cmd.ExecuteNonQueryAsync(); return count > 0 ? Ok(new { updated = count }) : NotFound(new { message = "Action item not found." });
    }

    [HttpDelete("actions/{id:int}")]
    public async Task<IActionResult> DeleteAction(int id) => await DeleteOwned("action_items", id);

    private static string NormalizePriority(string? priority) => priority?.Trim().ToLowerInvariant() switch { "urgent" => "Urgent", "high" => "High", _ => "Normal" };

    [HttpGet("subscription")]
    public async Task<IActionResult> Subscription(){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);await using var cmd=new MySqlCommand("SELECT id,plan_name planName,amount,status,started_at startedAt,expires_at expiresAt,transaction_id transactionId FROM subscriptions WHERE user_id=@u ORDER BY id DESC LIMIT 1",c);cmd.Parameters.AddWithValue("@u",Uid);await using var rd=await cmd.ExecuteReaderAsync();if(!await rd.ReadAsync())return Ok(null);return Ok(new{id=rd.GetInt32(0),planName=rd.GetString(1),amount=rd.GetDecimal(2),status=rd.GetString(3),startedAt=rd.GetDateTime(4),expiresAt=rd.IsDBNull(5)?(DateTime?)null:rd.GetDateTime(5),transactionId=rd.IsDBNull(6)?null:rd.GetString(6)});}
    [HttpPost("subscription")]
    public async Task<IActionResult> Upgrade([FromBody] UpgradeRequest r)
    {
        var plans = new Dictionary<string, decimal>(StringComparer.OrdinalIgnoreCase)
        {
            { "Free", 0 },
            { "Pro", 499 },
            { "Business", 999 }
        };
        if (!plans.TryGetValue(r.Plan, out var baseAmount))
            return BadRequest(new { message = "Invalid plan." });

        var amount = r.CustomAmount.HasValue && r.CustomAmount.Value >= 0 ? r.CustomAmount.Value : baseAmount;
        var txnId = !string.IsNullOrWhiteSpace(r.TransactionId)
            ? r.TransactionId.Trim()
            : (amount > 0 ? "MSPLAN_" + Guid.NewGuid().ToString("N")[..12].ToUpper() : "FREE");
        var method = string.IsNullOrWhiteSpace(r.PaymentMethod) ? (amount > 0 ? "UPI" : "Free") : r.PaymentMethod.Trim();

        await using var c = _db.Connect();
        await c.OpenAsync();
        await Ensure(c);

        await using var cmd = new MySqlCommand(@"
            INSERT INTO subscriptions(user_id, plan_name, amount, status, started_at, expires_at, transaction_id)
            VALUES(@u, @p, @a, 'Active', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), @t)
        ", c);
        cmd.Parameters.AddWithValue("@u", Uid);
        cmd.Parameters.AddWithValue("@p", r.Plan);
        cmd.Parameters.AddWithValue("@a", amount);
        cmd.Parameters.AddWithValue("@t", txnId);
        await cmd.ExecuteNonQueryAsync();

        if (amount > 0)
        {
            try
            {
                await MeetingsController.EnsureTablesAndColumnsAsync(c);
                var paymentTitle = $"MeetSphere {r.Plan} Plan (30 Days)";
                await using var payCmd = new MySqlCommand(@"
                    INSERT INTO meeting_payments(meeting_id, user_id, meeting_title, user_name, user_email, amount, method, transaction_id, gateway_order_id, gateway_payment_id, payment_status, created_at, paid_at)
                    SELECT 0, u.id, @title, u.full_name, u.email, @amount, @method, @txn, @orderId, @txn, 'Paid', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
                    FROM users u WHERE u.id=@u
                ", c);
                payCmd.Parameters.AddWithValue("@title", paymentTitle);
                payCmd.Parameters.AddWithValue("@amount", amount);
                payCmd.Parameters.AddWithValue("@method", method);
                payCmd.Parameters.AddWithValue("@txn", txnId);
                payCmd.Parameters.AddWithValue("@orderId", "ORD_" + txnId);
                payCmd.Parameters.AddWithValue("@u", Uid);
                await payCmd.ExecuteNonQueryAsync();
            }
            catch {}
        }

        return Ok(new
        {
            message = $"{r.Plan} plan activated successfully for 30 days.",
            plan = r.Plan,
            amount,
            transactionId = txnId,
            method
        });
    }

    [HttpGet("admin/subscriptions")]
    [Authorize(Roles="admin")]
    public async Task<IActionResult> AdminSubscriptions(){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);return Ok(await Query(c,"SELECT s.*,u.full_name userName,u.email userEmail FROM subscriptions s JOIN users u ON u.id=s.user_id ORDER BY s.id DESC",0));}

    private async Task<IActionResult> DeleteOwned(string table,int id){await using var c=_db.Connect();await c.OpenAsync();await Ensure(c);var sql=IsAdmin?$"DELETE FROM {table} WHERE id=@id":$"DELETE FROM {table} WHERE id=@id AND user_id=@u";await using var cmd=new MySqlCommand(sql,c);cmd.Parameters.AddWithValue("@id",id);if(!IsAdmin)cmd.Parameters.AddWithValue("@u",Uid);return Ok(new{deleted=await cmd.ExecuteNonQueryAsync()});}
    private static async Task<List<Dictionary<string,object?>>> Query(MySqlConnection c,string sql,int uid)
    {var list=new List<Dictionary<string,object?>>();await using var cmd=new MySqlCommand(sql,c);if(sql.Contains("@uid"))cmd.Parameters.AddWithValue("@uid",uid);await using var rd=await cmd.ExecuteReaderAsync();while(await rd.ReadAsync()){var d=new Dictionary<string,object?>();for(int i=0;i<rd.FieldCount;i++)d[rd.GetName(i)]=rd.IsDBNull(i)?null:rd.GetValue(i);list.Add(d);}return list;}
}

public record CalendarRequest(string Title, DateTime StartAt, DateTime? EndAt, string? Location, string? Notes);
public record NoteRequest(string Title, string? Content);
public record ContactRequest(string Name, string? Email, string? Phone, string? Company, string? Notes);
public record AutomationRequest(string Name, string TriggerName, string ActionName, bool Enabled=true);
public record UpgradeRequest(string Plan, string? PaymentMethod = null, string? TransactionId = null, decimal? CustomAmount = null);

public record ActionItemRequest(string Title, DateTime? DueDate, string? Priority, bool Done = false);
