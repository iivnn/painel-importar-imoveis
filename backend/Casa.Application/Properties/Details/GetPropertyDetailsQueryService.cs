using Casa.Application.Abstractions;

namespace Casa.Application.Properties.Details;

public class GetPropertyDetailsQueryService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyDetailsResponse?> ExecuteAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetWithDetailsAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        return PropertyDetailsMapper.Map(property);
    }
}
