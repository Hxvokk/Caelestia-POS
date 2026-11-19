using Api.Data;
using Api.Modules.Inventory.Models;
using Microsoft.EntityFrameworkCore;

namespace Api.Modules.Inventory.Repositories;

public sealed class SaleRepository(AppDbContext dbContext) : ISaleRepository
{
    public async Task<IReadOnlyList<Sale>> GetHistoryAsync(
        Guid? userId,
        CancellationToken cancellationToken)
    {
        var sales = dbContext.Sales
            .AsNoTracking()
            .Include(sale => sale.Payment)
            .Include(sale => sale.Details)
            .AsQueryable();

        if (userId.HasValue)
        {
            sales = sales.Where(sale => sale.UserId == userId.Value);
        }

        return await sales
            .OrderByDescending(sale => sale.Date)
            .ThenByDescending(sale => sale.Id)
            .ToListAsync(cancellationToken);
    }

    public Task<Sale?> GetByIdAsync(
        long saleId,
        Guid? userId,
        CancellationToken cancellationToken)
    {
        var sale = dbContext.Sales
            .AsNoTracking()
            .Include(item => item.Payment)
            .Include(item => item.Details)
                .ThenInclude(detail => detail.LaptopUnit)
                    .ThenInclude(unit => unit.LaptopModel)
                        .ThenInclude(model => model.Brand)
            .AsQueryable();

        if (userId.HasValue)
        {
            sale = sale.Where(item => item.UserId == userId.Value);
        }

        return sale.SingleOrDefaultAsync(item => item.Id == saleId, cancellationToken);
    }

    public Task<string?> GetSellerNameAsync(Guid userId, CancellationToken cancellationToken) =>
        dbContext.UserProfiles
            .AsNoTracking()
            .Where(profile => profile.Id == userId)
            .Select(profile => profile.Name)
            .SingleOrDefaultAsync(cancellationToken);
}
