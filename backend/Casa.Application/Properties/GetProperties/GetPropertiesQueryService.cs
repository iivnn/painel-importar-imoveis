using Casa.Application.Abstractions;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertiesQueryService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<GetPropertiesResponse> ExecuteAsync(
        GetPropertiesQuery query,
        CancellationToken cancellationToken = default)
    {
        var normalizedQuery = new GetPropertiesQuery
        {
            Page = query.Page < 1 ? 1 : query.Page,
            PageSize = query.PageSize switch
            {
                < 1 => 10,
                > 100 => 100,
                _ => query.PageSize
            },
            MinPrice = query.MinPrice,
            MaxPrice = query.MaxPrice,
            Neighborhood = string.IsNullOrWhiteSpace(query.Neighborhood) ? null : query.Neighborhood.Trim(),
            Category = string.IsNullOrWhiteSpace(query.Category) ? null : query.Category.Trim(),
            SwotStatus = query.SwotStatus,
            MinScore = query.MinScore
        };

        var (items, totalItems) = await propertyListingRepository.GetPagedAsync(normalizedQuery, cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)normalizedQuery.PageSize);

        return new GetPropertiesResponse
        {
            Items = items,
            Page = normalizedQuery.Page,
            PageSize = normalizedQuery.PageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }
}
