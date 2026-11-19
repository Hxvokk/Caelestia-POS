using System.Net;
using Api.Modules.Inventory.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Api.Tests;

public sealed class SupabaseModelImageStorageTests
{
    [Fact]
    public async Task ReturnsNullWithoutMakingRequestWhenStorageIsNotConfigured()
    {
        var handler = new StorageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(handler);
        var storage = CreateStorage(httpClient, supabaseUrl: null, serviceRoleKey: null);

        var result = await storage.UploadAsync(
            42,
            [0xFF, 0xD8, 0xFF],
            "image/jpeg",
            ".jpg",
            CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(0, handler.RequestCount);
    }

    [Theory]
    [InlineData(HttpStatusCode.BadRequest)]
    [InlineData(HttpStatusCode.Forbidden)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task ReturnsNullWhenStorageRejectsUpload(HttpStatusCode statusCode)
    {
        var handler = new StorageHandler(statusCode);
        using var httpClient = new HttpClient(handler);
        var storage = CreateStorage(
            httpClient,
            "https://example.supabase.co/",
            "server-only-test-key");

        var result = await storage.UploadAsync(
            42,
            [0xFF, 0xD8, 0xFF],
            "image/jpeg",
            ".jpg",
            CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(1, handler.RequestCount);
        Assert.Equal("Bearer server-only-test-key", handler.Authorization);
        Assert.Equal("server-only-test-key", handler.ApiKey);
        Assert.Contains("/storage/v1/object/catalog-images/models/42/", handler.RequestUri);
    }

    [Fact]
    public async Task ReturnsPublicUrlWhenStorageAcceptsUpload()
    {
        var handler = new StorageHandler(HttpStatusCode.OK);
        using var httpClient = new HttpClient(handler);
        var storage = CreateStorage(
            httpClient,
            "https://example.supabase.co",
            "server-only-test-key");

        var result = await storage.UploadAsync(
            42,
            [0x89, 0x50, 0x4E, 0x47],
            "image/png",
            ".png",
            CancellationToken.None);

        Assert.NotNull(result);
        Assert.StartsWith(
            "https://example.supabase.co/storage/v1/object/public/catalog-images/models/42/",
            result.PublicUrl);
        Assert.EndsWith(".png", result.PublicUrl);
        Assert.Contains("/storage/v1/object/catalog-images/models/42/", handler.RequestUri);
    }

    [Fact]
    public async Task DeleteFailureIsContainedAndDoesNotThrow()
    {
        var handler = new StorageHandler(HttpStatusCode.InternalServerError);
        using var httpClient = new HttpClient(handler);
        var storage = CreateStorage(
            httpClient,
            "https://example.supabase.co",
            "server-only-test-key");

        var exception = await Record.ExceptionAsync(() =>
            storage.DeleteAsync("models/42/image.png", CancellationToken.None));

        Assert.Null(exception);
        Assert.Equal(HttpMethod.Delete, handler.Method);
        Assert.Contains("/storage/v1/object/catalog-images", handler.RequestUri);
    }

    private static SupabaseModelImageStorage CreateStorage(
        HttpClient httpClient,
        string? supabaseUrl,
        string? serviceRoleKey)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["Supabase:Url"] = supabaseUrl,
                ["Supabase:ServiceRoleKey"] = serviceRoleKey
            })
            .Build();
        return new SupabaseModelImageStorage(
            httpClient,
            configuration,
            NullLogger<SupabaseModelImageStorage>.Instance);
    }

    private sealed class StorageHandler(HttpStatusCode statusCode) : HttpMessageHandler
    {
        public int RequestCount { get; private set; }
        public string? Authorization { get; private set; }
        public string? ApiKey { get; private set; }
        public string RequestUri { get; private set; } = string.Empty;
        public HttpMethod? Method { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestCount++;
            Authorization = request.Headers.Authorization?.ToString();
            ApiKey = request.Headers.GetValues("apikey").SingleOrDefault();
            RequestUri = request.RequestUri!.ToString();
            Method = request.Method;
            if (request.Content is not null)
            {
                _ = await request.Content.ReadAsStringAsync(cancellationToken);
            }

            return new HttpResponseMessage(statusCode);
        }
    }
}
