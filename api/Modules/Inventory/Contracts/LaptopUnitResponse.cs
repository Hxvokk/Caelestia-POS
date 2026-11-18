namespace Api.Modules.Inventory.Contracts;

public sealed record LaptopUnitResponse(
    long Id,
    long ModelId,
    string ModelName,
    long BrandId,
    string BrandName,
    string SerialNumber,
    string Status,
    DateTimeOffset RegisteredAt);
