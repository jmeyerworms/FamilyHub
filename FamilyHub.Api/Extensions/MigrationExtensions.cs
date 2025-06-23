using FamilyHub.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace FamilyHub.Api.Extensions
{
    public static class MigrationExtensions
    {
        /// <summary>
        /// Applies any pending migrations for the context to the database.
        /// Will create the database if it does not already exist.
        /// </summary>
        public static async Task MigrateDatabaseAsync(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            var services = scope.ServiceProvider;
            var logger = services.GetRequiredService<ILogger<FamilyHubDbContext>>();

            try
            {
                logger.LogInformation("Starting database migration");
                var context = services.GetRequiredService<FamilyHubDbContext>();
                
                if (context.Database.GetPendingMigrations().Any())
                {
                    logger.LogInformation("Applying {count} pending migrations", 
                        context.Database.GetPendingMigrations().Count());
                    await context.Database.MigrateAsync();
                }
                else
                {
                    logger.LogInformation("No pending migrations found");
                }
                
                logger.LogInformation("Database migration completed successfully");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred during database migration");
                throw; // Rethrow to prevent application from starting with an inconsistent database
            }
        }
    }
}