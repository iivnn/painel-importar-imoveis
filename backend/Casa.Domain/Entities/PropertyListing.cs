using Casa.Domain.Enums;

namespace Casa.Domain.Entities;

public class PropertyListing
{
    public int Id { get; set; }

    public string Title { get; set; } = string.Empty;

    public string Category { get; set; } = string.Empty;

    public PropertySource Source { get; set; }

    public string OriginalUrl { get; set; } = string.Empty;

    public PropertySwotStatus SwotStatus { get; set; }

    public decimal? Price { get; set; }

    public decimal? CondoFee { get; set; }

    public decimal? Iptu { get; set; }

    public decimal? Insurance { get; set; }

    public decimal? UpfrontCost { get; set; }

    public string AddressLine { get; set; } = string.Empty;

    public string Neighborhood { get; set; } = string.Empty;

    public string City { get; set; } = string.Empty;

    public string State { get; set; } = string.Empty;

    public string PostalCode { get; set; } = string.Empty;

    public decimal? Latitude { get; set; }

    public decimal? Longitude { get; set; }

    public bool HasExactLocation { get; set; }

    public string Strengths { get; set; } = string.Empty;

    public string Weaknesses { get; set; } = string.Empty;

    public string Opportunities { get; set; } = string.Empty;

    public string Threats { get; set; } = string.Empty;

    public decimal? Score { get; set; }

    public string Notes { get; set; } = string.Empty;

    public string DiscardReason { get; set; } = string.Empty;

    public bool IsFavorite { get; set; }

    public bool Excluded { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public ICollection<PropertyAttachment> Attachments { get; set; } = [];

    public ICollection<PropertyStatusHistory> StatusHistory { get; set; } = [];
}
