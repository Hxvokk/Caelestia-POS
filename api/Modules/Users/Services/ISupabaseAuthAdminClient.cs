namespace Api.Modules.Users.Services;

public interface ISupabaseAuthAdminClient
{
    Task<Guid> CreateUserAsync(
        string name,
        string email,
        string password,
        CancellationToken cancellationToken);

    Task SetUserBlockedAsync(Guid id, bool isBlocked, CancellationToken cancellationToken);

    Task DeleteUserAsync(Guid id, CancellationToken cancellationToken);
}
