using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using FamilyHub.Api.Data;
using FamilyHub.Api.Services;
using FamilyHub.Api.Middleware;
using Serilog;
using Serilog.Events;

// Configure Serilog first
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .Enrich.FromLogContext()
    .Enrich.WithMachineName()
    .Enrich.WithProcessId()
    .Enrich.WithThreadId()
    .WriteTo.Console()
    .WriteTo.EventLog("Api", "FamilyHub", manageEventSource: true)
    .CreateLogger();

try
{
    Log.Information("Starting FamilyHub API");
    
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // Add services to the container.
    builder.Services.AddControllers();
    builder.Services.AddSerilog();

    // Get the current environment
    var environment = builder.Environment;

    // Configure DbContext with SQL Server
    builder.Services.AddDbContext<FamilyHubDbContext>(options =>
    {
        var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
        options.UseSqlServer(connectionString, sqlOptions =>
        {
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
        
        // Log DB connection info in Development environment
        if (environment.IsDevelopment())
        {
            options.EnableSensitiveDataLogging();
            options.EnableDetailedErrors();
            
            var logger = LoggerFactory.Create(config => 
                config.AddConsole().AddDebug())
                .CreateLogger<FamilyHubDbContext>();
                
            logger.LogInformation("Using connection string: {ConnectionString}", 
                connectionString.Substring(0, connectionString.IndexOf(';')));
        }
    });

    // Add JWT Authentication
    var jwtSecret = builder.Configuration["Jwt:Secret"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong";
    var key = Encoding.ASCII.GetBytes(jwtSecret);

    builder.Services.AddAuthentication(x =>
    {
        x.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        x.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(x =>
    {
        x.RequireHttpsMetadata = false;
        x.SaveToken = true;
        x.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(key),
            ValidateIssuer = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidateAudience = true,
            ValidAudience = builder.Configuration["Jwt:Audience"],
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

    // Add CORS
    builder.Services.AddCors(options =>
    {
        options.AddPolicy("AllowAngularApp", policy =>
        {
            // Get allowed origins from configuration, with fallback to localhost for development                                    
            policy.WithOrigins(builder.Configuration.GetSection("AllowedOrigins").Get<string[]>())
                .AllowAnyHeader()
                .AllowAnyMethod()
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromMinutes(5));
        });
    });    // Add custom services
    builder.Services.AddScoped<IJwtService, JwtService>();
    
    // Configure Email Service
    builder.Services.Configure<EmailSettings>(builder.Configuration.GetSection("EmailSettings"));
    builder.Services.AddScoped<IEmailService, EmailService>();

    // Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
    builder.Services.AddOpenApi();
    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen();

    var app = builder.Build();

    // Apply database migrations on startup
    if (app.Environment.IsDevelopment() || app.Environment.IsProduction())
    {
        await MigrateDatabaseAsync(app);
    }

    // Configure the HTTP request pipeline.
    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
        app.UseSwagger();
        app.UseSwaggerUI();
    }

    // Use Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers["User-Agent"]);
            if (httpContext.User.Identity?.IsAuthenticated == true)
            {
                diagnosticContext.Set("UserId", httpContext.User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value);
            }
        };
    });

    // Add custom request/response logging middleware
    app.UseMiddleware<RequestResponseLoggingMiddleware>();

    // CORS must come before HTTPS redirection and authentication
    app.UseCors("AllowAngularApp");
    app.UseHttpsRedirection();
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();

    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}

// Helper method for database migration
static async Task MigrateDatabaseAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<FamilyHubDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    
    try
    {
        logger.LogInformation("Applying database migrations...");
        await dbContext.Database.MigrateAsync();
        logger.LogInformation("Database migrations applied successfully");
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "An error occurred while applying database migrations");
        throw; // Re-throw to halt application startup if migrations fail
    }
}

// Helper method to get the configured minimum log level for EventLog from configuration
static LogEventLevel GetEventLogMinLevel(IConfiguration configuration)
{
    var configuredLevel = configuration["Serilog:EventLog:MinimumLevel"];
    return configuredLevel switch
    {
        "Verbose" => LogEventLevel.Verbose,
        "Debug" => LogEventLevel.Debug,
        "Information" => LogEventLevel.Information,
        "Warning" => LogEventLevel.Warning,
        "Error" => LogEventLevel.Error,
        "Fatal" => LogEventLevel.Fatal,
        _ => LogEventLevel.Warning // Default to Warning if not specified
    };
}
