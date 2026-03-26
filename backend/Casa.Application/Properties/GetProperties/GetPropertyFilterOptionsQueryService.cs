using Casa.Application.Abstractions;

namespace Casa.Application.Properties.GetProperties;

public class GetPropertyFilterOptionsQueryService(IPropertyListingRepository propertyListingRepository)
{
    public Task<PropertyFilterOptionsResponse> ExecuteAsync(CancellationToken cancellationToken = default)
    {
        return propertyListingRepository.GetFilterOptionsAsync(cancellationToken);
    }
}
