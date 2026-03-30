using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

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

        var previousStatus = property.SwotStatus;
        property.SwotStatus = request.SwotStatus;

        if (request.SwotStatus == PropertySwotStatus.Descartado)
        {
            property.DiscardReason = request.Reason.Trim();
        }
        else if (previousStatus == PropertySwotStatus.Descartado)
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
                    Reason = request.Reason.Trim()
                },
                cancellationToken);
        }

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return property;
    }
}
