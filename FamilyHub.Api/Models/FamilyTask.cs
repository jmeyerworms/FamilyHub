using System.ComponentModel.DataAnnotations;

namespace FamilyHub.Api.Models
{
    public enum TaskPriority
    {
        Low = 0,
        Medium = 1,
        High = 2,
        Urgent = 3
    }

    public enum TaskStatus
    {
        Todo = 0,
        InProgress = 1,
        Completed = 2,
        Canceled = 3
    }

    public class FamilyTask
    {
        public int Id { get; set; }
        
        public int FamilyId { get; set; }
        
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public TaskStatus Status { get; set; } = TaskStatus.Todo;
        
        public string? Recurrence { get; set; } // daily, weekly, monthly, custom
        
        public string? RecurrencePattern { get; set; }
        
        public string? Location { get; set; }
        
        public string? Tags { get; set; } // JSON array as string
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public virtual Family Family { get; set; } = null!;
        public virtual ICollection<TaskAssignment> Assignments { get; set; } = new List<TaskAssignment>();
    }
}
