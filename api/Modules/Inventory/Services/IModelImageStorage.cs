namespace Api.Modules.Inventory.Services;

public sealed record StoredModelImage(string PublicUrl, string ObjectPath);

public interface IModelImageStorage
{
    Task<StoredModelImage?> UploadAsync(
        long modelId,
        byte[] content,
        string contentType,
        string extension,
        CancellationToken cancellationToken);

    Task DeleteAsync(string objectPath, CancellationToken cancellationToken);
}
