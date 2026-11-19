using System.Net;
using System.Text;
using Api.Modules.Advisor.Services;
using Api.Modules.Inventory.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Api.Tests;

public sealed class DeepSeekRecommendationClientTests
{
    [Fact]
    public async Task RequestSendsOnlyModelSpecificationsAndNeverSerialNumbers()
    {
        var handler = new CapturingHandler();
        using var httpClient = new HttpClient(handler);
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DeepSeek:ApiKey"] = "test-server-key",
                ["DeepSeek:Model"] = "deepseek-flash"
            })
            .Build();
        var client = new DeepSeekRecommendationClient(
            httpClient,
            configuration,
            NullLogger<DeepSeekRecommendationClient>.Instance);
        var model = new LaptopModel
        {
            Id = 7,
            Name = "Model 7",
            ProcessorOrChip = "CPU model",
            Price = 20_000m,
            StorageGb = 512,
            Brand = new Brand { Name = "Brand" },
            Units = [new LaptopUnit { SerialNumber = "PRIVATE-SERIAL-123" }]
        };

        var ranking = await client.RankAsync(
            "video editing",
            null,
            null,
            [model],
            CancellationToken.None);

        Assert.Equal([7L], ranking);
        Assert.Contains("video editing", handler.RequestBody);
        Assert.Contains("deepseek-flash", handler.RequestBody);
        Assert.DoesNotContain("PRIVATE-SERIAL-123", handler.RequestBody);
        Assert.Equal("Bearer test-server-key", handler.Authorization);
    }

    [Theory]
    [InlineData(HttpStatusCode.TooManyRequests)]
    [InlineData(HttpStatusCode.InternalServerError)]
    public async Task ReturnsNullWhenDeepSeekReturnsAnErrorStatus(HttpStatusCode statusCode)
    {
        var handler = new CapturingHandler(statusCode, """{"error":"unavailable"}""");
        using var httpClient = new HttpClient(handler);
        var client = CreateClient(httpClient, apiKey: "test-server-key");

        var ranking = await client.RankAsync("study", null, null, [], CancellationToken.None);

        Assert.Null(ranking);
        Assert.Equal(1, handler.RequestCount);
    }

    [Fact]
    public async Task ReturnsNullWhenDeepSeekResponseIsMalformed()
    {
        var handler = new CapturingHandler(HttpStatusCode.OK, """{"unexpected":true}""");
        using var httpClient = new HttpClient(handler);
        var client = CreateClient(httpClient, apiKey: "test-server-key");

        var ranking = await client.RankAsync("study", null, null, [], CancellationToken.None);

        Assert.Null(ranking);
    }

    [Fact]
    public async Task DoesNotCallDeepSeekWhenApiKeyIsNotConfigured()
    {
        var handler = new CapturingHandler();
        using var httpClient = new HttpClient(handler);
        var client = CreateClient(httpClient, apiKey: null);

        var ranking = await client.RankAsync("study", null, null, [], CancellationToken.None);

        Assert.Null(ranking);
        Assert.Equal(0, handler.RequestCount);
    }

    private static DeepSeekRecommendationClient CreateClient(HttpClient httpClient, string? apiKey)
    {
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["DeepSeek:ApiKey"] = apiKey
            })
            .Build();

        return new DeepSeekRecommendationClient(
            httpClient,
            configuration,
            NullLogger<DeepSeekRecommendationClient>.Instance);
    }

    private sealed class CapturingHandler(
        HttpStatusCode statusCode = HttpStatusCode.OK,
        string responseBody = """{"choices":[{"message":{"content":"{\"modelIds\":[7]}"}}]}""")
        : HttpMessageHandler
    {
        public string RequestBody { get; private set; } = string.Empty;
        public string? Authorization { get; private set; }
        public int RequestCount { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestCount++;
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            Authorization = request.Headers.Authorization?.ToString();
            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            };
        }
    }
}
