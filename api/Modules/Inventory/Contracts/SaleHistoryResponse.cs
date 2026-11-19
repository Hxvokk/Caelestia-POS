namespace Api.Modules.Inventory.Contracts;

public sealed record SaleHistoryItemResponse(
    long Id,
    DateTimeOffset Date,
    decimal Total,
    string Status,
    string PaymentMethod,
    int ItemCount);

public sealed record SaleHistoryDetailResponse(
    long Id,
    Guid UserId,
    string SellerName,
    DateTimeOffset Date,
    decimal Total,
    string Status,
    string PaymentMethod,
    decimal? AmountReceived,
    decimal Change,
    bool IsSimulated,
    IReadOnlyList<SaleLineResponse> Items);
