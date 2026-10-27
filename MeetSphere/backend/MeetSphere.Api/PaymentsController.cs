
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MySql.Data.MySqlClient;

namespace MeetSphere.Api;

[ApiController, Route("api/payments"), Authorize]
public class PaymentsController : ControllerBase
{
    private readonly Db _db; private readonly IConfiguration _cfg; private readonly HttpClient _http;
    public PaymentsController(Db db,IConfiguration cfg,IHttpClientFactory factory){_db=db;_cfg=cfg;_http=factory.CreateClient();}
    private int Uid=>int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
    private string KeyId=>_cfg["Razorpay:KeyId"]??"";
    private string Secret=>_cfg["Razorpay:KeySecret"]??"";
    private bool Configured=>!string.IsNullOrWhiteSpace(KeyId)&&!string.IsNullOrWhiteSpace(Secret);

    [HttpGet("config")] public IActionResult Config()=>Ok(new{razorpayConfigured=Configured,keyId=KeyId});

    [HttpPost("create-order")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> CreateOrder(CreatePaymentOrderRequest r)
    {
        await using var c=_db.Connect();await c.OpenAsync();
        await MeetingsController.EnsureTablesAndColumnsAsync(c);
        await using var cmd=new MySqlCommand("""SELECT m.id,m.title,m.price,m.host_user_id,u.full_name AS host FROM meetings m JOIN users u ON u.id=m.host_user_id WHERE m.id=@id LIMIT 1""",c);
        cmd.Parameters.AddWithValue("@id",r.MeetingId);
        await using var rd=await cmd.ExecuteReaderAsync();
        if(!await rd.ReadAsync())return NotFound(new{message="Meeting not found."});
        var id=rd.GetInt32(0);var title=rd.GetString(1);var price=rd.GetDecimal(2);var hostId=rd.GetInt32(3);var host=rd.GetString(4);
        await rd.CloseAsync();
        if(hostId==Uid)return BadRequest(new{message="You cannot pay for your own meeting."});
        if(price<=0)return BadRequest(new{message="This meeting is free. No payment is required."});
        await using var dup=new MySqlCommand("SELECT COUNT(*) FROM meeting_payments WHERE meeting_id=@m AND user_id=@u AND payment_status='Paid'",c);
        dup.Parameters.AddWithValue("@m",id);dup.Parameters.AddWithValue("@u",Uid);
        if(Convert.ToInt32(await dup.ExecuteScalarAsync())>0)return Conflict(new{message="You have already paid for this meeting."});
        var orderId="ms_"+Guid.NewGuid().ToString("N")[..24]; var amount=(long)Math.Round(price*100m);
        if(Configured){
            using var req=new HttpRequestMessage(HttpMethod.Post,"https://api.razorpay.com/v1/orders");
            var basic=Convert.ToBase64String(Encoding.ASCII.GetBytes($"{KeyId}:{Secret}"));req.Headers.Authorization=new AuthenticationHeaderValue("Basic",basic);
            req.Content=new StringContent(JsonSerializer.Serialize(new{amount,currency="INR",receipt=orderId}),Encoding.UTF8,"application/json");
            var resp=await _http.SendAsync(req);var body=await resp.Content.ReadAsStringAsync();
            if(!resp.IsSuccessStatusCode)return StatusCode(502,new{message="Razorpay order creation failed.",details=body});
            using var doc=JsonDocument.Parse(body);orderId=doc.RootElement.GetProperty("id").GetString()!;
        }
        await using var ins=new MySqlCommand("""
          INSERT INTO meeting_payments(meeting_id,user_id,meeting_title,user_name,user_email,amount,method,transaction_id,gateway_order_id,payment_status,created_at)
          SELECT @m,u.id,@title,u.full_name,u.email,@amount,'Razorpay',@txn,@orderId,'Created',CURRENT_TIMESTAMP FROM users u WHERE u.id=@u
        """,c);
        ins.Parameters.AddWithValue("@m",id);ins.Parameters.AddWithValue("@u",Uid);ins.Parameters.AddWithValue("@title",title);
        ins.Parameters.AddWithValue("@amount",price);ins.Parameters.AddWithValue("@txn","pending_"+Guid.NewGuid().ToString("N")[..16]);ins.Parameters.AddWithValue("@orderId",orderId);
        await ins.ExecuteNonQueryAsync();
        return Ok(new{keyId=KeyId,razorpayConfigured=Configured,orderId,amount,currency="INR",amountRupees=price,meetingId=id,meetingTitle=title,host});
    }

    [HttpPost("in-app")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> InApp(InAppPaymentRequest r)
    {
        // Local simulation is available when gateway keys are blank, or explicitly in demo test mode.
        if (Configured && !r.Demo) return BadRequest(new { message = "Demo payments are disabled while Razorpay is configured. Use the secure Razorpay checkout." });
        if (string.IsNullOrWhiteSpace(r.OrderId)) return BadRequest(new { message = "Payment order reference is required." });
        var paymentId="MSPAY_"+DateTime.UtcNow.ToString("yyyyMMddHHmmss")+"_"+Guid.NewGuid().ToString("N")[..8];
        await using var c=_db.Connect();await c.OpenAsync();
        await MeetingsController.EnsureTablesAndColumnsAsync(c);
        await using var cmd=new MySqlCommand("""UPDATE meeting_payments SET payment_status='Paid',method=@method,gateway_payment_id=@pid,transaction_id=@pid,paid_at=UTC_TIMESTAMP() WHERE gateway_order_id=@oid AND user_id=@uid AND payment_status='Created'""",c);
        cmd.Parameters.AddWithValue("@method",Normalize(r.Method));cmd.Parameters.AddWithValue("@pid",paymentId);cmd.Parameters.AddWithValue("@oid",r.OrderId);cmd.Parameters.AddWithValue("@uid",Uid);
        if(await cmd.ExecuteNonQueryAsync()!=1)return Conflict(new{message="Payment order expired or already completed."});
        return Ok(new{message="Payment successful.",paymentId});
    }

    [HttpPost("verify")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> Verify(VerifyPaymentRequest r)
    {
        if (!Configured) return BadRequest(new { message = "Razorpay is not configured. Use the clearly labelled local demo checkout instead." });
        if (string.IsNullOrWhiteSpace(r.OrderId) || string.IsNullOrWhiteSpace(r.PaymentId) || string.IsNullOrWhiteSpace(r.Signature))
            return BadRequest(new { message = "Razorpay order, payment and signature are required." });

        var payload = Encoding.UTF8.GetBytes($"{r.OrderId}|{r.PaymentId}");
        using var h = new HMACSHA256(Encoding.UTF8.GetBytes(Secret));
        var sig = Convert.ToHexString(h.ComputeHash(payload)).ToLowerInvariant();
        var received = r.Signature.Trim().ToLowerInvariant();
        if (sig.Length != received.Length || !CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(sig), Encoding.UTF8.GetBytes(received)))
            return BadRequest(new { message = "Invalid Razorpay signature." });

        await using var c = _db.Connect(); await c.OpenAsync();
        decimal expectedAmount;
        await using (var check = new MySqlCommand("SELECT amount FROM meeting_payments WHERE gateway_order_id=@oid AND user_id=@uid AND payment_status='Created' LIMIT 1", c))
        {
            check.Parameters.AddWithValue("@oid", r.OrderId); check.Parameters.AddWithValue("@uid", Uid);
            var amount = await check.ExecuteScalarAsync();
            if (amount is null || amount is DBNull) return Conflict(new { message = "Payment order is invalid, expired or already completed." });
            expectedAmount = Convert.ToDecimal(amount);
        }

        // Verify the payment directly with Razorpay too; a valid signature alone is not proof of capture.
        using var gatewayRequest = new HttpRequestMessage(HttpMethod.Get, $"https://api.razorpay.com/v1/payments/{Uri.EscapeDataString(r.PaymentId)}");
        gatewayRequest.Headers.Authorization = new AuthenticationHeaderValue("Basic", Convert.ToBase64String(Encoding.ASCII.GetBytes($"{KeyId}:{Secret}")));
        using var gatewayResponse = await _http.SendAsync(gatewayRequest);
        if (!gatewayResponse.IsSuccessStatusCode)
            return StatusCode(502, new { message = "Could not confirm payment status with Razorpay. Please retry." });
        using var paymentDoc = JsonDocument.Parse(await gatewayResponse.Content.ReadAsStringAsync());
        var root = paymentDoc.RootElement;
        var gatewayOrderId = root.TryGetProperty("order_id", out var oid) ? oid.GetString() : null;
        var status = root.TryGetProperty("status", out var st) ? st.GetString() : null;
        var captured = root.TryGetProperty("captured", out var cap) && cap.ValueKind == JsonValueKind.True;
        var gatewayAmount = root.TryGetProperty("amount", out var amt) ? amt.GetInt64() : -1;
        var currency = root.TryGetProperty("currency", out var cur) ? cur.GetString() : null;
        if (gatewayOrderId != r.OrderId || status != "captured" || !captured || currency != "INR" || gatewayAmount != (long)Math.Round(expectedAmount * 100m))
            return BadRequest(new { message = "Razorpay payment is not captured or the amount/order does not match." });

        await using var cmd = new MySqlCommand("UPDATE meeting_payments SET payment_status='Paid',method='Razorpay',gateway_payment_id=@pid,transaction_id=@pid,paid_at=UTC_TIMESTAMP() WHERE gateway_order_id=@oid AND user_id=@uid AND payment_status='Created'", c);
        cmd.Parameters.AddWithValue("@pid", r.PaymentId); cmd.Parameters.AddWithValue("@oid", r.OrderId); cmd.Parameters.AddWithValue("@uid", Uid);
        if (await cmd.ExecuteNonQueryAsync() != 1) return Conflict(new { message = "Payment already completed or order is invalid." });
        return Ok(new { message = "Payment successful.", paymentId = r.PaymentId });
    }

    [HttpGet("mine")]
    [Authorize(Roles="user,admin")]
    public async Task<IActionResult> Mine()=>await List(false);

    [HttpGet("admin")]
    [Authorize(Roles="admin")]
    public async Task<IActionResult> Admin()=>await List(true);

    private async Task<IActionResult> List(bool admin)
    {
        await using var c=_db.Connect();await c.OpenAsync();
        await MeetingsController.EnsureTablesAndColumnsAsync(c);
        var sql=admin?"""SELECT p.id,p.meeting_id,p.user_id,p.meeting_title,p.user_name,p.user_email,p.amount,p.method,p.transaction_id,p.gateway_order_id,p.gateway_payment_id,p.payment_status,p.paid_at,p.created_at,m.meeting_code FROM meeting_payments p LEFT JOIN meetings m ON m.id=p.meeting_id ORDER BY p.created_at DESC"""
        :"""SELECT p.id,p.meeting_id,p.user_id,p.meeting_title,p.user_name,p.user_email,p.amount,p.method,p.transaction_id,p.gateway_order_id,p.gateway_payment_id,p.payment_status,p.paid_at,p.created_at,m.meeting_code FROM meeting_payments p LEFT JOIN meetings m ON m.id=p.meeting_id WHERE p.user_id=@uid ORDER BY p.created_at DESC""";
        await using var cmd=new MySqlCommand(sql,c);if(!admin)cmd.Parameters.AddWithValue("@uid",Uid);
        var list=new List<object>();await using var rd=await cmd.ExecuteReaderAsync();
        while(await rd.ReadAsync())
        {
            DateTime? paidAt = rd.IsDBNull(12) ? (DateTime?)null : DateTime.SpecifyKind(rd.GetDateTime(12), DateTimeKind.Local).ToUniversalTime();
            string? orderId = rd.IsDBNull(9) ? null : rd.GetString(9);
            string? paymentId = rd.IsDBNull(10) ? null : rd.GetString(10);
            string? meetingCode = rd.IsDBNull(14) ? null : rd.GetString(14);
            list.Add(new
            {
                id=rd.GetInt32(0), meetingId=rd.GetInt32(1), userId=rd.GetInt32(2), meetingTitle=rd.GetString(3), userName=rd.GetString(4), userEmail=rd.GetString(5),
                amount=rd.GetDecimal(6), method=rd.GetString(7), transactionId=rd.GetString(8), orderId, paymentId,
                paymentStatus=rd.GetString(11), paidAt, createdAt=DateTime.SpecifyKind(rd.GetDateTime(13), DateTimeKind.Local).ToUniversalTime(), meetingCode
            });
        }
        return Ok(list);
    }
    private static string Normalize(string s)=>s?.Trim().ToUpperInvariant() switch{"UPI"=>"UPI","CARD"=>"Card","NETBANKING"=>"Netbanking","WALLET"=>"Wallet","RAZORPAY"=>"Razorpay",_=>"Online Payment"};
}
