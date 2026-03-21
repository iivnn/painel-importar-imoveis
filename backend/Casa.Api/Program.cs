var builder = WebApplication.CreateBuilder(args);

const string FrontendCorsPolicy = "FrontendCorsPolicy";

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendCorsPolicy, policy =>
    {
        policy
            .WithOrigins("http://localhost:4200")
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors(FrontendCorsPolicy);

app.MapGet("/api/health", () =>
{
    return Results.Ok(new
    {
        status = "ok",
        app = "Casa.Api",
        message = "API local pronta para cadastro de imoveis."
    });
})
.WithName("GetHealth")
.WithOpenApi();

var sampleProperties = new[]
{
    new
    {
        Id = 1,
        Title = "Apartamento 2 quartos",
        Category = "Apartamento",
        Neighborhood = "Centro",
        Source = "App externo",
        SwotStatus = "Pendente"
    },
    new
    {
        Id = 2,
        Title = "Casa com quintal",
        Category = "Casa",
        Neighborhood = "Bairro residencial",
        Source = "Portal web",
        SwotStatus = "Em analise"
    }
};

app.MapGet("/api/properties", () =>
{
    return Results.Ok(sampleProperties);
})
.WithName("GetProperties")
.WithOpenApi();

app.Run();
