namespace Api.Modules.Inventory.Services;

public sealed record ModelImageFormat(string ContentType, string Extension);

public static class ModelImageFileValidator
{
    public const long MaximumFileSizeBytes = 5 * 1024 * 1024;

    public static bool TryGetFormat(
        string? contentType,
        ReadOnlySpan<byte> header,
        out ModelImageFormat? format)
    {
        format = null;
        if (header.Length >= 3 &&
            header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF &&
            string.Equals(contentType, "image/jpeg", StringComparison.OrdinalIgnoreCase))
        {
            format = new ModelImageFormat("image/jpeg", ".jpg");
            return true;
        }

        if (header.Length >= 8 &&
            header[..8].SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }) &&
            string.Equals(contentType, "image/png", StringComparison.OrdinalIgnoreCase))
        {
            format = new ModelImageFormat("image/png", ".png");
            return true;
        }

        if (header.Length >= 12 &&
            header[..4].SequenceEqual("RIFF"u8) &&
            header[8..12].SequenceEqual("WEBP"u8) &&
            string.Equals(contentType, "image/webp", StringComparison.OrdinalIgnoreCase))
        {
            format = new ModelImageFormat("image/webp", ".webp");
            return true;
        }

        return false;
    }
}
