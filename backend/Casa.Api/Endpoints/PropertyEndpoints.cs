using Casa.Application.Abstractions;
using Casa.Application.Properties;
using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.GetProperties;
using Casa.Application.Properties.SoftDeleteProperty;
using Casa.Application.Properties.Status;
using Casa.Application.Properties.Swot;
using Casa.Application.Properties.UpdateProperty;
using Casa.Domain.Enums;

namespace Casa.Api.Endpoints;

public static class PropertyEndpoints
{
    public static IEndpointRouteBuilder MapPropertyEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/properties", async (
            int? page,
            int? pageSize,
            decimal? minPrice,
            decimal? maxPrice,
            string? neighborhood,
            string? category,
            PropertySwotStatus? swotStatus,
            decimal? minScore,
            GetPropertiesQueryService getPropertiesQueryService,
            CancellationToken cancellationToken) =>
        {
            var properties = await getPropertiesQueryService.ExecuteAsync(
                new GetPropertiesQuery
                {
                    Page = page ?? 1,
                    PageSize = pageSize ?? 10,
                    MinPrice = minPrice,
                    MaxPrice = maxPrice,
                    Neighborhood = neighborhood,
                    Category = category,
                    SwotStatus = swotStatus,
                    MinScore = minScore
                },
                cancellationToken);

            return Results.Ok(properties);
        })
        .WithName("GetProperties")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/map", async (
            decimal? minPrice,
            decimal? maxPrice,
            string? neighborhood,
            string? category,
            PropertySwotStatus? swotStatus,
            decimal? minScore,
            GetPropertyMapQueryService getPropertyMapQueryService,
            CancellationToken cancellationToken) =>
        {
            var properties = await getPropertyMapQueryService.ExecuteAsync(
                BuildFilters(minPrice, maxPrice, neighborhood, category, swotStatus, minScore),
                cancellationToken);

            return Results.Ok(properties);
        })
        .WithName("GetPropertiesMap")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/filter-options", async (
            GetPropertyFilterOptionsQueryService getPropertyFilterOptionsQueryService,
            CancellationToken cancellationToken) =>
        {
            var options = await getPropertyFilterOptionsQueryService.ExecuteAsync(cancellationToken);

            return Results.Ok(options);
        })
        .WithName("GetPropertyFilterOptions")
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

        endpoints.MapPut("/api/properties/{id:int}/status", async (
            int id,
            UpdatePropertyStatusRequest request,
            UpdatePropertyStatusCommandService updatePropertyStatusCommandService,
            CancellationToken cancellationToken) =>
        {
            var property = await updatePropertyStatusCommandService.ExecuteAsync(id, request, cancellationToken);

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("UpdatePropertyStatus")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/{id:int}/swot", async (
            int id,
            GetPropertySwotAnalysisQueryService getPropertySwotAnalysisQueryService,
            CancellationToken cancellationToken) =>
        {
            var swot = await getPropertySwotAnalysisQueryService.ExecuteAsync(id, cancellationToken);

            return swot is null ? Results.NotFound() : Results.Ok(swot);
        })
        .WithName("GetPropertySwot")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/swot", async (
            int id,
            PropertySwotAnalysisRequest request,
            SavePropertySwotAnalysisCommandService savePropertySwotAnalysisCommandService,
            CancellationToken cancellationToken) =>
        {
            var swot = await savePropertySwotAnalysisCommandService.ExecuteAsync(id, request, cancellationToken);

            return swot is null ? Results.NotFound() : Results.Ok(swot);
        })
        .WithName("SavePropertySwot")
        .WithOpenApi();

        endpoints.MapDelete("/api/properties/{id:int}", async (
            int id,
            SoftDeletePropertyCommandService softDeletePropertyCommandService,
            CancellationToken cancellationToken) =>
        {
            var deleted = await softDeletePropertyCommandService.ExecuteAsync(id, cancellationToken);

            return deleted ? Results.NoContent() : Results.NotFound();
        })
        .WithName("SoftDeleteProperty")
        .WithOpenApi();

        return endpoints;
    }

    private static PropertyFilters BuildFilters(
        decimal? minPrice,
        decimal? maxPrice,
        string? neighborhood,
        string? category,
        PropertySwotStatus? swotStatus,
        decimal? minScore)
    {
        return new PropertyFilters
        {
            MinPrice = minPrice,
            MaxPrice = maxPrice,
            Neighborhood = neighborhood,
            Category = category,
            SwotStatus = swotStatus,
            MinScore = minScore
        };
    }
}
