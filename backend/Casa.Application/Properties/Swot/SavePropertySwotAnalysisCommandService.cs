using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Casa.Domain.Enums;

namespace Casa.Application.Properties.Swot;

public class SavePropertySwotAnalysisCommandService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertySwotAnalysisResponse?> ExecuteAsync(
        int propertyId,
        PropertySwotAnalysisRequest request,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetForUpdateAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

        property.Strengths = request.Strengths.Trim();
        property.Weaknesses = request.Weaknesses.Trim();
        property.Opportunities = request.Opportunities.Trim();
        property.Threats = request.Threats.Trim();
        property.Score = request.Score is null
            ? null
            : decimal.Clamp(request.Score.Value, 0m, 10m);

        if (property.SwotStatus == PropertySwotStatus.Novo)
        {
            await propertyListingRepository.AddStatusHistoryAsync(
                new PropertyStatusHistory
                {
                    PropertyListingId = property.Id,
                    PreviousStatus = PropertySwotStatus.Novo,
                    NewStatus = PropertySwotStatus.EmAnalise,
                    Reason = "Primeira analise SWOT registrada"
                },
                cancellationToken);
            property.SwotStatus = PropertySwotStatus.EmAnalise;
        }

        await propertyListingRepository.SaveChangesAsync(cancellationToken);

        return new PropertySwotAnalysisResponse
        {
            PropertyId = property.Id,
            Strengths = property.Strengths,
            Weaknesses = property.Weaknesses,
            Opportunities = property.Opportunities,
            Threats = property.Threats,
            Score = property.Score,
            SwotStatus = property.SwotStatus
        };
    }
}
