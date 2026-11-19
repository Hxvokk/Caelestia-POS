using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Advisor.Contracts;

public sealed class LaptopRecommendationRequest
{
    [Range(typeof(decimal), "0.01", "9999999999.99")]
    public decimal Budget { get; init; }

    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Needs { get; init; } = string.Empty;

    [StringLength(200)]
    public string? Software { get; init; }

    [StringLength(100)]
    public string? Resolution { get; init; }

    [Range(1, 2048)]
    public int? MinimumRamGb { get; init; }

    [Range(1, 100_000)]
    public int? MinimumStorageGb { get; init; }

    [StringLength(150)]
    public string? RequiredGpu { get; init; }
}
