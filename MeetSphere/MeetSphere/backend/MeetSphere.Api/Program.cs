using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MySql.Data.MySqlClient;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddHttpClient();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("frontend", p => p.WithOrigins("http://localhost:4200", "http://127.0.0.1:4200").AllowAnyHeader().AllowAnyMethod()));
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
