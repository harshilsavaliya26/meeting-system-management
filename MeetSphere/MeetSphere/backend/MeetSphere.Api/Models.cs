
namespace MeetSphere.Api;
public record RegisterRequest(string FullName, string Email, string Password, string? SetupKey = null);
public record LoginRequest(string Email, string Password, string? Role = null);
public record CreateMeetingRequest(string Title, DateTime? ScheduledAt, System.Text.Json.JsonElement? Details = null);
