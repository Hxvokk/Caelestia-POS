namespace Api.Modules.Users.Contracts;

public sealed record VendorResponse(
    Guid Id,
    string Name,
    string Email,
    bool IsActive);
