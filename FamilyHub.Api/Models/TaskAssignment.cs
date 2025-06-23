namespace FamilyHub.Api.Models
{
    public class TaskAssignment
    {
        public int Id { get; set; }
        
        public int TaskId { get; set; }
        
        public int FamilyMemberId { get; set; }
        
        public DateTime AssignedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual FamilyTask Task { get; set; } = null!;
        public virtual FamilyMember FamilyMember { get; set; } = null!;
    }
}
