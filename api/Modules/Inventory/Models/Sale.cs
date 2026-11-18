namespace Api.Modules.Inventory.Models;

public sealed class Sale
{
    public long Id { get; set; }

    public Guid UserId { get; set; }

    public DateTimeOffset Date { get; set; }

    public decimal Total { get; set; }

    public string Status { get; set; } = "completada";

    public ICollection<SaleDetail> Details { get; set; } = new List<SaleDetail>();

    public SalePayment Payment { get; set; } = null!;
}
