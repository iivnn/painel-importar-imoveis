using Casa.Application.Abstractions;

namespace Casa.Application.Properties.Swot;

public class GetPropertySwotAnalysisQueryService(IPropertyListingRepository propertyListingRepository)
{
    public async Task<PropertySwotAnalysisResponse?> ExecuteAsync(
        int propertyId,
        CancellationToken cancellationToken = default)
    {
        var property = await propertyListingRepository.GetByIdAsync(propertyId, cancellationToken);
        if (property is null || property.Excluded)
        {
            return null;
        }

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
