using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Inventory.Contracts;

public sealed class UpdateBrandRequest
{
    [Required]
    [StringLength(80, MinimumLength = 1)]
    public string Name { get; init; } = string.Empty;
}
