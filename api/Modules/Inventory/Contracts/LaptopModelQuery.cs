using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class LaptopModelQuery : IValidatableObject
{
    [Range(1, long.MaxValue)]
    public long? BrandId { get; init; }

    [Range(typeof(decimal), "0.01", "9999999999.99")]
    public decimal? MinPrice { get; init; }

    [Range(typeof(decimal), "0.01", "9999999999.99")]
    public decimal? MaxPrice { get; init; }

    [StringLength(150)]
    public string? Processor { get; init; }

    [Range(1, int.MaxValue)]
    public int? MinMemoryGb { get; init; }

    public bool? AvailableOnly { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (MinPrice.HasValue && MaxPrice.HasValue && MinPrice > MaxPrice)
        {
            yield return new ValidationResult(
                "El precio mínimo no puede ser mayor que el precio máximo.",
                [nameof(MinPrice), nameof(MaxPrice)]);
        }
    }
}
