namespace Api.Modules.Inventory.Models;

public sealed class UserProfile
{
    public Guid Id { get; set; }

    public string Role { get; set; } = string.Empty;

    public bool IsActive { get; set; }
}
