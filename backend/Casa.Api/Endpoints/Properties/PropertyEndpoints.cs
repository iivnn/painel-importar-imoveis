using Casa.Api.Hubs;
using Casa.Application.Abstractions;
using Casa.Application.Properties;
using Casa.Application.Properties.CreateProperty;
using Casa.Application.Properties.Details;
using Casa.Application.Properties.Favorite;
using Casa.Application.Properties.Favorites;
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

        endpoints.MapGet("/api/properties/favorites", async (
            int? page,
            int? pageSize,
            decimal? minPrice,
            decimal? maxPrice,
            string? neighborhood,
            string? category,
            PropertySwotStatus? swotStatus,
            decimal? minScore,
            bool? onlyWithSwot,
            bool? onlyWithNotes,
            bool? onlyWithMedia,
            PropertyFavoriteSortBy? sortBy,
            GetFavoritePropertiesQueryService getFavoritePropertiesQueryService,
            CancellationToken cancellationToken) =>
        {
            var favorites = await getFavoritePropertiesQueryService.ExecuteAsync(
                new PropertyFilters
                {
                    MinPrice = minPrice,
                    MaxPrice = maxPrice,
                    Neighborhood = neighborhood,
                    Category = category,
                    SwotStatus = swotStatus,
                    MinScore = minScore,
                    OnlyFavorites = true,
                    OnlyWithSwot = onlyWithSwot ?? false,
                    OnlyWithNotes = onlyWithNotes ?? false,
                    OnlyWithMedia = onlyWithMedia ?? false
                },
                sortBy ?? PropertyFavoriteSortBy.Recent,
                page ?? 1,
                pageSize ?? 6,
                cancellationToken);

            return Results.Ok(favorites);
        })
        .WithName("GetFavoriteProperties")
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
            InconsistencyBroadcastService inconsistencyBroadcastService,
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

            await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            await inconsistencyBroadcastService.PublishPropertyCreatedAsync(property!.Id, property.Title, cancellationToken);
            return Results.Created($"/api/properties/{property!.Id}", property);
        })
        .WithName("CreateProperty")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}", async (
            int id,
            PropertyListingUpsertRequest request,
            UpdatePropertyCommandService updatePropertyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
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

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("UpdateProperty")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/status", async (
            int id,
            UpdatePropertyStatusRequest request,
            UpdatePropertyStatusCommandService updatePropertyStatusCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var property = await updatePropertyStatusCommandService.ExecuteAsync(id, request, cancellationToken);

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("UpdatePropertyStatus")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/favorite", async (
            int id,
            UpdatePropertyFavoriteRequest request,
            UpdatePropertyFavoriteCommandService updatePropertyFavoriteCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var property = await updatePropertyFavoriteCommandService.ExecuteAsync(id, request, cancellationToken);

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(property);
        })
        .WithName("UpdatePropertyFavorite")
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
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var swot = await savePropertySwotAnalysisCommandService.ExecuteAsync(id, request, cancellationToken);

            if (swot is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return swot is null ? Results.NotFound() : Results.Ok(swot);
        })
        .WithName("SavePropertySwot")
        .WithOpenApi();

        endpoints.MapGet("/api/properties/{id:int}/details", async (
            int id,
            GetPropertyDetailsQueryService getPropertyDetailsQueryService,
            CancellationToken cancellationToken) =>
        {
            var details = await getPropertyDetailsQueryService.ExecuteAsync(id, cancellationToken);

            return details is null ? Results.NotFound() : Results.Ok(details);
        })
        .WithName("GetPropertyDetails")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/notes", async (
            int id,
            UpdatePropertyNotesRequest request,
            UpdatePropertyNotesCommandService updatePropertyNotesCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var details = await updatePropertyNotesCommandService.ExecuteAsync(id, request, cancellationToken);

            if (details is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return details is null ? Results.NotFound() : Results.Ok(details);
        })
        .WithName("UpdatePropertyNotes")
        .WithOpenApi();

        endpoints.MapPost("/api/properties/{id:int}/attachments", async (
            int id,
            HttpRequest httpRequest,
            SavePropertyAttachmentsCommandService savePropertyAttachmentsCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            if (!httpRequest.HasFormContentType)
            {
                return Results.BadRequest(new { error = "Formulario invalido." });
            }

            var form = await httpRequest.ReadFormAsync(cancellationToken);
            if (!Enum.TryParse<PropertyAttachmentKind>(form["kind"], true, out var kind))
            {
                return Results.BadRequest(new { error = "Tipo de anexo invalido." });
            }

            if (form.Files.Count == 0)
            {
                return Results.BadRequest(new { error = "Nenhum arquivo foi enviado." });
            }

            var savedFiles = new List<(string OriginalFileName, string StoredFileName, string RelativePath, string ContentType)>();
            var propertyDirectory = Path.Combine(environment.ContentRootPath, "Data", "uploads", "properties", id.ToString());
            Directory.CreateDirectory(propertyDirectory);

            foreach (var file in form.Files)
            {
                if (!IsSupportedImage(file.ContentType))
                {
                    return Results.BadRequest(new { error = "Somente imagens JPG, PNG, WEBP e GIF sao suportadas." });
                }

                var extension = Path.GetExtension(file.FileName);
                var storedFileName = $"{Guid.NewGuid():N}{extension}";
                var filePath = Path.Combine(propertyDirectory, storedFileName);

                await using var stream = File.Create(filePath);
                await file.CopyToAsync(stream, cancellationToken);

                savedFiles.Add((
                    file.FileName,
                    storedFileName,
                    $"/uploads/properties/{id}/{storedFileName}",
                    file.ContentType));
            }

            var details = await savePropertyAttachmentsCommandService.ExecuteAsync(id, kind, savedFiles, cancellationToken);

            if (details is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

            return details is null ? Results.NotFound() : Results.Ok(details);
        })
        .DisableAntiforgery()
        .WithName("AddPropertyAttachments")
        .WithOpenApi();

        endpoints.MapDelete("/api/properties/{propertyId:int}/attachments/{attachmentId:int}", async (
            int propertyId,
            int attachmentId,
            DeletePropertyAttachmentCommandService deletePropertyAttachmentCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            var relativePath = await deletePropertyAttachmentCommandService.ExecuteAsync(propertyId, attachmentId, cancellationToken);
            if (relativePath is null)
            {
                return Results.NotFound();
            }

            var trimmedRelativePath = relativePath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar);
            var physicalPath = Path.Combine(environment.ContentRootPath, trimmedRelativePath);

            if (File.Exists(physicalPath))
            {
                File.Delete(physicalPath);
            }

            await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            return Results.NoContent();
        })
        .WithName("DeletePropertyAttachment")
        .WithOpenApi();

        endpoints.MapDelete("/api/properties/{id:int}", async (
            int id,
            SoftDeletePropertyCommandService softDeletePropertyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var deleted = await softDeletePropertyCommandService.ExecuteAsync(id, cancellationToken);

            if (deleted)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            }

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

    private static bool IsSupportedImage(string? contentType)
    {
        return contentType is "image/jpeg" or "image/png" or "image/webp" or "image/gif";
    }
}
