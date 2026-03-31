using Casa.Domain.Enums;

namespace Casa.Application.Properties;

public class PropertyListingUpsertRequest
{
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public PropertySource Source { get; set; }

    public string OriginalUrl { get; set; } = string.Empty;

    public PropertySwotStatus SwotStatus { get; set; }

    public decimal? Price { get; set; }

    public decimal? CondoFee { get; set; }

    public decimal? Iptu { get; set; }

    public decimal? Insurance { get; set; }

    public decimal? ServiceFee { get; set; }

    public decimal? UpfrontCost { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string Neighborhood { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string PostalCode { get; set; } = string.Empty;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool HasExactLocation { get; set; }

    public string Notes { get; set; } = string.Empty;

    public string DiscardReason { get; set; } = string.Empty;

    public bool IsFavorite { get; set; }

    public bool Excluded { get; set; }
}
