using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class LaptopUnitQuery
{
    [Range(1, long.MaxValue)]
    public long? ModelId { get; init; }

    [RegularExpression("^(disponible|vendida)$")]
    public string? Status { get; init; }
}
