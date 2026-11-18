using Api.Modules.Inventory.Models;
using Api.Modules.Users.Contracts;
using Api.Modules.Users.Repositories;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Npgsql;

namespace Api.Modules.Users.Services;

public sealed class VendorService(
    IUserProfileRepository repository,
    ISupabaseAuthAdminClient authAdminClient,
    ILogger<VendorService> logger) : IVendorService
{
    public async Task<IReadOnlyList<VendorResponse>> GetAllAsync(CancellationToken cancellationToken)
    {
        var users = await repository.GetVendorsAsync(cancellationToken);
        return users.Select(ToResponse).ToArray();
    }

    public async Task<VendorResponse> CreateAsync(
        string name,
        string email,
        string password,
        CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim();
        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await repository.EmailExistsAsync(normalizedEmail, cancellationToken))
        {
            throw new VendorEmailAlreadyExistsException();
        }

        var authUserId = await authAdminClient.CreateUserAsync(
            normalizedName,
            normalizedEmail,
            password,
            cancellationToken);
        var profile = new UserProfile
        {
            Id = authUserId,
            Name = normalizedName,
            Email = normalizedEmail,
            Role = "vendedor",
            IsActive = true
        };

        try
        {
            await repository.AddAsync(profile, cancellationToken);
        }
        catch (DbUpdateException exception)
        {
            await TryDeleteOrphanedAuthUserAsync(authUserId, cancellationToken);
            if (exception.InnerException is PostgresException
                {
                    SqlState: PostgresErrorCodes.UniqueViolation
                })
            {
                throw new VendorEmailAlreadyExistsException();
            }

            throw;
        }
        catch
        {
            await TryDeleteOrphanedAuthUserAsync(authUserId, cancellationToken);
            throw;
        }

        return ToResponse(profile);
    }

    public async Task<bool> SetActiveAsync(
        Guid id,
        bool isActive,
        CancellationToken cancellationToken)
    {
        var profile = await repository.GetVendorByIdForUpdateAsync(id, cancellationToken);
        if (profile is null)
        {
            return false;
        }

        var previousStatus = profile.IsActive;
        if (previousStatus == isActive)
        {
            return true;
        }

        await authAdminClient.SetUserBlockedAsync(id, !isActive, cancellationToken);
        profile.IsActive = isActive;
        try
        {
            await repository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            try
            {
                await authAdminClient.SetUserBlockedAsync(id, !previousStatus, cancellationToken);
            }
            catch (Exception rollbackException)
            {
                logger.LogCritical(
                    rollbackException,
                    "No se pudo compensar el estado de Auth para el usuario {UserId}; requiere reconciliación manual.",
                    id);
            }

            throw;
        }

        return true;
    }

    private async Task TryDeleteOrphanedAuthUserAsync(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            await authAdminClient.DeleteUserAsync(id, cancellationToken);
        }
        catch (Exception exception)
        {
            logger.LogCritical(
                exception,
                "No se pudo compensar la creación de Auth para el usuario {UserId}; requiere reconciliación manual.",
                id);
        }
    }

    private static VendorResponse ToResponse(UserProfile profile) =>
        new(profile.Id, profile.Name, profile.Email, profile.IsActive);
}
