using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class SaveLaptopUnitRequest
{
    [Range(1, long.MaxValue)]
    public long ModelId { get; init; }

    [Required]
    [StringLength(100, MinimumLength = 1)]
    public string SerialNumber { get; init; } = string.Empty;
}
