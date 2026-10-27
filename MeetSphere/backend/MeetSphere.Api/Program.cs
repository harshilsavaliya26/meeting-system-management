using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;
using Microsoft.AspNetCore.DataProtection;

var builder = WebApplication.CreateBuilder(args);
builder.WebHost.UseUrls("http://localhost:5001;http://localhost:5000;https://localhost:7001");
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddMemoryCache();
var keyRingPath = Path.Combine(
    builder.Environment.ContentRootPath,
    "KeyRing");

Directory.CreateDirectory(keyRingPath);

builder.Services.AddDataProtection()
    .SetApplicationName("MeetSphere")
    .PersistKeysToFileSystem(new DirectoryInfo(keyRingPath));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
// Development CORS: allow Angular served on localhost/127.0.0.1 with a dev port.
// This prevents browser status-0 failures when the frontend origin differs slightly.
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p
    .SetIsOriginAllowed(origin =>
    {
        if (!Uri.TryCreate(origin, UriKind.Absolute, out var uri)) return false;
        return (uri.Host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
                uri.Host.Equals("127.0.0.1", StringComparison.OrdinalIgnoreCase)) &&
               (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
    })
    .AllowAnyHeader()
    .AllowAnyMethod()));
builder.Services.AddSingleton(new Db(builder.Configuration.GetConnectionString("DefaultConnection")!));
var key = builder.Configuration["Jwt:Key"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer(o =>
{
    o.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true, ValidateAudience = true, ValidateIssuerSigningKey = true, ValidateLifetime = true,
        ValidIssuer = builder.Configuration["Jwt:Issuer"], ValidAudience = builder.Configuration["Jwt:Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key))
    };
});
builder.Services.AddAuthorization();
var app = builder.Build();
app.UseCors("frontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok", app = "MeetSphere API" }));
app.MapGet("/api/health/database", async (Db db) =>
{
    try
    {
        await using var connection = db.Connect();
        await connection.OpenAsync();
        await using var command = new MySqlCommand("SELECT 1", connection);
        await command.ExecuteScalarAsync();
        return Results.Ok(new { status = "ok", database = "connected" });
    }
    catch (Exception)
    {
        // Deliberately do not return connection strings or credentials to the browser.
        return Results.Json(new { status = "error", database = "unavailable", message = "Check XAMPP MySQL and the backend connection settings." }, statusCode: 503);
    }
});
app.MapControllers();
app.UseSwagger();
app.UseSwaggerUI();
app.Run();

public sealed class Db
{
    private readonly string _cs;
    public Db(string cs) => _cs = cs;
    public MySqlConnection Connect() => new(_cs);
}
