namespace Api.Modules.Inventory.Models;

public sealed class Brand
{
    public long Id { get; set; }

    public string Name { get; set; } = string.Empty;

    public ICollection<LaptopModel> Models { get; set; } = new List<LaptopModel>();
}
