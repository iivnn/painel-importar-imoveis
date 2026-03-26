using Casa.Application.Abstractions;
using Casa.Domain.Entities;

namespace Casa.Application.Properties.Status;

public class UpdatePropertyStatusCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyListing?> ExecuteAsync(
        int propertyId,
        UpdatePropertyStatusRequest request,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetForUpdateAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        property.SwotStatus = request.SwotStatus;

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return property;
    }
}
