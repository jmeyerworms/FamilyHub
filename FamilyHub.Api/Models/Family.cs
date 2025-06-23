using System.ComponentModel.DataAnnotations;

namespace FamilyHub.Api.Models
{
    public class Family
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public int OwnerId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual User Owner { get; set; } = null!;
        public virtual ICollection<FamilyMember> Members { get; set; } = new List<FamilyMember>();
        public virtual ICollection<FamilyTask> Tasks { get; set; } = new List<FamilyTask>();
    }
}
