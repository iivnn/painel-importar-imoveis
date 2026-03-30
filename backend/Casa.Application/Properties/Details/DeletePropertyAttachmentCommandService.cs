using Casa.Application.Abstractions;

namespace Casa.Application.Properties.Details;

public class DeletePropertyAttachmentCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<string?> ExecuteAsync(
        int propertyId,
        int attachmentId,
        CancellationToken cancellationToken = default)
    {
        var attachment = await propertyListingRepository.GetAttachmentForUpdateAsync(propertyId, attachmentId, cancellationToken);
        if (attachment is null)
        {
            return null;
        }

        var relativePath = attachment.RelativePath;

        propertyListingRepository.RemoveAttachment(attachment);
        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return relativePath;
    }
}
