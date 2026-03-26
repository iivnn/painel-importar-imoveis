using Casa.Application.Abstractions;
using Casa.Domain.Entities;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertyMapQueryService(IPropertyListingRepository propertyListingRepository)
{
    public Task<IReadOnlyList<PropertyListing>> ExecuteAsync(
        PropertyFilters filters,
        CancellationToken cancellationToken = default)
    {
        return propertyListingRepository.GetMapItemsAsync(filters, cancellationToken);
    }
}
