using Casa.Domain.Enums;

namespace Casa.Application.Properties;

public class PropertyListingResponse
{
    public int Id { get; init; }

    public string Title { get; init; } = string.Empty;

    public string Category { get; init; } = string.Empty;

    public PropertySource Source { get; init; }

    public string OriginalUrl { get; init; } = string.Empty;

    public PropertySwotStatus SwotStatus { get; init; }

    public decimal? Price { get; init; }

    public decimal? CondoFee { get; init; }

    public decimal? Iptu { get; init; }

    public decimal? Insurance { get; init; }

    public decimal? ServiceFee { get; init; }

    public decimal? UpfrontCost { get; init; }

    public string AddressLine { get; init; } = string.Empty;

    public string Neighborhood { get; init; } = string.Empty;

    public string City { get; init; } = string.Empty;

    public string State { get; init; } = string.Empty;

    public string PostalCode { get; init; } = string.Empty;

    public decimal? Latitude { get; init; }

    public decimal? Longitude { get; init; }

    public bool HasExactLocation { get; init; }

    public string Strengths { get; init; } = string.Empty;

    public string Weaknesses { get; init; } = string.Empty;

    public string Opportunities { get; init; } = string.Empty;

    public string Threats { get; init; } = string.Empty;

    public decimal? Score { get; init; }

    public string Notes { get; init; } = string.Empty;

    public string DiscardReason { get; init; } = string.Empty;

    public bool IsFavorite { get; init; }

    public bool Excluded { get; init; }

    public DateTime CreatedAtUtc { get; init; }
}
