namespace Casa.Domain.Entities;

public class DismissedPropertyInconsistency
{
    public string Id { get; set; } = string.Empty;
    public int PropertyId { get; set; }
    public string Type { get; set; } = string.Empty;
    public DateTime DismissedAtUtc { get; set; } = DateTime.UtcNow;
}
