using Api.Modules.Inventory.Repositories;
using Microsoft.AspNetCore.Http;

namespace Api.Modules.Inventory.Services;

public sealed class ModelImageService(
    ILaptopModelRepository repository,
    IModelImageStorage storage) : IModelImageService
{
    public async Task<(ModelImageWriteResult Result, ModelImageResponse? Image)> UploadAsync(
        long modelId,
        IFormFile? file,
        CancellationToken cancellationToken)
    {
        if (file is null ||
            file.Length is <= 0 or > ModelImageFileValidator.MaximumFileSizeBytes)
        {
            return (ModelImageWriteResult.InvalidImage, null);
        }

        var model = await repository.GetByIdForUpdateAsync(modelId, cancellationToken);
        if (model is null)
        {
            return (ModelImageWriteResult.ModelNotFound, null);
        }

        await using var buffer = new MemoryStream((int)file.Length);
        await file.CopyToAsync(buffer, cancellationToken);
        var bytes = buffer.ToArray();
        if (!ModelImageFileValidator.TryGetFormat(
                file.ContentType,
                bytes.AsSpan(0, Math.Min(bytes.Length, 12)),
                out var format))
        {
            return (ModelImageWriteResult.InvalidImage, null);
        }

        var stored = await storage.UploadAsync(
            modelId,
            bytes,
            format!.ContentType,
            format.Extension,
            cancellationToken);
        if (stored is null)
        {
            return (ModelImageWriteResult.StorageUnavailable, null);
        }

        var previousImageUrl = model.ImageUrl;
        model.ImageUrl = stored.PublicUrl;
        try
        {
            await repository.SaveChangesAsync(cancellationToken);
        }
        catch
        {
            await storage.DeleteAsync(stored.ObjectPath, CancellationToken.None);
            throw;
        }

        if (TryGetStoredObjectPath(previousImageUrl, out var previousObjectPath) &&
            !string.Equals(previousObjectPath, stored.ObjectPath, StringComparison.Ordinal))
        {
            await storage.DeleteAsync(previousObjectPath, cancellationToken);
        }

        return (
            ModelImageWriteResult.Success,
            new ModelImageResponse(model.ImageUrl, model.ImageRightsStatus));
    }

    private static bool TryGetStoredObjectPath(string? imageUrl, out string objectPath)
    {
        objectPath = string.Empty;
        if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
        {
            return false;
        }

        var marker = "/storage/v1/object/public/catalog-images/";
        var markerIndex = uri.AbsolutePath.IndexOf(marker, StringComparison.Ordinal);
        if (markerIndex < 0)
        {
            return false;
        }

        objectPath = Uri.UnescapeDataString(uri.AbsolutePath[(markerIndex + marker.Length)..]);
        return objectPath.StartsWith("models/", StringComparison.Ordinal);
    }
}
