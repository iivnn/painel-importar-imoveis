using Casa.Application.Abstractions;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertiesQueryService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<GetPropertiesResponse> ExecuteAsync(
        GetPropertiesQuery query,
        CancellationToken cancellationToken = default)
    {
        var page = query.Page < 1 ? 1 : query.Page;
        var pageSize = query.PageSize switch
        {
            < 1 => 10,
            > 100 => 100,
            _ => query.PageSize
        };

        var (items, totalItems) = await propertyListingRepository.GetPagedAsync(page, pageSize, cancellationToken);
        var totalPages = totalItems == 0 ? 0 : (int)Math.Ceiling(totalItems / (double)pageSize);

        return new GetPropertiesResponse
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = totalPages
        };
    }
}
