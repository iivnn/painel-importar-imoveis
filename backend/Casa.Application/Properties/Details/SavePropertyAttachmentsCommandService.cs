using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

namespace Casa.Application.Properties.Details;

public class SavePropertyAttachmentsCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertyDetailsResponse?> ExecuteAsync(
        int propertyId,
        PropertyAttachmentKind kind,
        IReadOnlyList<(string OriginalFileName, string StoredFileName, string RelativePath, string ContentType)> files,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetWithAttachmentsAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        foreach (var file in files)
        {
            var attachment = new PropertyAttachment
            {
                PropertyListingId = property.Id,
                Kind = kind,
                OriginalFileName = file.OriginalFileName,
                StoredFileName = file.StoredFileName,
                RelativePath = file.RelativePath,
                ContentType = file.ContentType,
                CreatedAtUtc = DateTime.UtcNow
            };

            property.Attachments.Add(attachment);
            await propertyListingRepository.AddAttachmentAsync(attachment, cancellationToken);
        }

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return PropertyDetailsMapper.Map(property);
    }
}
