namespace Api.Modules.Inventory.Models;

public sealed class SaleDetail
{
    public long Id { get; set; }

    public long SaleId { get; set; }

    public long LaptopUnitId { get; set; }

    public decimal UnitPrice { get; set; }

    public Sale Sale { get; set; } = null!;

    public LaptopUnit LaptopUnit { get; set; } = null!;
}
