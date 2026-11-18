namespace Api.Modules.Inventory.Models;

public sealed class SalePayment
{
    public long Id { get; set; }

    public long SaleId { get; set; }

    public string Method { get; set; } = string.Empty;

    public decimal Amount { get; set; }

    public decimal? AmountReceived { get; set; }

    public decimal Change { get; set; }

    public string Status { get; set; } = "aprobado";

    public string? Reference { get; set; }

    public bool IsSimulated { get; set; } = true;

    public DateTimeOffset Date { get; set; }

    public Sale Sale { get; set; } = null!;
}
