using System.Text.RegularExpressions;
using Api.Modules.Advisor.Contracts;
using Api.Modules.Advisor.Repositories;
using Api.Modules.Inventory.Models;

namespace Api.Modules.Advisor.Services;

public sealed class RecommendationService(
    IAdvisorRepository repository,
    IRecommendationAiClient aiClient) : IRecommendationService
{
    private static readonly Regex EmailPattern = new(
        @"[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);
    private static readonly Regex PhonePattern = new(
        @"(?<!\d)\+?\d[\d\s().-]{8,}\d(?!\d)",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    public async Task<LaptopRecommendationResponse> RecommendAsync(
        LaptopRecommendationRequest request,
        CancellationToken cancellationToken)
    {
        var candidates = await repository.GetAvailableModelsWithinBudgetAsync(
            request.Budget,
            cancellationToken);
        var eligible = candidates
            .Where(model => model.Price <= request.Budget)
            .Where(model => MeetsMinimumRam(model, request.MinimumRamGb))
            .Where(model =>
                !request.MinimumStorageGb.HasValue ||
                model.StorageGb >= request.MinimumStorageGb.Value)
            .Where(model =>
                string.IsNullOrWhiteSpace(request.RequiredGpu) ||
                model.Gpu?.Contains(request.RequiredGpu.Trim(), StringComparison.OrdinalIgnoreCase) == true)
            .ToArray();

        if (eligible.Length == 0)
        {
            return new LaptopRecommendationResponse(
                "sin_candidatos",
                "No hay modelos disponibles dentro del presupuesto y los requisitos indicados.",
                false,
                []);
        }

        var safeNeeds = RemoveContactDetails(request.Needs.Trim());
        var safeSoftware = RemoveContactDetails(NormalizeOptional(request.Software) ?? string.Empty);
        var safeResolution = RemoveContactDetails(NormalizeOptional(request.Resolution) ?? string.Empty);
        IReadOnlyList<LaptopModel>? aiRanking = null;
        var usedAi = false;
        if (aiClient.IsConfigured)
        {
            var rankedIds = await aiClient.RankAsync(
                safeNeeds,
                string.IsNullOrWhiteSpace(safeSoftware) ? null : safeSoftware,
                string.IsNullOrWhiteSpace(safeResolution) ? null : safeResolution,
                eligible,
                cancellationToken);
            var byId = eligible.ToDictionary(model => model.Id);
            var ranked = rankedIds?
                .Distinct()
                .Where(byId.ContainsKey)
                .Select(id => byId[id])
                .Take(3)
                .ToArray();
            if (ranked is { Length: > 0 })
            {
                aiRanking = ranked;
                usedAi = true;
            }
        }

        var selected = aiRanking ?? RankByRules(eligible, safeNeeds, request.Software);
        return new LaptopRecommendationResponse(
            "recomendado",
            usedAi
                ? "Opciones ordenadas por el asesor y verificadas con el catálogo actual."
                : "Opciones ordenadas con reglas locales a partir del catálogo disponible.",
            usedAi,
            selected.Select(model => ToResponse(model, request)).ToArray());
    }

    private static bool MeetsMinimumRam(LaptopModel model, int? minimumRamGb)
    {
        if (!minimumRamGb.HasValue)
        {
            return true;
        }

        var availableMemory = Math.Max(model.RamGb ?? 0, model.UnifiedMemoryGb ?? 0);
        return availableMemory >= minimumRamGb.Value;
    }

    private static IReadOnlyList<LaptopModel> RankByRules(
        IReadOnlyList<LaptopModel> models,
        string needs,
        string? software)
    {
        var keywords = $"{needs} {software}".Split(
            [' ', '\t', '\r', '\n', ',', '.', ';', ':', '/', '-', '_', '(', ')'],
            StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(word => word.Length >= 3)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return models
            .Select(model => new
            {
                Model = model,
                Score = keywords.Count(keyword =>
                    $"{model.Brand.Name} {model.Name} {model.ProcessorOrChip} {model.Gpu}"
                        .Contains(keyword, StringComparison.OrdinalIgnoreCase))
            })
            .OrderByDescending(item => item.Score)
            .ThenBy(item => item.Model.Price)
            .ThenBy(item => item.Model.Id)
            .Take(3)
            .Select(item => item.Model)
            .ToArray();
    }

    private static RecommendedLaptopResponse ToResponse(
        LaptopModel model,
        LaptopRecommendationRequest request)
    {
        var matches = new List<string>
        {
            "Dentro del presupuesto máximo",
            "Con unidades disponibles"
        };
        if (request.MinimumRamGb.HasValue)
        {
            matches.Add($"Cumple la memoria mínima de {request.MinimumRamGb.Value} GB");
        }
        if (request.MinimumStorageGb.HasValue)
        {
            matches.Add($"Cumple el almacenamiento mínimo de {request.MinimumStorageGb.Value} GB");
        }
        if (!string.IsNullOrWhiteSpace(request.RequiredGpu))
        {
            matches.Add($"Incluye una GPU que coincide con “{request.RequiredGpu.Trim()}”");
        }

        var limitations = new List<string>();
        if (model.RamGb is null && model.UnifiedMemoryGb is null)
        {
            limitations.Add("La memoria no está especificada en el catálogo.");
        }
        if (model.Gpu is null)
        {
            limitations.Add("La GPU no está especificada en el catálogo.");
        }
        if (!string.IsNullOrWhiteSpace(request.Resolution))
        {
            limitations.Add("La resolución de pantalla no está registrada; confírmala con el fabricante.");
        }
        if (!string.IsNullOrWhiteSpace(request.Software))
        {
            limitations.Add("El catálogo no confirma software instalado, licencias ni compatibilidad profesional.");
        }

        return new RecommendedLaptopResponse(
            model.Id,
            model.Brand.Name,
            model.Name,
            model.Price,
            model.ProcessorOrChip,
            model.RamGb,
            model.UnifiedMemoryGb,
            model.StorageGb,
            model.Gpu,
            string.Join(". ", matches) + ".",
            limitations);
    }

    private static string RemoveContactDetails(string value)
    {
        var withoutEmail = EmailPattern.Replace(value, "[correo omitido]");
        return PhonePattern.Replace(withoutEmail, "[teléfono omitido]");
    }

    private static string? NormalizeOptional(string? value) =>
        string.IsNullOrWhiteSpace(value) ? null : value.Trim();
}
