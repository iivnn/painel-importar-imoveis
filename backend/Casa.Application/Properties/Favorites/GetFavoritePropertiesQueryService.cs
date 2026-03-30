using Casa.Application.Abstractions;
using Casa.Application.Properties.GetProperties;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

namespace Casa.Application.Properties.Favorites;

public class GetFavoritePropertiesQueryService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyFavoritesResponse> ExecuteAsync(
        PropertyFilters filters,
        PropertyFavoriteSortBy sortBy,
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var favoriteFilters = new PropertyFilters
        {
            MinPrice = filters.MinPrice,
            MaxPrice = filters.MaxPrice,
            Neighborhood = filters.Neighborhood,
            Category = filters.Category,
            SwotStatus = filters.SwotStatus,
            MinScore = filters.MinScore,
            OnlyFavorites = true,
            OnlyWithSwot = filters.OnlyWithSwot,
            OnlyWithNotes = filters.OnlyWithNotes,
            OnlyWithMedia = filters.OnlyWithMedia
        };

        var properties = await propertyListingRepository.GetActiveWithAttachmentsAsync(cancellationToken);
        var filteredProperties = ApplyFilters(properties, favoriteFilters);
        var sortedProperties = ApplySorting(filteredProperties, sortBy);
        var normalizedPage = page < 1 ? 1 : page;
        var normalizedPageSize = pageSize switch
        {
            < 1 => 6,
            > 24 => 24,
            _ => pageSize
        };
        var totalItems = sortedProperties.Count;
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)normalizedPageSize);
        if (totalPages > 0 && normalizedPage > totalPages)
        {
            normalizedPage = totalPages;
        }

        var pagedItems = sortedProperties
            .Skip((normalizedPage - 1) * normalizedPageSize)
            .Take(normalizedPageSize)
            .ToList();
        var favoriteOptions = BuildFavoriteFilterOptions(properties.Where(property => property.IsFavorite).ToList());

        return new PropertyFavoritesResponse
        {
            Summary = BuildSummary(filteredProperties),
            FilterOptions = favoriteOptions,
            Page = normalizedPage,
            PageSize = normalizedPageSize,
            TotalItems = totalItems,
            TotalPages = totalPages,
            Items = pagedItems.Select(Map).ToList()
        };
    }

    private static IReadOnlyList<PropertyListing> ApplyFilters(
        IReadOnlyList<PropertyListing> properties,
        PropertyFilters filters)
    {
        var query = properties.Where(property => !property.Excluded);

        if (filters.OnlyFavorites)
        {
            query = query.Where(property => property.IsFavorite);
        }

        if (filters.MinPrice is not null)
        {
            query = query.Where(property => property.Price is not null && property.Price >= filters.MinPrice);
        }

        if (filters.MaxPrice is not null)
        {
            query = query.Where(property => property.Price is not null && property.Price <= filters.MaxPrice);
        }

        if (!string.IsNullOrWhiteSpace(filters.Neighborhood))
        {
            var neighborhood = filters.Neighborhood.Trim();
            query = query.Where(property => string.Equals(property.Neighborhood, neighborhood, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(filters.Category))
        {
            var category = filters.Category.Trim();
            query = query.Where(property => string.Equals(property.Category, category, StringComparison.OrdinalIgnoreCase));
        }

        if (filters.SwotStatus is not null)
        {
            query = query.Where(property => property.SwotStatus == filters.SwotStatus);
        }

        if (filters.MinScore is not null)
        {
            query = query.Where(property => property.Score is not null && property.Score >= filters.MinScore);
        }

        if (filters.OnlyWithSwot)
        {
            query = query.Where(HasSwotContent);
        }

        if (filters.OnlyWithNotes)
        {
            query = query.Where(property => !string.IsNullOrWhiteSpace(property.Notes));
        }

        if (filters.OnlyWithMedia)
        {
            query = query.Where(property => property.Attachments.Count > 0);
        }

        return query.ToList();
    }

    private static IReadOnlyList<PropertyListing> ApplySorting(
        IReadOnlyList<PropertyListing> properties,
        PropertyFavoriteSortBy sortBy)
    {
        return sortBy switch
        {
            PropertyFavoriteSortBy.LowestPrice => properties
                .OrderBy(property => property.Price ?? decimal.MaxValue)
                .ThenByDescending(property => property.Score ?? decimal.MinValue)
                .ToList(),
            PropertyFavoriteSortBy.HighestScore => properties
                .OrderByDescending(property => property.Score ?? decimal.MinValue)
                .ThenBy(property => property.Price ?? decimal.MaxValue)
                .ToList(),
            PropertyFavoriteSortBy.Status => properties
                .OrderBy(property => StatusWeight(property.SwotStatus))
                .ThenByDescending(property => property.Score ?? decimal.MinValue)
                .ToList(),
            _ => properties
                .OrderByDescending(property => property.CreatedAtUtc)
                .ToList()
        };
    }

    private static PropertyFavoriteSummaryResponse BuildSummary(IReadOnlyList<PropertyListing> properties)
    {
        var prices = properties.Where(property => property.Price is not null).Select(property => property.Price!.Value).ToList();
        var scores = properties.Where(property => property.Score is not null).Select(property => property.Score!.Value).ToList();

        return new PropertyFavoriteSummaryResponse
        {
            TotalFavorites = properties.Count,
            AveragePrice = prices.Count > 0 ? decimal.Round(prices.Average(), 2) : null,
            HighestScore = scores.Count > 0 ? scores.Max() : null,
            StatusBreakdown = properties
                .GroupBy(property => property.SwotStatus)
                .OrderBy(group => StatusWeight(group.Key))
                .Select(group => new PropertyFavoriteStatusSummaryResponse
                {
                    Status = group.Key.ToString(),
                    Count = group.Count()
                })
                .ToList()
        };
    }

    private static PropertyFilterOptionsResponse BuildFavoriteFilterOptions(IReadOnlyList<PropertyListing> properties)
    {
        return new PropertyFilterOptionsResponse
        {
            Neighborhoods = properties
                .Where(property => !string.IsNullOrWhiteSpace(property.Neighborhood))
                .Select(property => property.Neighborhood.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(value => value)
                .ToList(),
            Categories = properties
                .Where(property => !string.IsNullOrWhiteSpace(property.Category))
                .Select(property => property.Category.Trim())
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .OrderBy(value => value)
                .ToList()
        };
    }

    private static PropertyFavoriteItemResponse Map(PropertyListing property)
    {
        return new PropertyFavoriteItemResponse
        {
            Id = property.Id,
            Title = property.Title,
            Category = property.Category,
            Source = property.Source,
            OriginalUrl = property.OriginalUrl,
            SwotStatus = property.SwotStatus,
            Price = property.Price,
            AddressLine = property.AddressLine,
            Neighborhood = property.Neighborhood,
            City = property.City,
            State = property.State,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            HasExactLocation = property.HasExactLocation,
            Score = property.Score,
            StrengthsPreview = FirstMeaningfulLine(property.Strengths),
            ThreatsPreview = FirstMeaningfulLine(property.Threats),
            HasNotes = !string.IsNullOrWhiteSpace(property.Notes),
            HasMedia = property.Attachments.Count > 0,
            MediaCount = property.Attachments.Count,
            ThumbnailUrls = property.Attachments
                .OrderByDescending(attachment => attachment.CreatedAtUtc)
                .Select(attachment => attachment.RelativePath)
                .Take(6)
                .ToList(),
            CreatedAtUtc = property.CreatedAtUtc
        };
    }

    private static bool HasSwotContent(PropertyListing property)
    {
        return !string.IsNullOrWhiteSpace(property.Strengths)
            || !string.IsNullOrWhiteSpace(property.Weaknesses)
            || !string.IsNullOrWhiteSpace(property.Opportunities)
            || !string.IsNullOrWhiteSpace(property.Threats)
            || property.Score is not null;
    }

    private static string FirstMeaningfulLine(string? text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            return string.Empty;
        }

        return text
            .Split(["\r\n", "\n"], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(line => !string.IsNullOrWhiteSpace(line))
            ?? string.Empty;
    }

    private static int StatusWeight(PropertySwotStatus status)
    {
        return status switch
        {
            PropertySwotStatus.Proposta => 0,
            PropertySwotStatus.Visitado => 1,
            PropertySwotStatus.EmAnalise => 2,
            PropertySwotStatus.Novo => 3,
            PropertySwotStatus.Descartado => 4,
            _ => 5
        };
    }
}
