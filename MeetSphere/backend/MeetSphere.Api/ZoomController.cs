
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

[ApiController]
[Route("api/zoom")]
public sealed class ZoomController : ControllerBase
{
    private readonly IConfiguration _config;
    private readonly IHttpClientFactory _clients;
    private readonly IMemoryCache _cache;
    private readonly IDataProtector _tokenProtector;
    private readonly Db _db;

    public ZoomController(
        IConfiguration config,
        IHttpClientFactory clients,
        IMemoryCache cache,
        IDataProtectionProvider protectionProvider,
        Db db)
    {
        _config = config;
        _clients = clients;
        _cache = cache;
        _tokenProtector = protectionProvider.CreateProtector(
            "MeetSphere.ZoomTokens.v1");
        _db = db;
    }

    [Authorize]
    [HttpGet("authorize-url")]
    public IActionResult AuthorizeUrl()
    {
        var clientId = _config["Zoom:ClientId"];
        var redirectUri = _config["Zoom:RedirectUri"];

        if (string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(redirectUri))
        {
            return StatusCode(503, new
            {
                message = "Configure Zoom:ClientId and Zoom:RedirectUri."
            });
        }

        var userIdValue = User.FindFirstValue(
            ClaimTypes.NameIdentifier);

        if (!int.TryParse(userIdValue, out var userId))
        {
            return Unauthorized(new
            {
                message = "Please log in again."
            });
        }

        var state = Convert.ToHexString(
            RandomNumberGenerator.GetBytes(32));

        var verifier = Convert.ToBase64String(
            RandomNumberGenerator.GetBytes(32))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        var challenge = Convert.ToBase64String(
            SHA256.HashData(
                Encoding.ASCII.GetBytes(verifier)))
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');

        _cache.Set(
            "zoom-oauth:" + state,
            new ZoomOAuthState(userId, verifier),
            TimeSpan.FromMinutes(10));

        var url = "https://zoom.us/oauth/authorize" +
            "?response_type=code" +
            "&client_id=" + Uri.EscapeDataString(clientId) +
            "&redirect_uri=" + Uri.EscapeDataString(redirectUri) +
            "&state=" + Uri.EscapeDataString(state) +
            "&code_challenge=" + Uri.EscapeDataString(challenge) +
            "&code_challenge_method=S256";

        return Ok(new
        {
            configured = true,
            url
        });
    }

    [AllowAnonymous]
    [HttpGet("callback")]
    public async Task<IActionResult> Callback(
        [FromQuery] string? code,
        [FromQuery] string? state,
        [FromQuery] string? error,
        CancellationToken cancellationToken)
    {
        var frontendBase = (_config["Frontend:BaseUrl"] ?? "http://localhost:4200").TrimEnd('/');
        if (!string.IsNullOrWhiteSpace(error))
        {
            return Redirect(frontendBase + "/zoom/callback?error=denied");
        }

        if (string.IsNullOrWhiteSpace(code) ||
            string.IsNullOrWhiteSpace(state) ||
            !_cache.TryGetValue(
                "zoom-oauth:" + state,
                out ZoomOAuthState? oauthState) ||
            oauthState is null)
        {
            return BadRequest(new
            {
                message = "Invalid or expired Zoom OAuth state. Connect Zoom again."
            });
        }

        // Remove the state so it cannot be reused.
        _cache.Remove("zoom-oauth:" + state);

        var clientId = _config["Zoom:ClientId"];
        var redirectUri = _config["Zoom:RedirectUri"];

        if (string.IsNullOrWhiteSpace(clientId) ||
            string.IsNullOrWhiteSpace(redirectUri))
        {
            return StatusCode(503, new
            {
                message = "Zoom OAuth is not configured."
            });
        }

        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            "https://zoom.us/oauth/token");

        request.Content = new FormUrlEncodedContent(
            new Dictionary<string, string>
            {
                ["grant_type"] = "authorization_code",
                ["code"] = code,
                ["redirect_uri"] = redirectUri,
                ["client_id"] = clientId,
                ["code_verifier"] = oauthState.Verifier
            });

        var client = _clients.CreateClient();

        using var response = await client.SendAsync(
            request, cancellationToken);

        var body = await response.Content.ReadAsStringAsync(
            cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            // Do not return OAuth codes, tokens or provider response
            // details to the browser.
            return StatusCode((int)response.StatusCode, new
            {
                message = "Zoom token exchange failed. Check OAuth configuration and retry."
            });
        }

        using var json = JsonDocument.Parse(body);
        var root = json.RootElement;

        var accessToken = root.TryGetProperty(
            "access_token", out var accessElement)
            ? accessElement.GetString()
            : null;

        var refreshToken = root.TryGetProperty(
            "refresh_token", out var refreshElement)
            ? refreshElement.GetString()
            : null;

        var expiresIn = root.TryGetProperty(
            "expires_in", out var expiresElement)
            ? expiresElement.GetInt32()
            : 0;

        if (string.IsNullOrWhiteSpace(accessToken) ||
            string.IsNullOrWhiteSpace(refreshToken) ||
            expiresIn <= 0)
        {
            return StatusCode(502, new
            {
                message = "Zoom did not return valid tokens."
            });
        }

        var now = DateTime.UtcNow;

        var encryptedAccessToken =
            _tokenProtector.Protect(accessToken);

        var encryptedRefreshToken =
            _tokenProtector.Protect(refreshToken);

        using var connection = _db.Connect();
        await connection.OpenAsync(cancellationToken);

