using Api.Modules.Inventory.Services;
using Xunit;

namespace Api.Tests;

public sealed class ModelImageFileValidatorTests
{
    [Theory]
    [InlineData("image/jpeg", new byte[] { 0xFF, 0xD8, 0xFF }, ".jpg")]
    [InlineData("image/png", new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }, ".png")]
    [InlineData("image/webp", new byte[] { 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50 }, ".webp")]
    public void AcceptsSupportedImageWithMatchingSignature(
        string contentType,
        byte[] header,
        string expectedExtension)
    {
        var accepted = ModelImageFileValidator.TryGetFormat(contentType, header, out var format);

        Assert.True(accepted);
        Assert.Equal(expectedExtension, format!.Extension);
    }

    [Theory]
    [InlineData("image/png", new byte[] { 0xFF, 0xD8, 0xFF })]
    [InlineData("text/plain", new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A })]
    [InlineData("image/webp", new byte[] { 0x52, 0x49, 0x46, 0x46 })]
    public void RejectsUnsupportedOrMismatchedImage(
        string contentType,
        byte[] header)
    {
        var accepted = ModelImageFileValidator.TryGetFormat(contentType, header, out var format);

        Assert.False(accepted);
        Assert.Null(format);
    }
}
