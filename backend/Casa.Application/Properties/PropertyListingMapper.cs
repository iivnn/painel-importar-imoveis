using Casa.Domain.Entities;

namespace Casa.Application.Properties;

internal static class PropertyListingMapper
{
    public static void Apply(PropertyListing target, PropertyListingUpsertRequest request)
    {
        target.Title = request.Title.Trim();
        target.Category = request.Category.Trim();
        target.Source = request.Source.Trim();
        target.OriginalUrl = request.OriginalUrl.Trim();
        target.SwotStatus = request.SwotStatus.Trim();
        target.Price = request.Price;
        target.AddressLine = request.AddressLine.Trim();
        target.Neighborhood = request.Neighborhood.Trim();
        target.City = request.City.Trim();
        target.State = request.State.Trim();
        target.PostalCode = request.PostalCode.Trim();
        target.Latitude = request.Latitude;
        target.Longitude = request.Longitude;
        target.HasExactLocation = request.HasExactLocation;
    }

    public static string? Validate(PropertyListingUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title)) return "Title is required.";
        if (string.IsNullOrWhiteSpace(request.Category)) return "Category is required.";
        if (string.IsNullOrWhiteSpace(request.Source)) return "Source is required.";
        if (string.IsNullOrWhiteSpace(request.SwotStatus)) return "SwotStatus is required.";
        if (string.IsNullOrWhiteSpace(request.AddressLine)) return "AddressLine is required.";
        if (string.IsNullOrWhiteSpace(request.Neighborhood)) return "Neighborhood is required.";
        if (string.IsNullOrWhiteSpace(request.City)) return "City is required.";
        if (string.IsNullOrWhiteSpace(request.State)) return "State is required.";
        if (string.IsNullOrWhiteSpace(request.PostalCode)) return "PostalCode is required.";

        return null;
    }
}
