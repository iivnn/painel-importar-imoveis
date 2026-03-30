using Casa.Application.Abstractions;

namespace Casa.Application.Properties.Details;

public class UpdatePropertyNotesCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyDetailsResponse?> ExecuteAsync(
        int propertyId,
        UpdatePropertyNotesRequest request,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetWithAttachmentsAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        property.Notes = request.Notes.Trim();

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return PropertyDetailsMapper.Map(property);
    }
}
