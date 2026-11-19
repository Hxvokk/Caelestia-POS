using Microsoft.AspNetCore.Http;

namespace Api.Modules.Inventory.Services;

public enum ModelImageWriteResult
{
    Success,
    ModelNotFound,
    InvalidImage,
    StorageUnavailable
}

public sealed record ModelImageResponse(string ImageUrl, string ImageRightsStatus);

public interface IModelImageService
{
    Task<(ModelImageWriteResult Result, ModelImageResponse? Image)> UploadAsync(
        long modelId,
        IFormFile? file,
        CancellationToken cancellationToken);
}
