using Casa.Application.Abstractions;
using Casa.Application.Properties;
using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.GetProperties;
using Casa.Application.Properties.UpdateProperty;

namespace Casa.Api.Endpoints;

public static class PropertyEndpoints
{
    public static IEndpointRouteBuilder MapPropertyEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/properties", async (
            int? page,
            int? pageSize,
            GetPropertiesQueryService getPropertiesQueryService,
            CancellationToken cancellationToken) =>
        {
            var properties = await getPropertiesQueryService.ExecuteAsync(
                new GetPropertiesQuery
                {
                    Page = page ?? 1,
                    PageSize = pageSize ?? 10
                },
                cancellationToken);

            return Results.Ok(properties);
        })
        .WithName("GetProperties")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/{id:int}", async (
            int id,
            IPropertyListingRepository repository,
            CancellationToken cancellationToken) =>
        {
            var property = await repository.GetByIdAsync(id, cancellationToken);

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("GetPropertyById")
        .WithOpenApi();

        endpoints.MapPost("/api/properties", async (
            PropertyListingUpsertRequest request,
            CreatePropertyCommandService createPropertyCommandService,
            CancellationToken cancellationToken) =>
        {
            var (property, error) = await createPropertyCommandService.ExecuteAsync(request, cancellationToken);

            if (error is not null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["propertyListing"] = [error]
                });
            }

            return Results.Created($"/api/properties/{property!.Id}", property);
        })
        .WithName("CreateProperty")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}", async (
            int id,
            PropertyListingUpsertRequest request,
            UpdatePropertyCommandService updatePropertyCommandService,
            CancellationToken cancellationToken) =>
        {
            var (property, error) = await updatePropertyCommandService.ExecuteAsync(id, request, cancellationToken);

            if (error is not null)
            {
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["propertyListing"] = [error]
                });
            }

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("UpdateProperty")
        .WithOpenApi();

        return endpoints;
    }
}
