using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class CreateSaleRequest
{
    [Required]
    [MinLength(1)]
    [MaxLength(20)]
    public List<long> UnitIds { get; init; } = [];

    [Required]
    [RegularExpression("^(efectivo|debito|credito)$")]
    public string PaymentMethod { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "9999999999.99")]
    public decimal? AmountReceived { get; init; }
}
