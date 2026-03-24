using Casa.Application.Abstractions;
using Casa.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Casa.Infrastructure.Persistence.Repositories;

public class PropertyListingRepository(CasaDbContext dbContext) : IPropertyListingRepository
{
    public async Task<(IReadOnlyList<PropertyListing> Items, int TotalItems)> GetPagedAsync(
        int page,
        int pageSize,
        CancellationToken cancellationToken = default)
    {
        var query = dbContext.PropertyListings
            .AsNoTracking()
            .OrderByDescending(property => property.CreatedAtUtc);

        var totalItems = await query.CountAsync(cancellationToken);

        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return (items, totalItems);
    }

    public Task<PropertyListing?> GetByIdAsync(int id, CancellationToken cancellationToken = default)
    {
        return dbContext.PropertyListings
            .AsNoTracking()
            .FirstOrDefaultAsync(property => property.Id == id, cancellationToken);
    }

    public Task<bool> HasAnyAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.PropertyListings.AnyAsync(cancellationToken);
    }

    public async Task AddAsync(PropertyListing property, CancellationToken cancellationToken = default)
    {
        await dbContext.PropertyListings.AddAsync(property, cancellationToken);
    }

    public async Task AddRangeAsync(IEnumerable<PropertyListing> properties, CancellationToken cancellationToken = default)
    {
        await dbContext.PropertyListings.AddRangeAsync(properties, cancellationToken);
    }

    public Task SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return dbContext.SaveChangesAsync(cancellationToken);
    }
}
