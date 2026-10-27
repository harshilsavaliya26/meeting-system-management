
using System.ComponentModel.DataAnnotations;

namespace MeetSphere.Api;

public class CreatePaymentOrderRequest
{
    [Required]
    public int MeetingId { get; set; }
}

public class InAppPaymentRequest
{
    [Required]
    public string OrderId { get; set; } = string.Empty;

    public string Method { get; set; } = string.Empty;
    public bool Demo { get; set; } = false;
}

public class VerifyPaymentRequest
{
    [Required]
    public string OrderId { get; set; } = string.Empty;

    [Required]
    public string PaymentId { get; set; } = string.Empty;

    [Required]
    public string Signature { get; set; } = string.Empty;
}
