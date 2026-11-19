using Api.Modules.Advisor.Contracts;
using Api.Modules.Advisor.Repositories;
using Api.Modules.Advisor.Services;
using Api.Modules.Inventory.Models;
using Xunit;

namespace Api.Tests;

public sealed class RecommendationServiceTests
{
    [Fact]
    public async Task LocalFallbackOnlyReturnsCandidatesWithinBudgetAndExplicitRequirements()
    {
        var models = new[]
        {
            CreateModel(1, "ThinkPad Pro", 24_000m, ram: 16, storage: 512, gpu: "RTX 4050"),
            CreateModel(2, "ThinkPad Air", 21_000m, ram: 8, storage: 512, gpu: "RTX 4050"),
            CreateModel(3, "Gaming Pro", 32_000m, ram: 32, storage: 1024, gpu: "RTX 4070"),
            CreateModel(4, "Office Pro", 20_000m, ram: 16, storage: 256, gpu: null)
        };
        var ai = new FakeRecommendationAiClient(isConfigured: false, rankedIds: null);
        var service = new RecommendationService(new FakeAdvisorRepository(models), ai);

        var response = await service.RecommendAsync(
            new LaptopRecommendationRequest
            {
                Budget = 25_000m,
                Needs = "trabajo de diseño",
                MinimumRamGb = 16,
                MinimumStorageGb = 512,
                RequiredGpu = "RTX 4050"
            },
            CancellationToken.None);

        Assert.Equal("recomendado", response.Status);
        Assert.False(response.UsedAi);
        var recommendation = Assert.Single(response.Recommendations);
        Assert.Equal(1, recommendation.ModelId);
        Assert.Contains("Cumple la memoria mínima", recommendation.MatchSummary);
    }

    [Fact]
    public async Task AiCanOnlyOrderCandidatesThatPassedBackendValidation()
    {
        var models = new[]
        {
            CreateModel(1, "Workstation A", 24_000m, ram: 16, storage: 512, gpu: "RTX 4050"),
            CreateModel(2, "Workstation B", 23_000m, ram: 16, storage: 512, gpu: "RTX 4060")
        };
        var ai = new FakeRecommendationAiClient(isConfigured: true, rankedIds: [999, 2, 1]);
        var service = new RecommendationService(new FakeAdvisorRepository(models), ai);

        var response = await service.RecommendAsync(
            new LaptopRecommendationRequest
            {
                Budget = 25_000m,
                Needs = "edición de video",
                MinimumRamGb = 16,
                MinimumStorageGb = 512,
                RequiredGpu = "RTX 40"
            },
            CancellationToken.None);

        Assert.True(response.UsedAi);
        Assert.Equal([2L, 1L], response.Recommendations.Select(item => item.ModelId));
    }

    [Fact]
    public async Task ContactDetailsAreRedactedBeforeCallingAi()
    {
        var model = CreateModel(1, "Model A", 10_000m, ram: 8, storage: 256, gpu: null);
        var ai = new FakeRecommendationAiClient(isConfigured: true, rankedIds: [1]);
        var service = new RecommendationService(new FakeAdvisorRepository([model]), ai);

        await service.RecommendAsync(
            new LaptopRecommendationRequest
            {
                Budget = 12_000m,
                Needs = "Oficina para ana@example.com, llamar al +52 55 1234 5678"
            },
            CancellationToken.None);

        Assert.NotNull(ai.LastNeeds);
        Assert.DoesNotContain("ana@example.com", ai.LastNeeds);
        Assert.DoesNotContain("1234 5678", ai.LastNeeds);
        Assert.Contains("[correo omitido]", ai.LastNeeds);
        Assert.Contains("[teléfono omitido]", ai.LastNeeds);
    }

    [Fact]
    public async Task ReturnsClearNoCandidatesMessageWhenNothingMeetsRequirements()
    {
        var model = CreateModel(1, "Basic Laptop", 15_000m, ram: 8, storage: 256, gpu: null);
        var ai = new FakeRecommendationAiClient(isConfigured: true, rankedIds: [1]);
        var service = new RecommendationService(new FakeAdvisorRepository([model]), ai);

        var response = await service.RecommendAsync(
            new LaptopRecommendationRequest
            {
                Budget = 10_000m,
                Needs = "estudio",
                MinimumRamGb = 16
            },
            CancellationToken.None);

        Assert.Equal("sin_candidatos", response.Status);
        Assert.Empty(response.Recommendations);
        Assert.False(response.UsedAi);
        Assert.Null(ai.LastNeeds);
    }

    private static LaptopModel CreateModel(
        long id,
        string name,
        decimal price,
        int? ram,
        int storage,
        string? gpu) =>
        new()
        {
            Id = id,
            Name = name,
            Price = price,
            RamGb = ram,
            StorageGb = storage,
            ProcessorOrChip = "CPU de prueba",
            Gpu = gpu,
            Brand = new Brand { Id = 1, Name = "Marca de prueba" }
        };

    private sealed class FakeAdvisorRepository(IReadOnlyList<LaptopModel> models) : IAdvisorRepository
    {
        public Task<IReadOnlyList<LaptopModel>> GetAvailableModelsWithinBudgetAsync(
            decimal budget,
            CancellationToken cancellationToken) =>
            Task.FromResult(models);
    }

    private sealed class FakeRecommendationAiClient(
        bool isConfigured,
        IReadOnlyList<long>? rankedIds) : IRecommendationAiClient
    {
        public bool IsConfigured { get; } = isConfigured;
        public string? LastNeeds { get; private set; }

        public Task<IReadOnlyList<long>?> RankAsync(
            string needs,
            string? software,
            string? resolution,
            IReadOnlyList<LaptopModel> candidates,
            CancellationToken cancellationToken)
        {
            LastNeeds = needs;
            return Task.FromResult(rankedIds);
        }
    }
}
