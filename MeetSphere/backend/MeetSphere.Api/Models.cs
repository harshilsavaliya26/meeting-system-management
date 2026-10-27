
namespace MeetSphere.Api;
public record RegisterRequest(string FullName, string Email, string Password, string? SetupKey = null);
public record LoginRequest(string Email, string Password, string? Role = null);
public record CreateMeetingRequest(string Title, decimal Price = 0m, DateTime? ScheduledAt = null, System.Text.Json.JsonElement? Details = null);

public record ForgotPasswordRequest(string Email);
public record ResetPasswordRequest(string Email, string Code, string NewPassword);
public record LogClientErrorRequest(string? Email, string ErrorMessage, string? ErrorType = null, string? FullName = null, string? Role = null);
