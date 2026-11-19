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

    private sealed class CapturingHandler : HttpMessageHandler
    {
        public string RequestBody { get; private set; } = string.Empty;
        public string? Authorization { get; private set; }

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            RequestBody = await request.Content!.ReadAsStringAsync(cancellationToken);
            Authorization = request.Headers.Authorization?.ToString();
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(
                    """{"choices":[{"message":{"content":"{\"modelIds\":[7]}"}}]}""",
                    Encoding.UTF8,
                    "application/json")
            };
        }
    }
}
