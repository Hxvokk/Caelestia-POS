using Api.Data;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Users.Repositories;

public sealed class UserProfileRepository(AppDbContext dbContext) : IUserProfileRepository
{
    public async Task<IReadOnlyList<UserProfile>> GetVendorsAsync(CancellationToken cancellationToken) =>
        await dbContext.UserProfiles
            .AsNoTracking()
            .Where(user => user.Role == "vendedor")
            .OrderBy(user => user.Name)
            .ToListAsync(cancellationToken);

    public Task<UserProfile?> GetVendorByIdForUpdateAsync(
        Guid id,
        CancellationToken cancellationToken) =>
        dbContext.UserProfiles.SingleOrDefaultAsync(
            user => user.Id == id && user.Role == "vendedor",
            cancellationToken);

    public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken) =>
        dbContext.UserProfiles.AnyAsync(
            user => user.Email.ToLower() == email.ToLower(),
            cancellationToken);

    public async Task AddAsync(UserProfile profile, CancellationToken cancellationToken)
    {
        dbContext.UserProfiles.Add(profile);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);
}
