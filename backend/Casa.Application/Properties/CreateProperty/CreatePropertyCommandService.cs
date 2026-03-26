using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

namespace Casa.Application.Properties.CreateProperty;

public class CreatePropertyCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<(PropertyListing? Property, string? Error)> ExecuteAsync(
        PropertyListingUpsertRequest request,
        CancellationToken cancellationToken = default)
    {
        var validationError = PropertyListingMapper.Validate(request);
        if (validationError is not null)
        {
            return (null, validationError);
        }

        var property = new PropertyListing
        {
            CreatedAtUtc = DateTime.UtcNow,
            SwotStatus = PropertySwotStatus.Novo
        };

        PropertyListingMapper.Apply(property, request);
        property.SwotStatus = PropertySwotStatus.Novo;

        await propertyListingRepository.AddAsync(property, cancellationToken);
        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return (property, null);
    }
}