        using (var ensureCmd = new MySqlCommand(@"
            CREATE TABLE IF NOT EXISTS ZoomTokens (
                UserId INT NOT NULL PRIMARY KEY,
                AccessToken TEXT NOT NULL,
                RefreshToken TEXT NOT NULL,
                ExpiresAtUtc DATETIME NOT NULL,
                CreatedAtUtc DATETIME NOT NULL,
                UpdatedAtUtc DATETIME NOT NULL,
                CONSTRAINT fk_zoom_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;", connection))
        {
            await ensureCmd.ExecuteNonQueryAsync(cancellationToken);
        }

        using var command = new MySqlCommand(@"
            INSERT INTO ZoomTokens
                (UserId, AccessToken, RefreshToken,
                 ExpiresAtUtc, CreatedAtUtc, UpdatedAtUtc)
            VALUES
                (@UserId, @AccessToken, @RefreshToken,
                 @ExpiresAtUtc, @CreatedAtUtc, @UpdatedAtUtc)
            ON DUPLICATE KEY UPDATE
                AccessToken = VALUES(AccessToken),
                RefreshToken = VALUES(RefreshToken),
                ExpiresAtUtc = VALUES(ExpiresAtUtc),
                UpdatedAtUtc = VALUES(UpdatedAtUtc);",
            connection);

        command.Parameters.AddWithValue(
            "@UserId", oauthState.UserId);
        command.Parameters.AddWithValue(
            "@AccessToken", encryptedAccessToken);
        command.Parameters.AddWithValue(
            "@RefreshToken", encryptedRefreshToken);
        command.Parameters.AddWithValue(
            "@ExpiresAtUtc", now.AddSeconds(expiresIn));
        command.Parameters.AddWithValue(
            "@CreatedAtUtc", now);
        command.Parameters.AddWithValue(
            "@UpdatedAtUtc", now);

        await command.ExecuteNonQueryAsync(cancellationToken);

        return Redirect(frontendBase + "/zoom/callback?connected=1");
    }

    [Authorize]
    [HttpGet("status")]
    public async Task<IActionResult> Status(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        using var connection = _db.Connect();
        await connection.OpenAsync(cancellationToken);

        using (var ensureCmd = new MySqlCommand(@"
            CREATE TABLE IF NOT EXISTS ZoomTokens (
                UserId INT NOT NULL PRIMARY KEY,
                AccessToken TEXT NOT NULL,
                RefreshToken TEXT NOT NULL,
                ExpiresAtUtc DATETIME NOT NULL,
                CreatedAtUtc DATETIME NOT NULL,
                UpdatedAtUtc DATETIME NOT NULL,
                CONSTRAINT fk_zoom_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;", connection))
        {
            await ensureCmd.ExecuteNonQueryAsync(cancellationToken);
        }

        using var cmd = new MySqlCommand("SELECT COUNT(*) FROM ZoomTokens WHERE UserId=@u AND ExpiresAtUtc > UTC_TIMESTAMP()", connection);
        cmd.Parameters.AddWithValue("@u", userId);
        var connected = Convert.ToInt32(await cmd.ExecuteScalarAsync(cancellationToken)) > 0;

        var clientId = _config["Zoom:ClientId"] ?? "";
        var configured = !string.IsNullOrWhiteSpace(clientId);

        return Ok(new { connected, configured, clientId });
    }

    [Authorize]
    [HttpPost("demo-connect")]
    public async Task<IActionResult> DemoConnect(CancellationToken cancellationToken)
    {
        var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (!int.TryParse(userIdValue, out var userId)) return Unauthorized();

        using var connection = _db.Connect();
        await connection.OpenAsync(cancellationToken);

        using (var ensureCmd = new MySqlCommand(@"
            CREATE TABLE IF NOT EXISTS ZoomTokens (
                UserId INT NOT NULL PRIMARY KEY,
                AccessToken TEXT NOT NULL,
                RefreshToken TEXT NOT NULL,
                ExpiresAtUtc DATETIME NOT NULL,
                CreatedAtUtc DATETIME NOT NULL,
                UpdatedAtUtc DATETIME NOT NULL,
                CONSTRAINT fk_zoom_user FOREIGN KEY (UserId) REFERENCES users(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;", connection))
        {
            await ensureCmd.ExecuteNonQueryAsync(cancellationToken);
        }

        var now = DateTime.UtcNow;
        using var cmd = new MySqlCommand(@"
            INSERT INTO ZoomTokens (UserId, AccessToken, RefreshToken, ExpiresAtUtc, CreatedAtUtc, UpdatedAtUtc)
            VALUES (@u, @a, @r, @e, @c, @up)
            ON DUPLICATE KEY UPDATE AccessToken=VALUES(AccessToken), ExpiresAtUtc=VALUES(ExpiresAtUtc), UpdatedAtUtc=VALUES(UpdatedAtUtc)", connection);
        cmd.Parameters.AddWithValue("@u", userId);
        cmd.Parameters.AddWithValue("@a", _tokenProtector.Protect("demo_zoom_access_token_" + Guid.NewGuid()));
        cmd.Parameters.AddWithValue("@r", _tokenProtector.Protect("demo_zoom_refresh_token_" + Guid.NewGuid()));
        cmd.Parameters.AddWithValue("@e", now.AddDays(30));
        cmd.Parameters.AddWithValue("@c", now);
        cmd.Parameters.AddWithValue("@up", now);
        await cmd.ExecuteNonQueryAsync(cancellationToken);

        return Ok(new { connected = true, message = "Zoom integration connected successfully." });
    }
}

public sealed record ZoomOAuthState(
    int UserId,
    string Verifier);
