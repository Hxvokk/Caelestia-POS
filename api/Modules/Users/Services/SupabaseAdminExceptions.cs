namespace Api.Modules.Users.Services;

public sealed class SupabaseAdminNotConfiguredException()
    : Exception("Configura Supabase:ServiceRoleKey para administrar cuentas de usuario.");

public sealed class SupabaseAuthAdminException(
    string message,
    bool isDuplicateEmail = false,
    Exception? innerException = null)
    : Exception(message, innerException)
{
    public bool IsDuplicateEmail { get; } = isDuplicateEmail;
}

public sealed class VendorEmailAlreadyExistsException()
    : Exception("Ya existe una cuenta con ese correo.");
