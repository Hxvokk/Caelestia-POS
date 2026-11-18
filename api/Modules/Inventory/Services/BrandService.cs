using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Modules.Inventory.Services;

public sealed class BrandService(IBrandRepository repository) : IBrandService
{
    public Task<IReadOnlyList<Brand>> GetAllAsync(CancellationToken cancellationToken) =>
        repository.GetAllAsync(cancellationToken);

    public Task<Brand?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        repository.GetByIdAsync(id, cancellationToken);

    public async Task<Brand?> CreateAsync(string name, CancellationToken cancellationToken)
    {
        var normalizedName = name.Trim();
        if (await repository.NameExistsAsync(normalizedName, cancellationToken))
        {
            return null;
        }

        var brand = new Brand { Name = normalizedName };
        await repository.AddAsync(brand, cancellationToken);
        return brand;
    }

    public async Task<BrandUpdateResult> UpdateAsync(
        long id,
        string name,
        CancellationToken cancellationToken)
    {
        var brand = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (brand is null)
        {
            return BrandUpdateResult.BrandNotFound;
        }

        var normalizedName = name.Trim();
        if (await repository.NameExistsAsync(normalizedName, cancellationToken, id))
        {
            return BrandUpdateResult.DuplicateName;
        }

        brand.Name = normalizedName;
        try
        {
            await repository.SaveChangesAsync(cancellationToken);
            return BrandUpdateResult.Success;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return BrandUpdateResult.DuplicateName;
        }
    }

    public async Task<BrandDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken)
    {
        var brand = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (brand is null)
        {
            return BrandDeleteResult.BrandNotFound;
        }

        if (await repository.HasModelsAsync(id, cancellationToken))
        {
            return BrandDeleteResult.HasModels;
        }

        try
        {
            await repository.DeleteAsync(brand, cancellationToken);
            return BrandDeleteResult.Deleted;
        }
        catch (DbUpdateException exception) when (IsForeignKeyViolation(exception))
        {
            return BrandDeleteResult.HasModels;
        }
    }

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation
        };

    private static bool IsForeignKeyViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.ForeignKeyViolation
        };
}
