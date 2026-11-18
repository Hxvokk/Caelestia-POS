namespace Api.Modules.Inventory.Contracts;

public sealed record SaleLineResponse(
    long UnitId,
    string SerialNumber,
    string BrandName,
    string ModelName,
    decimal UnitPrice);

public sealed record SaleResponse(
    long Id,
    Guid UserId,
    DateTimeOffset Date,
    decimal Total,
    string Status,
    string PaymentMethod,
    decimal? AmountReceived,
    decimal Change,
    bool IsSimulated,
    IReadOnlyList<SaleLineResponse> Items);
