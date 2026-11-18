namespace Api.Modules.Users.Contracts;

public sealed record CurrentUserResponse(Guid Id, string Role);
