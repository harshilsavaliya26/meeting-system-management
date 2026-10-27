
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
        var sql=admin
          ? """SELECT m.id,m.title,m.meeting_code,m.scheduled_at,m.created_at,u.full_name AS host FROM meetings m JOIN users u ON u.id=m.host_user_id ORDER BY m.created_at DESC"""
          : """SELECT m.id,m.title,m.meeting_code,m.scheduled_at,m.created_at,u.full_name AS host FROM meetings m JOIN users u ON u.id=m.host_user_id WHERE m.host_user_id=@uid ORDER BY m.created_at DESC""";
        await using var cmd=new MySqlCommand(sql,c); if(!admin)cmd.Parameters.AddWithValue("@uid",uid);
        return Ok(await ReadMeetings(cmd));
    }

    [HttpGet("discover")]
    [Authorize(Roles="user")]
    public async Task<IActionResult> Discover()
    {
        var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        await using var c=_db.Connect(); await c.OpenAsync();
        await using var cmd=new MySqlCommand("""
          SELECT m.id,m.title,m.meeting_code,m.scheduled_at,m.created_at,u.full_name AS host
          FROM meetings m JOIN users u ON u.id=m.host_user_id
          WHERE m.host_user_id<>@uid ORDER BY m.created_at DESC
        """,c); cmd.Parameters.AddWithValue("@uid",uid);
        return Ok(await ReadMeetings(cmd));
    }

    [HttpPost]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> Create(CreateMeetingRequest r)
    {
        if(string.IsNullOrWhiteSpace(r.Title))return BadRequest(new{message="Meeting title is required."});
                var uid=int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var code=Guid.NewGuid().ToString("N")[..10].ToUpperInvariant();
        await using var c=_db.Connect();await c.OpenAsync();
        // Keep the wizard preferences in the database without replacing the existing meetings table.
        await using (var migration = new MySqlCommand("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS details_json LONGTEXT NULL", c))
            await migration.ExecuteNonQueryAsync();
        var detailsJson = r.Details.HasValue ? System.Text.Json.JsonSerializer.Serialize(r.Details.Value) : null;
        await using var cmd=new MySqlCommand("INSERT INTO meetings(title,meeting_code,host_user_id,scheduled_at,details_json) VALUES(@t,@code,@uid,@s,@details)",c);
        cmd.Parameters.AddWithValue("@t",r.Title.Trim());cmd.Parameters.AddWithValue("@code",code);cmd.Parameters.AddWithValue("@uid",uid);
        cmd.Parameters.AddWithValue("@s",r.ScheduledAt.HasValue?r.ScheduledAt.Value:DBNull.Value);
        cmd.Parameters.AddWithValue("@details",detailsJson is null ? DBNull.Value : detailsJson);
        await cmd.ExecuteNonQueryAsync();
        return Ok(new{message="Meeting created",meetingCode=code,id=cmd.LastInsertedId});
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles="admin")]
    public async Task<IActionResult> Delete(int id)
    {
        await using var c=_db.Connect();await c.OpenAsync();
        await using var cmd=new MySqlCommand("DELETE FROM meetings WHERE id=@id",c);cmd.Parameters.AddWithValue("@id",id);
        return await cmd.ExecuteNonQueryAsync()>0?Ok(new{message="Meeting deleted"}):NotFound(new{message="Meeting not found"});
    }

    private static async Task<List<object>> ReadMeetings(MySqlCommand cmd)
    {
        var list=new List<object>();await using var rd=await cmd.ExecuteReaderAsync();
        while(await rd.ReadAsync()){
            object item=new{
                id=rd.GetInt32(rd.GetOrdinal("id")),title=rd.GetString(rd.GetOrdinal("title")),
                meetingCode=rd.GetString(rd.GetOrdinal("meeting_code")),
                scheduledAt=rd.IsDBNull(rd.GetOrdinal("scheduled_at"))?(DateTime?)null:rd.GetDateTime(rd.GetOrdinal("scheduled_at")),
                createdAt=rd.GetDateTime(rd.GetOrdinal("created_at")),
                host=rd.GetString(rd.GetOrdinal("host"))
            }; list.Add(item);
        } return list;
    }
}
