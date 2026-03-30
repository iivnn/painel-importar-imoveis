using Casa.Domain.Entities;

namespace Casa.Application.Properties;

internal static class PropertyListingMapper
{
    public static void Apply(PropertyListing target, PropertyListingUpsertRequest request)
    {
        target.Title = request.Title.Trim();
        target.Category = request.Category.Trim();
        target.Source = request.Source;
        target.OriginalUrl = request.OriginalUrl.Trim();
        target.SwotStatus = request.SwotStatus;
        target.Price = request.Price;
        target.CondoFee = request.CondoFee;
        target.Iptu = request.Iptu;
        target.Insurance = request.Insurance;
        target.UpfrontCost = request.UpfrontCost;
        target.AddressLine = request.AddressLine.Trim();
        target.Neighborhood = request.Neighborhood.Trim();
        target.City = request.City.Trim();
        target.State = request.State.Trim();
        target.PostalCode = request.PostalCode.Trim();
        target.Latitude = request.Latitude;
        target.Longitude = request.Longitude;
        target.HasExactLocation = request.HasExactLocation;
        target.Notes = request.Notes.Trim();
        target.DiscardReason = request.DiscardReason.Trim();
        target.IsFavorite = request.IsFavorite;
        target.Excluded = request.Excluded;
    }

    public static string? Validate(PropertyListingUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return "Title is required.";
        if (string.IsNullOrWhiteSpace(request.Category)) return "Category is required.";
        if (string.IsNullOrWhiteSpace(request.AddressLine)) return "AddressLine is required.";
        if (string.IsNullOrWhiteSpace(request.Neighborhood)) return "Neighborhood is required.";
        if (string.IsNullOrWhiteSpace(request.City)) return "City is required.";
        if (string.IsNullOrWhiteSpace(request.State)) return "State is required.";

        return null;
    }
}
