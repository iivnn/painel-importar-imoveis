using Casa.Api.Hubs;
using Casa.Api.Services.AppLogging;
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
using System.Net.Http.Headers;
using System.Linq;

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

            return property is null ? Results.NotFound() : Results.Ok(PropertyListingMapper.ToResponse(property));
        })
        .WithName("GetPropertyById")
        .WithOpenApi();

        endpoints.MapPost("/api/properties", async (
            PropertyListingUpsertRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            CreatePropertyCommandService createPropertyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var (property, error) = await createPropertyCommandService.ExecuteAsync(request, cancellationToken);

            if (error is not null)
            {
                await appLogService.LogWarningAsync(
                    "Properties",
                    "PropertyCreateValidationFailed",
                    "Falha de validacao ao criar imovel.",
                    new
                    {
                        request.Title,
                        request.Category,
                        error
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    cancellationToken: cancellationToken);
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["propertyListing"] = [error]
                });
            }

            await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
            await inconsistencyBroadcastService.PublishPropertyCreatedAsync(property!.Id, property.Title, cancellationToken);
            await appLogService.LogInfoAsync(
                "Properties",
                "PropertyCreated",
                "Novo imovel criado com sucesso.",
                new
                {
                    property.Id,
                    property.Title,
                    property.Source,
                    property.City,
                    property.State
                },
                httpContext.TraceIdentifier,
                httpContext.Request.Path,
                httpContext.Request.Method,
                "Property",
                property.Id.ToString(),
                cancellationToken);
            return Results.Created($"/api/properties/{property!.Id}", PropertyListingMapper.ToResponse(property));
        })
        .WithName("CreateProperty")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}", async (
            int id,
            PropertyListingUpsertRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            UpdatePropertyCommandService updatePropertyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var (property, error) = await updatePropertyCommandService.ExecuteAsync(id, request, cancellationToken);

            if (error is not null)
            {
                await appLogService.LogWarningAsync(
                    "Properties",
                    "PropertyUpdateValidationFailed",
                    "Falha de validacao ao atualizar imovel.",
                    new
                    {
                        propertyId = id,
                        request.Title,
                        request.Category,
                        error
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.ValidationProblem(new Dictionary<string, string[]>
                {
                    ["propertyListing"] = [error]
                });
            }

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Properties",
                    "PropertyUpdated",
                    "Imovel atualizado com sucesso.",
                    new
                    {
                        property.Id,
                        property.Title,
                        property.SwotStatus
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    property.Id.ToString(),
                    cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(PropertyListingMapper.ToResponse(property));
        })
        .WithName("UpdateProperty")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/status", async (
            int id,
            UpdatePropertyStatusRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            UpdatePropertyStatusCommandService updatePropertyStatusCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var property = await updatePropertyStatusCommandService.ExecuteAsync(id, request, cancellationToken);

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Properties",
                    "PropertyStatusUpdated",
                    "Status do imovel atualizado.",
                    new
                    {
                        property.Id,
                        property.Title,
                        property.SwotStatus,
                        request.Reason
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    property.Id.ToString(),
                    cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(PropertyListingMapper.ToResponse(property));
        })
        .WithName("UpdatePropertyStatus")
        .WithOpenApi();

        endpoints.MapPut("/api/properties/{id:int}/favorite", async (
            int id,
            UpdatePropertyFavoriteRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            UpdatePropertyFavoriteCommandService updatePropertyFavoriteCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var property = await updatePropertyFavoriteCommandService.ExecuteAsync(id, request, cancellationToken);

            if (property is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Properties",
                    "PropertyFavoriteUpdated",
                    request.IsFavorite ? "Imovel marcado como favorito." : "Imovel removido dos favoritos.",
                    new
                    {
                        property.Id,
                        property.Title,
                        request.IsFavorite
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    property.Id.ToString(),
                    cancellationToken);
            }

            return property is null ? Results.NotFound() : Results.Ok(PropertyListingMapper.ToResponse(property));
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
            HttpContext httpContext,
            AppLogService appLogService,
            SavePropertySwotAnalysisCommandService savePropertySwotAnalysisCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var swot = await savePropertySwotAnalysisCommandService.ExecuteAsync(id, request, cancellationToken);

            if (swot is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Swot",
                    "SwotSaved",
                    "Analise SWOT salva para o imovel.",
                    new
                    {
                        propertyId = id,
                        swot.Score,
                        hasStrengths = !string.IsNullOrWhiteSpace(swot.Strengths),
                        hasWeaknesses = !string.IsNullOrWhiteSpace(swot.Weaknesses),
                        hasOpportunities = !string.IsNullOrWhiteSpace(swot.Opportunities),
                        hasThreats = !string.IsNullOrWhiteSpace(swot.Threats)
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
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
            HttpContext httpContext,
            AppLogService appLogService,
            UpdatePropertyNotesCommandService updatePropertyNotesCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var details = await updatePropertyNotesCommandService.ExecuteAsync(id, request, cancellationToken);

            if (details is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Properties",
                    "PropertyNotesUpdated",
                    "Observacoes do imovel atualizadas.",
                    new
                    {
                        propertyId = id,
                        notesLength = details.Notes?.Length ?? 0
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
            }

            return details is null ? Results.NotFound() : Results.Ok(details);
        })
        .WithName("UpdatePropertyNotes")
        .WithOpenApi();

        endpoints.MapPost("/api/properties/{id:int}/attachments", async (
            int id,
            int? maxImages,
            HttpRequest httpRequest,
            HttpContext httpContext,
            AppLogService appLogService,
            SavePropertyAttachmentsCommandService savePropertyAttachmentsCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            IWebHostEnvironment environment,
            CancellationToken cancellationToken) =>
        {
            if (!httpRequest.HasFormContentType)
            {
                await appLogService.LogWarningAsync(
                    "Attachments",
                    "InvalidAttachmentForm",
                    "Tentativa de envio de anexo com formulario invalido.",
                    new { propertyId = id },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.BadRequest(new { error = "Formulario invalido." });
            }

            var form = await httpRequest.ReadFormAsync(cancellationToken);
            if (!Enum.TryParse<PropertyAttachmentKind>(form["kind"], true, out var kind))
            {
                await appLogService.LogWarningAsync(
                    "Attachments",
                    "InvalidAttachmentKind",
                    "Tentativa de envio de anexo com tipo invalido.",
                    new { propertyId = id, kind = form["kind"].ToString() },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.BadRequest(new { error = "Tipo de anexo invalido." });
            }

            if (form.Files.Count == 0)
            {
                await appLogService.LogWarningAsync(
                    "Attachments",
                    "NoAttachmentFiles",
                    "Tentativa de envio de anexo sem arquivos.",
                    new { propertyId = id, kind },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.BadRequest(new { error = "Nenhum arquivo foi enviado." });
            }

            var normalizedMaxImages = NormalizeMaxImages(maxImages);
            var filesToProcess = form.Files.Take(normalizedMaxImages).ToList();

            var savedFiles = new List<(string OriginalFileName, string StoredFileName, string RelativePath, string ContentType)>();
            var propertyDirectory = Path.Combine(environment.ContentRootPath, "Data", "uploads", "properties", id.ToString());
            Directory.CreateDirectory(propertyDirectory);

            var skippedFiles = new List<object>();

            foreach (var file in filesToProcess)
            {
                if (!IsSupportedImage(file.ContentType))
                {
                    await appLogService.LogWarningAsync(
                        "Attachments",
                        "UnsupportedAttachmentContentType",
                        "Tentativa de envio de imagem com formato nao suportado.",
                        new
                        {
                            propertyId = id,
                            kind,
                            file.FileName,
                            file.ContentType
                        },
                        httpContext.TraceIdentifier,
                        httpContext.Request.Path,
                        httpContext.Request.Method,
                        "Property",
                        id.ToString(),
                        cancellationToken);
                    skippedFiles.Add(new
                    {
                        file.FileName,
                        file.ContentType,
                        reason = "UnsupportedContentType"
                    });
                    continue;
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

            if (savedFiles.Count == 0)
            {
                return Results.BadRequest(new { error = "Somente imagens JPG, PNG, WEBP e GIF sao suportadas." });
            }

            var details = await savePropertyAttachmentsCommandService.ExecuteAsync(id, kind, savedFiles, cancellationToken);

            if (details is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Attachments",
                    "AttachmentsUploaded",
                    "Arquivos enviados para o imovel.",
                    new
                    {
                        propertyId = id,
                        kind,
                        uploadedCount = savedFiles.Count,
                        skippedCount = skippedFiles.Count,
                        requestedCount = form.Files.Count,
                        processedCount = filesToProcess.Count,
                        maxImages = normalizedMaxImages
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
            }

            return details is null ? Results.NotFound() : Results.Ok(new
            {
                attachments = details.Attachments
                    .Select(attachment => new
                    {
                        attachment.Id,
                        attachment.Kind,
                        attachment.OriginalFileName,
                        attachment.FileUrl,
                        attachment.ContentType
                    })
                    .ToList(),
                notes = details.Notes,
                uploadedCount = savedFiles.Count,
                skippedCount = skippedFiles.Count,
                processedCount = filesToProcess.Count,
                requestedCount = form.Files.Count,
                skippedFiles
            });
        })
        .DisableAntiforgery()
        .WithName("AddPropertyAttachments")
        .WithOpenApi();

        endpoints.MapPost("/api/properties/{id:int}/attachments/import-urls", async (
            int id,
            int? maxImages,
            ImportPropertyAttachmentUrlsRequest request,
            HttpContext httpContext,
            AppLogService appLogService,
            SavePropertyAttachmentsCommandService savePropertyAttachmentsCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            IWebHostEnvironment environment,
            IHttpClientFactory httpClientFactory,
            CancellationToken cancellationToken) =>
        {
            if (request.ImageUrls.Count == 0)
            {
                await appLogService.LogWarningAsync(
                    "Attachments",
                    "NoAttachmentUrls",
                    "Tentativa de importar imagens por URL sem imagens informadas.",
                    new { propertyId = id, request.Kind },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.BadRequest(new { error = "Nenhuma URL de imagem foi enviada." });
            }

            var client = httpClientFactory.CreateClient();
            var savedFiles = new List<(string OriginalFileName, string StoredFileName, string RelativePath, string ContentType)>();
            var importedUrls = new List<string>();
            var failedItems = new List<object>();
            var propertyDirectory = Path.Combine(environment.ContentRootPath, "Data", "uploads", "properties", id.ToString());
            Directory.CreateDirectory(propertyDirectory);
            var normalizedMaxImages = NormalizeMaxImages(maxImages);
            var imageUrlsToProcess = request.ImageUrls.Take(normalizedMaxImages).ToList();

            for (var index = 0; index < imageUrlsToProcess.Count; index++)
            {
                var imageUrl = imageUrlsToProcess[index];
                if (!Uri.TryCreate(imageUrl, UriKind.Absolute, out var uri))
                {
                    failedItems.Add(new { imageUrl, reason = "InvalidUrl" });
                    continue;
                }

                try
                {
                    using var response = await client.GetAsync(uri, cancellationToken);
                    if (!response.IsSuccessStatusCode)
                    {
                        failedItems.Add(new
                        {
                            imageUrl,
                            reason = "HttpError",
                            status = (int)response.StatusCode
                        });
                        continue;
                    }

                    var inferredContentType = InferImageContentType(
                        response.Content.Headers.ContentType,
                        imageUrl);

                    if (!IsSupportedImage(inferredContentType))
                    {
                        failedItems.Add(new
                        {
                            imageUrl,
                            reason = "UnsupportedContentType",
                            contentType = inferredContentType
                        });
                        continue;
                    }

                    var extension = InferImageExtension(inferredContentType, imageUrl);
                    var storedFileName = $"{Guid.NewGuid():N}.{extension}";
                    var filePath = Path.Combine(propertyDirectory, storedFileName);

                    await using (var stream = File.Create(filePath))
                    {
                        await response.Content.CopyToAsync(stream, cancellationToken);
                    }

                    savedFiles.Add((
                        Path.GetFileName(uri.LocalPath) is { Length: > 0 } originalFileName ? originalFileName : $"importada-{index + 1}.{extension}",
                        storedFileName,
                        $"/uploads/properties/{id}/{storedFileName}",
                        inferredContentType));
                    importedUrls.Add(imageUrl);
                }
                catch (Exception ex)
                {
                    failedItems.Add(new
                    {
                        imageUrl,
                        reason = "Exception",
                        message = ex.Message
                    });
                }
            }

            if (savedFiles.Count == 0)
            {
                await appLogService.LogWarningAsync(
                    "Attachments",
                    "AttachmentUrlImportEmpty",
                    "Nenhuma imagem valida foi importada a partir das URLs enviadas.",
                    new
                    {
                        propertyId = id,
                        request.Kind,
                        requestedCount = request.ImageUrls.Count,
                        failedCount = failedItems.Count
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
                return Results.BadRequest(new { error = "Nenhuma imagem valida foi importada a partir das URLs enviadas." });
            }

            var details = await savePropertyAttachmentsCommandService.ExecuteAsync(id, request.Kind, savedFiles, cancellationToken);

            if (details is not null)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Attachments",
                    "AttachmentUrlsImported",
                    "Imagens importadas por URL para o imovel.",
                    new
                    {
                        propertyId = id,
                        request.Kind,
                        importedCount = savedFiles.Count,
                        requestedCount = request.ImageUrls.Count,
                        processedCount = imageUrlsToProcess.Count,
                        failedCount = failedItems.Count,
                        maxImages = normalizedMaxImages
                    },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
            }

            return details is null ? Results.NotFound() : Results.Ok(new
            {
                attachments = details.Attachments
                    .Select(attachment => new
                    {
                        attachment.Id,
                        attachment.Kind,
                        attachment.OriginalFileName,
                        attachment.FileUrl,
                        attachment.ContentType
                    })
                    .ToList(),
                importedUrls,
                failedItems,
                requestedCount = request.ImageUrls.Count,
                processedCount = imageUrlsToProcess.Count,
                importedCount = savedFiles.Count
            });
        })
        .WithName("ImportPropertyAttachmentsFromUrls")
        .WithOpenApi();

        endpoints.MapDelete("/api/properties/{propertyId:int}/attachments/{attachmentId:int}", async (
            int propertyId,
            int attachmentId,
            HttpContext httpContext,
            AppLogService appLogService,
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
            await appLogService.LogInfoAsync(
                "Attachments",
                "AttachmentDeleted",
                "Anexo removido do imovel.",
                new
                {
                    propertyId,
                    attachmentId
                },
                httpContext.TraceIdentifier,
                httpContext.Request.Path,
                httpContext.Request.Method,
                "Property",
                propertyId.ToString(),
                cancellationToken);
            return Results.NoContent();
        })
        .WithName("DeletePropertyAttachment")
        .WithOpenApi();

        endpoints.MapDelete("/api/properties/{id:int}", async (
            int id,
            HttpContext httpContext,
            AppLogService appLogService,
            SoftDeletePropertyCommandService softDeletePropertyCommandService,
            InconsistencyBroadcastService inconsistencyBroadcastService,
            CancellationToken cancellationToken) =>
        {
            var deleted = await softDeletePropertyCommandService.ExecuteAsync(id, cancellationToken);

            if (deleted)
            {
                await inconsistencyBroadcastService.PublishSummaryAsync(cancellationToken);
                await appLogService.LogInfoAsync(
                    "Properties",
                    "PropertySoftDeleted",
                    "Imovel marcado como excluido.",
                    new { propertyId = id },
                    httpContext.TraceIdentifier,
                    httpContext.Request.Path,
                    httpContext.Request.Method,
                    "Property",
                    id.ToString(),
                    cancellationToken);
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

    private static string InferImageContentType(MediaTypeHeaderValue? contentType, string imageUrl)
    {
        var mediaType = contentType?.MediaType?.ToLowerInvariant();
        if (!string.IsNullOrWhiteSpace(mediaType))
        {
            return mediaType;
        }

        var extension = Path.GetExtension(imageUrl).ToLowerInvariant();
        return extension switch
        {
            ".png" => "image/png",
            ".webp" => "image/webp",
            ".gif" => "image/gif",
            ".jpg" or ".jpeg" => "image/jpeg",
            _ => string.Empty
        };
    }

    private static string InferImageExtension(string contentType, string imageUrl)
    {
        return contentType switch
        {
            "image/png" => "png",
            "image/webp" => "webp",
            "image/gif" => "gif",
            "image/jpeg" => "jpg",
            _ => Path.GetExtension(imageUrl).TrimStart('.').ToLowerInvariant() switch
            {
                "png" => "png",
                "webp" => "webp",
                "gif" => "gif",
                "jpg" or "jpeg" => "jpg",
                _ => "jpg"
            }
        };
    }

    private static int NormalizeMaxImages(int? maxImages)
    {
        if (!maxImages.HasValue || maxImages.Value < 1)
        {
            return 10;
        }

        return Math.Min(maxImages.Value, 30);
    }
}

public sealed class ImportPropertyAttachmentUrlsRequest
{
    public PropertyAttachmentKind Kind { get; init; } = PropertyAttachmentKind.Foto;

    public IReadOnlyList<string> ImageUrls { get; init; } = [];
}
