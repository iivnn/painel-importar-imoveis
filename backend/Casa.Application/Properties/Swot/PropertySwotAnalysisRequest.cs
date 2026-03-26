namespace Casa.Application.Properties.Swot;

public class PropertySwotAnalysisRequest
{
    public string Strengths { get; set; } = string.Empty;

    public string Weaknesses { get; set; } = string.Empty;

    public string Opportunities { get; set; } = string.Empty;

    public string Threats { get; set; } = string.Empty;

    public decimal? Score { get; set; }
}
