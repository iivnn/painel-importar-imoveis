using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

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

        var property = await propertyListingRepository.GetForUpdateAsync(id, cancellationToken);
        if (property is null)
        {
            return (null, null);
        }

        var previousStatus = property.SwotStatus;
        PropertyListingMapper.Apply(property, request);

        if (property.SwotStatus == PropertySwotStatus.Descartado)
        {
            property.DiscardReason = request.DiscardReason.Trim();
        }
        else if (previousStatus == PropertySwotStatus.Descartado && property.SwotStatus != PropertySwotStatus.Descartado)
        {
            property.DiscardReason = string.Empty;
        }

        if (previousStatus != property.SwotStatus)
        {
            await propertyListingRepository.AddStatusHistoryAsync(
                new PropertyStatusHistory
                {
                    PropertyListingId = property.Id,
                    PreviousStatus = previousStatus,
                    NewStatus = property.SwotStatus,
                    Reason = property.SwotStatus == PropertySwotStatus.Descartado
                        ? property.DiscardReason
                        : "Status alterado na edicao completa"
                },
                cancellationToken);
        }

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return (property, null);
    }
}
