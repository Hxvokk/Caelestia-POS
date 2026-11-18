using Api.Modules.Users.Contracts;

namespace Api.Modules.Users.Services;

public interface IVendorService
{
    Task<IReadOnlyList<VendorResponse>> GetAllAsync(CancellationToken cancellationToken);

    Task<VendorResponse> CreateAsync(
        string name,
        string email,
        string password,
        CancellationToken cancellationToken);

    Task<bool> SetActiveAsync(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken);
}
