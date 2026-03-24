using Casa.Application.Abstractions;
using Casa.Domain.Entities;

namespace Casa.Application.Properties.UpdateProperty;

public class UpdatePropertyCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<(PropertyListing? Property, string? Error)> ExecuteAsync(
        int id,
        PropertyListingUpsertRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = PropertyListingMapper.Validate(request);
        if (validationError is not null)
        {
            return (null, validationError);
        }

        var property = await propertyListingRepository.GetByIdAsync(id, cancellationToken);
        if (property is null)
        {
            return (null, null);
        }

        PropertyListingMapper.Apply(property, request);

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return (property, null);
    }
}
