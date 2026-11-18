using System.Reflection;
using Api.Modules.Users.Contracts;
using Api.Modules.Users.Controllers;
using Api.Modules.Users.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Xunit;

namespace Api.Tests;

public sealed class VendorsControllerTests
{
    [Fact]
    public void EveryVendorEndpointRequiresAdministratorRole()
    {
        var authorization = typeof(VendorsController).GetCustomAttribute<AuthorizeAttribute>();

        Assert.NotNull(authorization);
        Assert.Equal("administrador", authorization.Roles);
    }

    [Fact]
    public async Task SetStatusReturnsNotFoundForUnknownVendor()
    {
        var controller = new VendorsController(new FakeVendorService());

        var result = await controller.SetStatus(
            Guid.NewGuid(),
            new UpdateVendorStatusRequest { IsActive = false },
            CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task CreateMapsDuplicateEmailToConflict()
    {
        var controller = new VendorsController(new FakeVendorService
        {
            CreateException = new VendorEmailAlreadyExistsException()
        });

        var result = await controller.Create(
            new CreateVendorRequest
            {
                Name = "Dana",
                Email = "dana@example.com",
                Password = "temporary-password"
            },
            CancellationToken.None);

        Assert.IsType<ConflictObjectResult>(result.Result);
    }

    private sealed class FakeVendorService : IVendorService
    {
        public Exception? CreateException { get; init; }

        public Task<IReadOnlyList<VendorResponse>> GetAllAsync(CancellationToken cancellationToken) =>
            Task.FromResult<IReadOnlyList<VendorResponse>>([]);

        public Task<VendorResponse> CreateAsync(
            string name,
            string email,
            string password,
            CancellationToken cancellationToken)
        {
            if (CreateException is not null)
            {
                throw CreateException;
            }

            return Task.FromResult(new VendorResponse(Guid.NewGuid(), name, email, true));
        }

        public Task<bool> SetActiveAsync(
            Guid id,
            bool isActive,
            CancellationToken cancellationToken) =>
            Task.FromResult(false);
    }
}
