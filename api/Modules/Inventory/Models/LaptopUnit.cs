namespace Api.Modules.Inventory.Models;

public sealed class LaptopUnit
{
    public long Id { get; set; }

    public long LaptopModelId { get; set; }

    public string SerialNumber { get; set; } = string.Empty;

    public string Status { get; set; } = "disponible";

    public DateTimeOffset RegisteredAt { get; set; }

    public LaptopModel LaptopModel { get; set; } = null!;
}
