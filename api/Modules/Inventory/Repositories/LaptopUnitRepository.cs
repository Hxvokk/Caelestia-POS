using Api.Data;
using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Inventory.Repositories;

public sealed class LaptopUnitRepository(AppDbContext dbContext) : ILaptopUnitRepository
{
    public async Task<IReadOnlyList<LaptopUnit>> GetAllAsync(
        LaptopUnitQuery query,
        CancellationToken cancellationToken)
    {
        var units = dbContext.LaptopUnits
            .AsNoTracking()
            .Include(unit => unit.LaptopModel)
            .ThenInclude(model => model.Brand)
            .AsQueryable();

        if (query.ModelId.HasValue)
        {
            units = units.Where(unit => unit.LaptopModelId == query.ModelId.Value);
        }

        if (!string.IsNullOrWhiteSpace(query.Status))
        {
            units = units.Where(unit => unit.Status == query.Status);
        }

        return await units
            .OrderBy(unit => unit.LaptopModel.Name)
            .ThenBy(unit => unit.SerialNumber)
            .ToListAsync(cancellationToken);
    }

    public Task<LaptopUnit?> GetByIdAsync(long id, CancellationToken cancellationToken) =>
        dbContext.LaptopUnits
            .AsNoTracking()
            .Include(unit => unit.LaptopModel)
            .ThenInclude(model => model.Brand)
            .SingleOrDefaultAsync(unit => unit.Id == id, cancellationToken);

    public Task<LaptopUnit?> GetByIdForUpdateAsync(long id, CancellationToken cancellationToken) =>
        dbContext.LaptopUnits
            .Include(unit => unit.LaptopModel)
            .ThenInclude(model => model.Brand)
            .SingleOrDefaultAsync(unit => unit.Id == id, cancellationToken);

    public Task<bool> ModelExistsAsync(long modelId, CancellationToken cancellationToken) =>
        dbContext.LaptopModels.AnyAsync(model => model.Id == modelId, cancellationToken);

    public Task<bool> SerialNumberExistsAsync(string serialNumber, CancellationToken cancellationToken) =>
        dbContext.LaptopUnits.AnyAsync(unit => unit.SerialNumber == serialNumber, cancellationToken);

    public Task<bool> SerialNumberExistsForOtherUnitAsync(
        long unitId,
        string serialNumber,
        CancellationToken cancellationToken) =>
        dbContext.LaptopUnits.AnyAsync(
            unit => unit.Id != unitId && unit.SerialNumber == serialNumber,
            cancellationToken);

    public Task<bool> HasSaleHistoryAsync(long unitId, CancellationToken cancellationToken) =>
        dbContext.SaleDetails.AnyAsync(detail => detail.LaptopUnitId == unitId, cancellationToken);

    public async Task AddAsync(LaptopUnit unit, CancellationToken cancellationToken)
    {
        dbContext.LaptopUnits.Add(unit);
        await dbContext.SaveChangesAsync(cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken) =>
        dbContext.SaveChangesAsync(cancellationToken);

    public async Task DeleteAsync(LaptopUnit unit, CancellationToken cancellationToken)
    {
        dbContext.LaptopUnits.Remove(unit);
        await dbContext.SaveChangesAsync(cancellationToken);
    }
}
