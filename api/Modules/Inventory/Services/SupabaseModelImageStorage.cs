using System.Net.Http.Headers;
using System.Net.Http.Json;
using Api.Modules.Inventory.Models;

namespace Api.Modules.Inventory.Services;

public sealed class SupabaseModelImageStorage(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<SupabaseModelImageStorage> logger) : IModelImageStorage
{
    private const string Bucket = "catalog-images";
    private readonly string? _supabaseUrl = configuration["Supabase:Url"]?.TrimEnd('/');
    private readonly string? _serviceRoleKey = configuration["Supabase:ServiceRoleKey"]?.Trim();

    public async Task<StoredModelImage?> UploadAsync(
        long modelId,
        byte[] content,
        string contentType,
        string extension,
        CancellationToken cancellationToken)
    {
        if (!TryGetConfiguration(out var supabaseUrl, out var serviceRoleKey))
        {
            logger.LogWarning("Supabase Storage is not configured for model images.");
            return null;
        }

        var objectPath = $"models/{modelId}/{Guid.NewGuid():N}{extension}";
        using var request = CreateRequest(
            HttpMethod.Post,
            $"{supabaseUrl}/storage/v1/object/{Escape(Bucket)}/{EscapePath(objectPath)}",
            serviceRoleKey);
        request.Content = new ByteArrayContent(content);
        request.Content.Headers.ContentType = new MediaTypeHeaderValue(contentType);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Supabase Storage upload returned HTTP {StatusCode}.", response.StatusCode);
                return null;
            }

            var publicUrl =
                $"{supabaseUrl}/storage/v1/object/public/{Escape(Bucket)}/{EscapePath(objectPath)}";
            return new StoredModelImage(publicUrl, objectPath);
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "Supabase Storage upload failed.");
            return null;
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Supabase Storage upload timed out.");
            return null;
        }
    }

    public async Task DeleteAsync(string objectPath, CancellationToken cancellationToken)
    {
        if (!TryGetConfiguration(out var supabaseUrl, out var serviceRoleKey))
        {
            return;
        }

        using var request = CreateRequest(
            HttpMethod.Delete,
            $"{supabaseUrl}/storage/v1/object/{Escape(Bucket)}",
            serviceRoleKey);
        request.Content = JsonContent.Create(new { prefixes = new[] { objectPath } });

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("Supabase Storage cleanup returned HTTP {StatusCode}.", response.StatusCode);
            }
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "Supabase Storage cleanup failed.");
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("Supabase Storage cleanup timed out.");
        }
    }

    private bool TryGetConfiguration(out string supabaseUrl, out string serviceRoleKey)
    {
        supabaseUrl = _supabaseUrl ?? string.Empty;
        serviceRoleKey = _serviceRoleKey ?? string.Empty;
        return Uri.TryCreate(supabaseUrl, UriKind.Absolute, out var uri)
            && uri.Scheme is "https" or "http"
            && !string.IsNullOrWhiteSpace(serviceRoleKey);
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string url, string serviceRoleKey)
    {
        var request = new HttpRequestMessage(method, url);
        request.Headers.TryAddWithoutValidation("apikey", serviceRoleKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        return request;
    }

    private static string Escape(string value) => Uri.EscapeDataString(value);

    private static string EscapePath(string path) =>
        string.Join('/', path.Split('/').Select(Uri.EscapeDataString));
}
