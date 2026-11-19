namespace Api.Modules.Inventory.Contracts;

public sealed record DashboardResponse(
    decimal CompletedSalesTotal,
    long SoldUnits,
    long AvailableUnits,
    long RegisteredModels);
