using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using System.Text.Json;
using Microsoft.Extensions.Configuration;

namespace Api.Modules.Users.Services;

public sealed class SupabaseAuthAdminClient(
    HttpClient httpClient,
    IConfiguration configuration) : ISupabaseAuthAdminClient
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task<Guid> CreateUserAsync(
        string name,
        string email,
        string password,
        CancellationToken cancellationToken)
    {
        using var request = CreateRequest(
            HttpMethod.Post,
            "admin/users",
            new CreateAuthUserRequest(
                email,
                password,
                EmailConfirm: true,
                new AuthUserMetadata(name)));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw CreateException(response.StatusCode, body);
        }

        try
        {
            var authUser = JsonSerializer.Deserialize<AuthUserResponse>(body, JsonOptions);
            return authUser is not null && Guid.TryParse(authUser.Id, out var id)
                ? id
                : throw new SupabaseAuthAdminException("Supabase devolvió una respuesta de usuario inválida.");
        }
        catch (JsonException exception)
        {
            throw new SupabaseAuthAdminException(
                "Supabase devolvió una respuesta de usuario inválida.",
                innerException: exception);
        }
    }

    public async Task SetUserBlockedAsync(
        Guid id,
        bool isBlocked,
        CancellationToken cancellationToken)
    {
        var duration = isBlocked ? "876000h" : "none";
        using var request = CreateRequest(
            HttpMethod.Put,
            $"admin/users/{id:D}",
            new UpdateAuthUserRequest(duration));
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw CreateException(response.StatusCode, body);
        }
    }

    public async Task DeleteUserAsync(Guid id, CancellationToken cancellationToken)
    {
        using var request = CreateRequest(HttpMethod.Delete, $"admin/users/{id:D}");
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw CreateException(response.StatusCode, body);
        }
    }

    private HttpRequestMessage CreateRequest(HttpMethod method, string path, object? body = null)
    {
        var supabaseUrl = configuration["Supabase:Url"]?.TrimEnd('/');
        var serviceRoleKey = configuration["Supabase:ServiceRoleKey"];
        if (!Uri.TryCreate(supabaseUrl, UriKind.Absolute, out var baseUri)
            || baseUri.Scheme != Uri.UriSchemeHttps
            || string.IsNullOrWhiteSpace(serviceRoleKey))
        {
            throw new SupabaseAdminNotConfiguredException();
        }

        var request = new HttpRequestMessage(method, new Uri($"{supabaseUrl}/auth/v1/{path}"));
        request.Headers.Add("apikey", serviceRoleKey);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", serviceRoleKey);
        if (body is not null)
        {
            request.Content = JsonContent.Create(body, options: JsonOptions);
        }

        return request;
    }

    private static SupabaseAuthAdminException CreateException(HttpStatusCode statusCode, string body)
    {
        var isDuplicateEmail = body.Contains("email_exists", StringComparison.OrdinalIgnoreCase)
            || body.Contains("already been registered", StringComparison.OrdinalIgnoreCase)
            || body.Contains("already exists", StringComparison.OrdinalIgnoreCase);

        return new SupabaseAuthAdminException(
            $"La administración de cuentas en Supabase falló (HTTP {(int)statusCode}).",
            isDuplicateEmail);
    }

    private sealed record CreateAuthUserRequest(
        [property: JsonPropertyName("email")]
        string Email,
        [property: JsonPropertyName("password")]
        string Password,
        [property: JsonPropertyName("email_confirm")]
        bool EmailConfirm,
        [property: JsonPropertyName("user_metadata")]
        AuthUserMetadata UserMetadata);

    private sealed record AuthUserMetadata(
        [property: JsonPropertyName("full_name")]
        string FullName);

    private sealed record UpdateAuthUserRequest(
        [property: JsonPropertyName("ban_duration")]
        string BanDuration);

    private sealed record AuthUserResponse([property: JsonPropertyName("id")] string Id);
}
