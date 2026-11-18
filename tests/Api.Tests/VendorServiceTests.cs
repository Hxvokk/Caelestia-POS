using Api.Modules.Inventory.Models;
using Api.Modules.Users.Repositories;
using Api.Modules.Users.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;

namespace Api.Tests;

public sealed class VendorServiceTests
{
    [Fact]
    public async Task CreateVendorCreatesAuthAccountAndActiveLocalProfile()
    {
        var repository = new FakeUserProfileRepository();
        var authClient = new FakeSupabaseAuthAdminClient();
        var service = CreateService(repository, authClient);

        var result = await service.CreateAsync(
            "  Dana Seller  ",
            " DANA@EXAMPLE.COM ",
            "secure-password",
            CancellationToken.None);

        Assert.Equal("Dana Seller", result.Name);
        Assert.Equal("dana@example.com", result.Email);
        Assert.True(result.IsActive);
        Assert.Equal("vendedor", repository.Profiles.Single().Role);
        Assert.Equal(result.Id, authClient.CreatedId);
        Assert.Equal("dana@example.com", authClient.CreatedEmail);
    }

    [Fact]
    public async Task CreateVendorRejectsExistingEmailBeforeCallingAuth()
    {
        var repository = new FakeUserProfileRepository
        {
            Profiles =
            [
                new UserProfile
                {
                    Id = Guid.NewGuid(),
                    Name = "Existing",
                    Email = "dana@example.com",
                    Role = "vendedor",
                    IsActive = true
                }
            ]
        };
        var authClient = new FakeSupabaseAuthAdminClient();
        var service = CreateService(repository, authClient);

        await Assert.ThrowsAsync<VendorEmailAlreadyExistsException>(() =>
            service.CreateAsync("Dana", "DANA@example.com", "secure-password", CancellationToken.None));

        Assert.Null(authClient.CreatedId);
        Assert.DoesNotContain(repository.Profiles, profile => profile.Name == "Dana");
    }

    [Fact]
    public async Task CreateVendorDeletesAuthAccountWhenProfileSaveFails()
    {
        var repository = new FakeUserProfileRepository { AddException = new DbUpdateException("database error") };
        var authClient = new FakeSupabaseAuthAdminClient();
        var service = CreateService(repository, authClient);

        await Assert.ThrowsAsync<DbUpdateException>(() =>
            service.CreateAsync("Dana", "dana@example.com", "secure-password", CancellationToken.None));

        Assert.Equal(authClient.CreatedId, authClient.DeletedId);
    }

    [Fact]
    public async Task DeactivationBlocksAuthAndMarksLocalProfileInactive()
    {
        var profile = NewVendor();
        var repository = new FakeUserProfileRepository { Profiles = [profile] };
        var authClient = new FakeSupabaseAuthAdminClient();
        var service = CreateService(repository, authClient);

        var updated = await service.SetActiveAsync(profile.Id, false, CancellationToken.None);

        Assert.True(updated);
        Assert.False(profile.IsActive);
        Assert.Equal((profile.Id, true), authClient.StatusChanges.Single());
    }

    [Fact]
    public async Task DeactivationRestoresAuthStatusWhenLocalSaveFails()
    {
        var profile = NewVendor();
        var repository = new FakeUserProfileRepository
        {
            Profiles = [profile],
            SaveException = new DbUpdateException("database error")
        };
        var authClient = new FakeSupabaseAuthAdminClient();
        var service = CreateService(repository, authClient);

        await Assert.ThrowsAsync<DbUpdateException>(() =>
            service.SetActiveAsync(profile.Id, false, CancellationToken.None));

        Assert.Collection(
            authClient.StatusChanges,
            first => Assert.Equal((profile.Id, true), first),
            second => Assert.Equal((profile.Id, false), second));
    }

    [Fact]
    public async Task SetActiveReturnsFalseForUnknownVendor()
    {
        var service = CreateService(
            new FakeUserProfileRepository(),
            new FakeSupabaseAuthAdminClient());

        var updated = await service.SetActiveAsync(Guid.NewGuid(), false, CancellationToken.None);

        Assert.False(updated);
    }

    private static VendorService CreateService(
        FakeUserProfileRepository repository,
        FakeSupabaseAuthAdminClient authClient) =>
        new(repository, authClient, NullLogger<VendorService>.Instance);

    private static UserProfile NewVendor() =>
        new()
        {
            Id = Guid.NewGuid(),
            Name = "Dana",
            Email = "dana@example.com",
            Role = "vendedor",
            IsActive = true
        };

    private sealed class FakeUserProfileRepository : IUserProfileRepository
    {
        public List<UserProfile> Profiles { get; set; } = [];
        public Exception? AddException { get; init; }
        public Exception? SaveException { get; init; }

        public Task<IReadOnlyList<UserProfile>> GetVendorsAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<UserProfile>>(Profiles);

        public Task<UserProfile?> GetVendorByIdForUpdateAsync(
            Guid id,
            CancellationToken cancellationToken) =>
            Task.FromResult(Profiles.SingleOrDefault(profile => profile.Id == id && profile.Role == "vendedor"));

        public Task<bool> EmailExistsAsync(string email, CancellationToken cancellationToken) =>
            Task.FromResult(Profiles.Any(profile => profile.Email.Equals(email, StringComparison.OrdinalIgnoreCase)));

        public Task AddAsync(UserProfile profile, CancellationToken cancellationToken)
        {
            if (AddException is not null)
            {
                throw AddException;
            }

            Profiles.Add(profile);
            return Task.CompletedTask;
        }

        public Task SaveChangesAsync(CancellationToken cancellationToken)
        {
            if (SaveException is not null)
            {
                throw SaveException;
            }

            return Task.CompletedTask;
        }
    }

    private sealed class FakeSupabaseAuthAdminClient : ISupabaseAuthAdminClient
    {
        public Guid? CreatedId { get; private set; }
        public string? CreatedEmail { get; private set; }
        public Guid? DeletedId { get; private set; }
        public List<(Guid Id, bool IsBlocked)> StatusChanges { get; } = [];

        public Task<Guid> CreateUserAsync(
            string name,
            string email,
            string password,
            CancellationToken cancellationToken)
        {
            CreatedId = Guid.NewGuid();
            CreatedEmail = email;
            return Task.FromResult(CreatedId.Value);
        }

        public Task SetUserBlockedAsync(
            Guid id,
            bool isBlocked,
            CancellationToken cancellationToken)
        {
            StatusChanges.Add((id, isBlocked));
            return Task.CompletedTask;
        }

        public Task DeleteUserAsync(Guid id, CancellationToken cancellationToken)
        {
            DeletedId = id;
            return Task.CompletedTask;
        }
    }
}
