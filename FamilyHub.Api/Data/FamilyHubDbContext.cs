using Microsoft.EntityFrameworkCore;
using FamilyHub.Api.Models;
using Microsoft.Extensions.Logging;

namespace FamilyHub.Api.Data
{
    public class FamilyHubDbContext : DbContext
    {
        private readonly ILogger<FamilyHubDbContext> _logger;

        public FamilyHubDbContext(DbContextOptions<FamilyHubDbContext> options, ILogger<FamilyHubDbContext> logger) 
            : base(options)
        {
            _logger = logger;
        }

        public DbSet<User> Users { get; set; }
        public DbSet<Family> Families { get; set; }
        public DbSet<FamilyMember> FamilyMembers { get; set; }
        public DbSet<FamilyTask> Tasks { get; set; }
        public DbSet<TaskAssignment> TaskAssignments { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            _logger.LogInformation("Configuring entity model");

            // User entity configuration
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.HasIndex(e => e.Email).IsUnique();
                entity.Property(e => e.Email).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.PasswordHash).IsRequired();
            });

            // Family entity configuration
            modelBuilder.Entity<Family>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                
                entity.HasOne(e => e.Owner)
                    .WithMany(e => e.OwnedFamilies)
                    .HasForeignKey(e => e.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // FamilyMember entity configuration
            modelBuilder.Entity<FamilyMember>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Name).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Role).HasMaxLength(50);
                
                entity.HasOne(e => e.Family)
                    .WithMany(e => e.Members)
                    .HasForeignKey(e => e.FamilyId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.User)
                    .WithMany(e => e.FamilyMemberships)
                    .HasForeignKey(e => e.UserId)
                    .OnDelete(DeleteBehavior.SetNull);
                
                // Ensure unique family membership per user
                entity.HasIndex(e => new { e.FamilyId, e.UserId })
                    .IsUnique()
                    .HasFilter("[UserId] IS NOT NULL");
            });

            // FamilyTask entity configuration
            modelBuilder.Entity<FamilyTask>(entity =>
            {
                entity.HasKey(e => e.Id);
                entity.Property(e => e.Title).IsRequired().HasMaxLength(255);
                entity.Property(e => e.Priority).HasConversion<int>();
                entity.Property(e => e.Status).HasConversion<int>();
                
                entity.HasOne(e => e.Family)
                    .WithMany(e => e.Tasks)
                    .HasForeignKey(e => e.FamilyId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // TaskAssignment entity configuration
            modelBuilder.Entity<TaskAssignment>(entity =>
            {
                entity.HasKey(e => e.Id);
                
                entity.HasOne(e => e.Task)
                    .WithMany(e => e.Assignments)
                    .HasForeignKey(e => e.TaskId)
                    .OnDelete(DeleteBehavior.Cascade);
                
                entity.HasOne(e => e.FamilyMember)
                    .WithMany(e => e.TaskAssignments)
                    .HasForeignKey(e => e.FamilyMemberId)
                    .OnDelete(DeleteBehavior.NoAction); // Use NoAction to prevent multiple cascade paths
            });
            
            _logger.LogInformation("Entity model configuration completed");
        }

        public override int SaveChanges()
        {
            _logger.LogDebug("Saving changes to database");
            return base.SaveChanges();
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            _logger.LogDebug("Saving changes to database asynchronously");
            return await base.SaveChangesAsync(cancellationToken);
        }
    }
}
