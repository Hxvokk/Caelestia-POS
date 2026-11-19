namespace Api.Modules.Advisor.Contracts;

public sealed record LaptopRecommendationResponse(
    string Status,
    string Message,
    bool UsedAi,
    IReadOnlyList<RecommendedLaptopResponse> Recommendations);

public sealed record RecommendedLaptopResponse(
    long ModelId,
    string BrandName,
    string ModelName,
    decimal Price,
    string ProcessorOrChip,
    int? RamGb,
    int? UnifiedMemoryGb,
    int StorageGb,
    string? Gpu,
    string MatchSummary,
    IReadOnlyList<string> Limitations);
