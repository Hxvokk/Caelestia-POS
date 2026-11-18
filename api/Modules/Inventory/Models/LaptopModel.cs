namespace Api.Modules.Inventory.Models;

public sealed class LaptopModel
{
    public long Id { get; set; }

    public long BrandId { get; set; }

    public string? Sku { get; set; }

    public string Name { get; set; } = string.Empty;

    public string ProcessorOrChip { get; set; } = string.Empty;

    public int? CpuCores { get; set; }

    public int? CpuThreads { get; set; }

    public int? UnifiedMemoryGb { get; set; }

    public int? RamGb { get; set; }

    public int StorageGb { get; set; }

    public string StorageType { get; set; } = string.Empty;

    public string? Gpu { get; set; }

    public string? GpuType { get; set; }

    public decimal? GpuVramGb { get; set; }

    public string? CpuLevel { get; set; }

    public string? GpuLevel { get; set; }

    public decimal Price { get; set; }

    public string? PriceSourceUrl { get; set; }

    public DateOnly? PriceCheckedOn { get; set; }

    public string? SpecificationsSource { get; set; }

    public string? ImageUrl { get; set; }

    public string? ImageSourceUrl { get; set; }

    public string? ImageTermsUrl { get; set; }

    public string ImageRightsStatus { get; set; } = "no_confirmado";

    public DateTimeOffset CreatedAt { get; set; }

    public Brand Brand { get; set; } = null!;

    public ICollection<LaptopUnit> Units { get; set; } = new List<LaptopUnit>();
}
