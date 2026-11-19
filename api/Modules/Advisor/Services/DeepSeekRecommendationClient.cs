using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Api.Modules.Inventory.Models;

namespace Api.Modules.Advisor.Services;

public sealed class DeepSeekRecommendationClient(
    HttpClient httpClient,
    IConfiguration configuration,
    ILogger<DeepSeekRecommendationClient> logger) : IRecommendationAiClient
{
    private const string Endpoint = "https://api.deepseek.com/chat/completions";
    private readonly string? _apiKey = configuration["DeepSeek:ApiKey"]?.Trim();
    private readonly string _model = configuration["DeepSeek:Model"]?.Trim() is { Length: > 0 } model
        ? model
        : "deepseek-flash";

    public bool IsConfigured => !string.IsNullOrWhiteSpace(_apiKey);

    public async Task<IReadOnlyList<long>?> RankAsync(
        string needs,
        string? software,
        string? resolution,
        IReadOnlyList<LaptopModel> candidates,
        CancellationToken cancellationToken)
    {
        if (!IsConfigured)
        {
            return null;
        }

        var payload = new
        {
            model = _model,
            messages = new object[]
            {
                new
                {
                    role = "system",
                    content = """
                        Rank only the supplied existing laptop candidates for the customer's technical needs.
                        Return JSON only with the shape {"modelIds":[integer,...]} and at most three unique IDs.
                        Never propose a model outside the supplied candidates. Do not infer missing specifications.
                        Do not return explanations, prices, personal data, or serial numbers.
                        """
                },
                new
                {
                    role = "user",
                    content = JsonSerializer.Serialize(new
                    {
                        needs,
                        requestedSoftware = software,
                        desiredResolution = resolution,
                        candidates = candidates.Select(model => new
                        {
                            id = model.Id,
                            brand = model.Brand.Name,
                            name = model.Name,
                            model.ProcessorOrChip,
                            model.RamGb,
                            model.UnifiedMemoryGb,
                            model.StorageGb,
                            model.StorageType,
                            model.Gpu,
                            model.GpuType,
                            model.GpuVramGb,
                            model.Price
                        })
                    })
                }
            },
            response_format = new { type = "json_object" },
            temperature = 0,
            max_tokens = 512,
            stream = false,
            thinking = new { type = "disabled" }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, Endpoint)
        {
            Content = JsonContent.Create(payload)
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        try
        {
            using var response = await httpClient.SendAsync(request, cancellationToken);
            if (!response.IsSuccessStatusCode)
            {
                logger.LogWarning("DeepSeek recommendation returned HTTP {StatusCode}.", response.StatusCode);
                return null;
            }

            using var body = await JsonDocument.ParseAsync(
                await response.Content.ReadAsStreamAsync(cancellationToken),
                cancellationToken: cancellationToken);
            var content = body.RootElement
                .GetProperty("choices")[0]
                .GetProperty("message")
                .GetProperty("content")
                .GetString();
            if (string.IsNullOrWhiteSpace(content))
            {
                return null;
            }

            var result = JsonSerializer.Deserialize<RankResponse>(
                content,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            return result?.ModelIds?.Distinct().Take(3).ToArray();
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            logger.LogWarning("DeepSeek recommendation timed out.");
            return null;
        }
        catch (HttpRequestException exception)
        {
            logger.LogWarning(exception, "DeepSeek recommendation request failed.");
            return null;
        }
        catch (JsonException exception)
        {
            logger.LogWarning(exception, "DeepSeek recommendation response was invalid JSON.");
            return null;
        }
        catch (KeyNotFoundException exception)
        {
            logger.LogWarning(exception, "DeepSeek response did not contain a completion.");
            return null;
        }
        catch (IndexOutOfRangeException exception)
        {
            logger.LogWarning(exception, "DeepSeek response did not contain a completion choice.");
            return null;
        }
        catch (InvalidOperationException exception)
        {
            logger.LogWarning(exception, "DeepSeek response had an unexpected format.");
            return null;
        }
    }

    private sealed record RankResponse(long[]? ModelIds);
}
