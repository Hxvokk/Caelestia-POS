using System.Net;
using System.Text;
using Api.Modules.Users.Services;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace Api.Tests;

public sealed class SupabaseAuthAdminClientTests
{
    [Fact]
    public async Task CreateUserUsesSecretKeyOnlyForServerAdminRequest()
    {
        var handler = new RecordingHandler(
            HttpStatusCode.OK,
            """{"id":"2a3e6a57-bb66-41f4-b1ee-2a9ba693d99e"}""");
        var client = CreateClient(handler);

        var id = await client.CreateUserAsync(
            "Dana Seller",
            "dana@example.com",
            "temporary-password",
            CancellationToken.None);

        Assert.Equal(Guid.Parse("2a3e6a57-bb66-41f4-b1ee-2a9ba693d99e"), id);
        Assert.Equal(HttpMethod.Post, handler.Method);
        Assert.Equal(
            "https://project.supabase.co/auth/v1/admin/users",
            handler.RequestUri?.ToString());
        Assert.Equal("server-secret", handler.ApiKey);
        Assert.Equal("Bearer server-secret", handler.Authorization);
        Assert.Contains("\"email_confirm\":true", handler.Body);
        Assert.Contains("\"full_name\":\"Dana Seller\"", handler.Body);
    }

    [Fact]
    public async Task SetUserBlockedUsesLongBanAndNoneToUnban()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK, "{}");
        var client = CreateClient(handler);
        var id = Guid.NewGuid();

        await client.SetUserBlockedAsync(id, true, CancellationToken.None);
        Assert.Equal(HttpMethod.Put, handler.Method);
        Assert.Contains("\"ban_duration\":\"876000h\"", handler.Body);

        await client.SetUserBlockedAsync(id, false, CancellationToken.None);
        Assert.Contains("\"ban_duration\":\"none\"", handler.Body);
    }

    [Fact]
    public async Task CreateUserMarksDuplicateEmailErrorWithoutLeakingUpstreamBody()
    {
        var handler = new RecordingHandler(
            HttpStatusCode.UnprocessableEntity,
            """{"code":"email_exists","message":"email already registered"}""");
        var client = CreateClient(handler);

        var exception = await Assert.ThrowsAsync<SupabaseAuthAdminException>(() =>
            client.CreateUserAsync(
                "Dana",
                "dana@example.com",
                "temporary-password",
                CancellationToken.None));

        Assert.True(exception.IsDuplicateEmail);
        Assert.DoesNotContain("email already registered", exception.Message);
    }

    [Fact]
    public async Task AdminOperationsRequireServerUrlAndSecretKey()
    {
        var handler = new RecordingHandler(HttpStatusCode.OK, "{}");
        var client = new SupabaseAuthAdminClient(
            new HttpClient(handler),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Supabase:Url"] = "https://project.supabase.co"
                })
                .Build());

        await Assert.ThrowsAsync<SupabaseAdminNotConfiguredException>(() =>
            client.CreateUserAsync(
                "Dana",
                "dana@example.com",
                "temporary-password",
                CancellationToken.None));
        Assert.Null(handler.Method);
    }

    private static SupabaseAuthAdminClient CreateClient(RecordingHandler handler) =>
        new(
            new HttpClient(handler),
            new ConfigurationBuilder()
                .AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["Supabase:Url"] = "https://project.supabase.co",
                    ["Supabase:ServiceRoleKey"] = "server-secret"
                })
                .Build());

    private sealed class RecordingHandler(HttpStatusCode statusCode, string responseBody) : HttpMessageHandler
    {
        public HttpMethod? Method { get; private set; }
        public Uri? RequestUri { get; private set; }
        public string? ApiKey { get; private set; }
        public string? Authorization { get; private set; }
        public string Body { get; private set; } = string.Empty;

        protected override async Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken)
        {
            Method = request.Method;
            RequestUri = request.RequestUri;
            ApiKey = request.Headers.GetValues("apikey").Single();
            Authorization = request.Headers.Authorization?.ToString();
            Body = request.Content is null
                ? string.Empty
                : await request.Content.ReadAsStringAsync(cancellationToken);
            return new HttpResponseMessage(statusCode)
            {
                Content = new StringContent(responseBody, Encoding.UTF8, "application/json")
            };
        }
    }
}
