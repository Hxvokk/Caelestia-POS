using System.ComponentModel.DataAnnotations;

namespace Api.Modules.Users.Contracts;

public sealed class UpdateVendorStatusRequest
{
    [Required]
    public bool? IsActive { get; init; }
}
