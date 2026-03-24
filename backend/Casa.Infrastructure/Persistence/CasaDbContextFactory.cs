using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Casa.Infrastructure.Persistence;

public class CasaDbContextFactory : IDesignTimeDbContextFactory<CasaDbContext>
{
    public CasaDbContext CreateDbContext(string[] args)
    {
        var optionsBuilder = new DbContextOptionsBuilder<CasaDbContext>();
        optionsBuilder.UseSqlite("Data Source=../Casa.Api/data/casa.db");

        return new CasaDbContext(optionsBuilder.Options);
    }
}
