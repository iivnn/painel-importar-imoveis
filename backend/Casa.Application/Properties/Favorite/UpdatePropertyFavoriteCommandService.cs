using Casa.Application.Abstractions;
using Casa.Domain.Entities;

namespace Casa.Application.Properties.Favorite;

public class UpdatePropertyFavoriteCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyListing?> ExecuteAsync(
        int propertyId,
        UpdatePropertyFavoriteRequest request,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetForUpdateAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        property.IsFavorite = request.IsFavorite;

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return property;
    }
}
