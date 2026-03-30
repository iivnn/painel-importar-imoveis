using Casa.Domain.Entities;

namespace Casa.Application.Properties.Details;

internal static class PropertyDetailsMapper
{
    public static PropertyDetailsResponse Map(PropertyListing property)
    {
        return new PropertyDetailsResponse
        {
            PropertyId = property.Id,
            Title = property.Title,
            Category = property.Category,
            Source = property.Source.ToString(),
            OriginalUrl = property.OriginalUrl,
            SwotStatus = property.SwotStatus.ToString(),
            Price = property.Price,
            CondoFee = property.CondoFee,
            Iptu = property.Iptu,
            Insurance = property.Insurance,
            UpfrontCost = property.UpfrontCost,
            MonthlyTotalCost = (property.Price ?? 0m) + (property.CondoFee ?? 0m) + (property.Iptu ?? 0m) + (property.Insurance ?? 0m),
            AddressLine = property.AddressLine,
            Neighborhood = property.Neighborhood,
            City = property.City,
            State = property.State,
            PostalCode = property.PostalCode,
            Latitude = property.Latitude,
            Longitude = property.Longitude,
            HasExactLocation = property.HasExactLocation,
            Strengths = property.Strengths,
            Weaknesses = property.Weaknesses,
            Opportunities = property.Opportunities,
            Threats = property.Threats,
            Score = property.Score,
            Notes = property.Notes,
            DiscardReason = property.DiscardReason,
            IsFavorite = property.IsFavorite,
            CreatedAtUtc = property.CreatedAtUtc,
            Attachments = property.Attachments
                .OrderByDescending(attachment => attachment.CreatedAtUtc)
                .Select(attachment => new PropertyAttachmentResponse
                {
                    Id = attachment.Id,
                    Kind = attachment.Kind,
                    OriginalFileName = attachment.OriginalFileName,
                    FileUrl = attachment.RelativePath,
                    ContentType = attachment.ContentType,
                    CreatedAtUtc = attachment.CreatedAtUtc
                })
                .ToList(),
            StatusHistory = property.StatusHistory
                .OrderByDescending(history => history.ChangedAtUtc)
                .Select(history => new PropertyStatusHistoryResponse
                {
                    Id = history.Id,
                    PreviousStatus = history.PreviousStatus,
                    NewStatus = history.NewStatus,
                    Reason = history.Reason,
                    ChangedAtUtc = history.ChangedAtUtc
                })
                .ToList()
        };
    }
}
