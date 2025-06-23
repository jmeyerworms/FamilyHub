using System.ComponentModel.DataAnnotations;

namespace FamilyHub.Api.Models
{
    public class FamilyMember
    {
        public int Id { get; set; }
        
        public int FamilyId { get; set; }
        
        public int? UserId { get; set; } // Nullable for virtual members
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Avatar { get; set; }
        
        public bool IsVirtual { get; set; } = false; // True for virtual family members (not registered users)
        
        public string Role { get; set; } = "Member"; // Owner, Admin, Member
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Family Family { get; set; } = null!;
        public virtual User? User { get; set; } // Null for virtual members
        public virtual ICollection<TaskAssignment> TaskAssignments { get; set; } = new List<TaskAssignment>();
    }
}
