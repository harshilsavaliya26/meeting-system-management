using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;
[ApiController, Route("api/admin"), Authorize(Roles="admin")]
public class AdminController : ControllerBase
{
    private readonly Db _db; public AdminController(Db db)=>_db=db;
    [HttpGet("users")]
    public async Task<IActionResult> Users(){
        await using var c=_db.Connect(); await c.OpenAsync();
        await using var cmd=new MySqlCommand("SELECT id,full_name,email,role,created_at FROM users ORDER BY id DESC",c);
        var result=new List<object>(); await using var rd=await cmd.ExecuteReaderAsync();
        while(await rd.ReadAsync()) result.Add(new {id=rd.GetInt32(rd.GetOrdinal("id")),fullName=rd.GetString(rd.GetOrdinal("full_name")),email=rd.GetString(rd.GetOrdinal("email")),role=rd.GetString(rd.GetOrdinal("role")),createdAt=rd.GetDateTime(rd.GetOrdinal("created_at"))});
        return Ok(result);
    }
}
