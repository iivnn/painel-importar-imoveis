namespace Casa.Application.Properties;

public class PropertyListingUpsertRequest
{
    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public string Source { get; set; } = string.Empty;

    public string OriginalUrl { get; set; } = string.Empty;

    public string SwotStatus { get; set; } = string.Empty;

    public decimal? Price { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string Neighborhood { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string PostalCode { get; set; } = string.Empty;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool HasExactLocation { get; set; }
}
