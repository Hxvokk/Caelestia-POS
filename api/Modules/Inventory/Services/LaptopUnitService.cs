using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Modules.Inventory.Services;

public sealed class LaptopUnitService(ILaptopUnitRepository repository) : ILaptopUnitService
{
    public async Task<IReadOnlyList<LaptopUnitResponse>> GetAllAsync(
        LaptopUnitQuery query,
        CancellationToken cancellationToken)
    {
        var units = await repository.GetAllAsync(query, cancellationToken);
        return units.Select(ToResponse).ToArray();
    }

    public async Task<LaptopUnitResponse?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var unit = await repository.GetByIdAsync(id, cancellationToken);
        return unit is null ? null : ToResponse(unit);
    }

    public async Task<(UnitWriteResult Result, LaptopUnitResponse? Unit)> CreateAsync(
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken)
    {
        if (!await repository.ModelExistsAsync(request.ModelId, cancellationToken))
        {
            return (UnitWriteResult.ModelNotFound, null);
        }

        var serialNumber = request.SerialNumber.Trim();
        if (await repository.SerialNumberExistsAsync(serialNumber, cancellationToken))
        {
            return (UnitWriteResult.DuplicateSerialNumber, null);
        }

        var unit = new LaptopUnit
        {
            LaptopModelId = request.ModelId,
            SerialNumber = serialNumber,
            Status = "disponible"
        };

        try
        {
            await repository.AddAsync(unit, cancellationToken);
            var createdUnit = await repository.GetByIdAsync(unit.Id, cancellationToken);
            return (UnitWriteResult.Success, createdUnit is null ? null : ToResponse(createdUnit));
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return (UnitWriteResult.DuplicateSerialNumber, null);
        }
    }

    public async Task<UnitWriteResult> UpdateAsync(
        long id,
        SaveLaptopUnitRequest request,
        CancellationToken cancellationToken)
    {
        var unit = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (unit is null)
        {
            return UnitWriteResult.UnitNotFound;
        }

        if (unit.Status != "disponible" || await repository.HasSaleHistoryAsync(id, cancellationToken))
        {
            return UnitWriteResult.UnitNotAvailable;
        }

        if (!await repository.ModelExistsAsync(request.ModelId, cancellationToken))
        {
            return UnitWriteResult.ModelNotFound;
        }

        var serialNumber = request.SerialNumber.Trim();
        if (await repository.SerialNumberExistsForOtherUnitAsync(id, serialNumber, cancellationToken))
        {
            return UnitWriteResult.DuplicateSerialNumber;
        }

        unit.LaptopModelId = request.ModelId;
        unit.SerialNumber = serialNumber;

        try
        {
            await repository.SaveChangesAsync(cancellationToken);
            return UnitWriteResult.Success;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return UnitWriteResult.DuplicateSerialNumber;
        }
    }

    public async Task<UnitDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken)
    {
        var unit = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (unit is null)
        {
            return UnitDeleteResult.UnitNotFound;
        }

        if (unit.Status != "disponible" || await repository.HasSaleHistoryAsync(id, cancellationToken))
        {
            return UnitDeleteResult.HasSaleHistory;
        }

        try
        {
            await repository.DeleteAsync(unit, cancellationToken);
            return UnitDeleteResult.Deleted;
        }
        catch (DbUpdateException exception) when (IsForeignKeyViolation(exception))
        {
            return UnitDeleteResult.HasSaleHistory;
        }
    }

    private static LaptopUnitResponse ToResponse(LaptopUnit unit) =>
        new(
            unit.Id,
            unit.LaptopModelId,
            unit.LaptopModel.Name,
            unit.LaptopModel.BrandId,
            unit.LaptopModel.Brand.Name,
            unit.SerialNumber,
            unit.Status,
            unit.RegisteredAt);

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
