using Api.Modules.Inventory.Contracts;
using Api.Modules.Inventory.Models;
using Api.Modules.Inventory.Repositories;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace Api.Modules.Inventory.Services;

public sealed class LaptopModelService(ILaptopModelRepository repository) : ILaptopModelService
{
    public async Task<IReadOnlyList<LaptopModelResponse>> GetAllAsync(
        LaptopModelQuery query,
        CancellationToken cancellationToken)
    {
        var models = await repository.GetAllAsync(query, cancellationToken);
        return models.Select(ToResponse).ToArray();
    }

    public async Task<LaptopModelResponse?> GetByIdAsync(long id, CancellationToken cancellationToken)
    {
        var model = await repository.GetByIdAsync(id, cancellationToken);
        return model is null ? null : ToResponse(model);
    }

    public async Task<(ModelWriteResult Result, LaptopModelResponse? Model)> CreateAsync(
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken)
    {
        var brand = await repository.GetBrandByIdAsync(request.BrandId, cancellationToken);
        if (brand is null)
        {
            return (ModelWriteResult.BrandNotFound, null);
        }

        var sku = NormalizeOptional(request.Sku);
        if (sku is not null && await repository.SkuExistsAsync(brand.Id, sku, null, cancellationToken))
        {
            return (ModelWriteResult.DuplicateSku, null);
        }

        var model = new LaptopModel
        {
            BrandId = brand.Id,
            Brand = brand,
            Sku = sku,
            Name = request.Name.Trim(),
            ProcessorOrChip = request.ProcessorOrChip.Trim(),
            CpuCores = request.CpuCores,
            CpuThreads = request.CpuThreads,
            UnifiedMemoryGb = request.UnifiedMemoryGb,
            RamGb = request.RamGb,
            StorageGb = request.StorageGb,
            StorageType = request.StorageType.Trim(),
            Gpu = NormalizeOptional(request.Gpu),
            GpuType = NormalizeOptional(request.GpuType),
            GpuVramGb = request.GpuVramGb,
            CpuLevel = NormalizeOptional(request.CpuLevel),
            GpuLevel = NormalizeOptional(request.GpuLevel),
            Price = request.Price,
            PriceSourceUrl = NormalizeOptional(request.PriceSourceUrl),
            PriceCheckedOn = request.PriceCheckedOn,
            SpecificationsSource = NormalizeOptional(request.SpecificationsSource),
            ImageUrl = NormalizeOptional(request.ImageUrl),
            ImageSourceUrl = NormalizeOptional(request.ImageSourceUrl),
            ImageTermsUrl = NormalizeOptional(request.ImageTermsUrl),
            ImageRightsStatus = request.ImageRightsStatus
        };

        try
        {
            await repository.AddAsync(model, cancellationToken);
            return (ModelWriteResult.Success, ToResponse(model));
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return (ModelWriteResult.DuplicateSku, null);
        }
    }

    public async Task<ModelWriteResult> UpdateAsync(
        long id,
        SaveLaptopModelRequest request,
        CancellationToken cancellationToken)
    {
        var model = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (model is null)
        {
            return ModelWriteResult.ModelNotFound;
        }

        var brand = await repository.GetBrandByIdAsync(request.BrandId, cancellationToken);
        if (brand is null)
        {
            return ModelWriteResult.BrandNotFound;
        }

        var sku = NormalizeOptional(request.Sku);
        if (sku is not null
            && await repository.SkuExistsAsync(brand.Id, sku, model.Id, cancellationToken))
        {
            return ModelWriteResult.DuplicateSku;
        }

        model.BrandId = brand.Id;
        model.Brand = brand;
        model.Sku = sku;
        model.Name = request.Name.Trim();
        model.ProcessorOrChip = request.ProcessorOrChip.Trim();
        model.CpuCores = request.CpuCores;
        model.CpuThreads = request.CpuThreads;
        model.UnifiedMemoryGb = request.UnifiedMemoryGb;
        model.RamGb = request.RamGb;
        model.StorageGb = request.StorageGb;
        model.StorageType = request.StorageType.Trim();
        model.Gpu = NormalizeOptional(request.Gpu);
        model.GpuType = NormalizeOptional(request.GpuType);
        model.GpuVramGb = request.GpuVramGb;
        model.CpuLevel = NormalizeOptional(request.CpuLevel);
        model.GpuLevel = NormalizeOptional(request.GpuLevel);
        model.Price = request.Price;
        model.PriceSourceUrl = NormalizeOptional(request.PriceSourceUrl);
        model.PriceCheckedOn = request.PriceCheckedOn;
        model.SpecificationsSource = NormalizeOptional(request.SpecificationsSource);
        model.ImageUrl = NormalizeOptional(request.ImageUrl);
        model.ImageSourceUrl = NormalizeOptional(request.ImageSourceUrl);
        model.ImageTermsUrl = NormalizeOptional(request.ImageTermsUrl);
        model.ImageRightsStatus = request.ImageRightsStatus;

        try
        {
            await repository.SaveChangesAsync(cancellationToken);
            return ModelWriteResult.Success;
        }
        catch (DbUpdateException exception) when (IsUniqueViolation(exception))
        {
            return ModelWriteResult.DuplicateSku;
        }
    }

    public async Task<ModelDeleteResult> DeleteAsync(long id, CancellationToken cancellationToken)
    {
        var model = await repository.GetByIdForUpdateAsync(id, cancellationToken);
        if (model is null)
        {
            return ModelDeleteResult.ModelNotFound;
        }

        if (await repository.HasUnitsAsync(id, cancellationToken))
        {
            return ModelDeleteResult.HasUnits;
        }

        try
        {
            await repository.DeleteAsync(model, cancellationToken);
            return ModelDeleteResult.Deleted;
        }
        catch (DbUpdateException exception) when (IsForeignKeyViolation(exception))
        {
            return ModelDeleteResult.HasUnits;
        }
    }

    private static LaptopModelResponse ToResponse(LaptopModel model) =>
        new(
            model.Id,
            model.BrandId,
            model.Brand.Name,
            model.Sku,
            model.Name,
            model.ProcessorOrChip,
            model.CpuCores,
            model.CpuThreads,
            model.UnifiedMemoryGb,
            model.RamGb,
            model.StorageGb,
            model.StorageType,
            model.Gpu,
            model.GpuType,
            model.GpuVramGb,
            model.CpuLevel,
            model.GpuLevel,
            model.Price,
            model.PriceSourceUrl,
            model.PriceCheckedOn,
            model.SpecificationsSource,
            model.ImageUrl,
            model.ImageSourceUrl,
            model.ImageTermsUrl,
            model.ImageRightsStatus,
            model.CreatedAt);

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();

    private static bool IsForeignKeyViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.ForeignKeyViolation
        };

    private static bool IsUniqueViolation(DbUpdateException exception) =>
        exception.InnerException is PostgresException
        {
            SqlState: PostgresErrorCodes.UniqueViolation
        };
}
