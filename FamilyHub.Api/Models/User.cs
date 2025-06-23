using System.ComponentModel.DataAnnotations;

namespace FamilyHub.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string PasswordHash { get; set; } = string.Empty;
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Avatar { get; set; }
        
        // Password reset fields
        public string? PasswordResetToken { get; set; }
        public DateTime? PasswordResetTokenExpiry { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual ICollection<FamilyMember> FamilyMemberships { get; set; } = new List<FamilyMember>();
        public virtual ICollection<Family> OwnedFamilies { get; set; } = new List<Family>();
    }
}
