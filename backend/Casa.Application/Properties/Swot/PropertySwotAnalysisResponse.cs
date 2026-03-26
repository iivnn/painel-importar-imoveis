using Casa.Domain.Enums;

namespace Casa.Application.Properties.Swot;

public class PropertySwotAnalysisResponse
{
    public int PropertyId { get; init; }

    public string Strengths { get; init; } = string.Empty;

    public string Weaknesses { get; init; } = string.Empty;

    public string Opportunities { get; init; } = string.Empty;

    public string Threats { get; init; } = string.Empty;

    public decimal? Score { get; init; }

    public PropertySwotStatus SwotStatus { get; init; }
}
