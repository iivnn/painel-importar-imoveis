using Casa.Application.Abstractions;

namespace Casa.Application.Properties.SoftDeleteProperty;

public class SoftDeletePropertyCommandService(IPropertyListingRepository propertyListingRepository)
{
    public Task<bool> ExecuteAsync(int id, CancellationToken cancellationToken = default)
    {
        return propertyListingRepository.SoftDeleteAsync(id, cancellationToken);
    }
}
