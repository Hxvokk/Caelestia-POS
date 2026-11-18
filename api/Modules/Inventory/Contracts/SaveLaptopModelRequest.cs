using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class SaveLaptopModelRequest
{
    [Range(1, long.MaxValue)]
    public long BrandId { get; init; }

    [StringLength(120, MinimumLength = 1)]
    public string? Sku { get; init; }

    [Required]
    [StringLength(120, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;

    [Required]
    [StringLength(150, MinimumLength = 1)]
    public string ProcessorOrChip { get; init; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int? CpuCores { get; init; }

    [Range(1, int.MaxValue)]
    public int? CpuThreads { get; init; }

    [Range(1, int.MaxValue)]
    public int? UnifiedMemoryGb { get; init; }

    [Range(1, int.MaxValue)]
    public int? RamGb { get; init; }

    [Range(1, int.MaxValue)]
    public int StorageGb { get; init; }

    [Required]
    [StringLength(20, MinimumLength = 1)]
    public string StorageType { get; init; } = string.Empty;

    [StringLength(150)]
    public string? Gpu { get; init; }

    [RegularExpression("^(integrada|dedicada|híbrida)$")]
    public string? GpuType { get; init; }

    [Range(typeof(decimal), "0.01", "9999.99")]
    public decimal? GpuVramGb { get; init; }

    [RegularExpression("^(básico|medio|alto)$")]
    public string? CpuLevel { get; init; }

    [RegularExpression("^(básico|medio|alto)$")]
    public string? GpuLevel { get; init; }

    [Range(typeof(decimal), "0.01", "9999999999.99")]
    public decimal Price { get; init; }

    [Url]
    public string? PriceSourceUrl { get; init; }

    public DateOnly? PriceCheckedOn { get; init; }

    public string? SpecificationsSource { get; init; }

    [Url]
    public string? ImageUrl { get; init; }

    [Url]
    public string? ImageSourceUrl { get; init; }

    [Url]
    public string? ImageTermsUrl { get; init; }

    [RegularExpression("^(no_confirmado|permiso_confirmado|licencia_abierta)$")]
    public string ImageRightsStatus { get; init; } = "no_confirmado";
}
