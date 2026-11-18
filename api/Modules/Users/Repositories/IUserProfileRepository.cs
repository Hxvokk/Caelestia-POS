using Api.Modules.Inventory.Models;

namespace Api.Modules.Users.Repositories;

public interface IUserProfileRepository
{
    Task<IReadOnlyList<UserProfile>> GetVendorsAsync(CancellationToken cancellationToken);

    Task<UserProfile?> GetVendorByIdForUpdateAsync(Guid id, CancellationToken cancellationToken);

    Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken);

    Task AddAsync(UserProfile profile, CancellationToken cancellationToken);

    Task SaveChangesAsync(CancellationToken cancellationToken);
}
