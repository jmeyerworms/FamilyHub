using System.ComponentModel.DataAnnotations;
using FamilyHub.Api.Models;

namespace FamilyHub.Api.DTOs.Tasks
{
    public class CreateTaskDto
    {
        [Required]
        public string Title { get; set; } = string.Empty;
        
        public string? Description { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
        
        public string? Recurrence { get; set; }
        
        public string? RecurrencePattern { get; set; }
        
        public string? Location { get; set; }
        
        public List<string>? Tags { get; set; }
        
        public List<int>? AssignedMemberIds { get; set; }
    }
    
    public class UpdateTaskDto
    {
        public string? Title { get; set; }
        
        public string? Description { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public TaskPriority? Priority { get; set; }
        
        public Models.TaskStatus? Status { get; set; }
        
        public string? Recurrence { get; set; }
        
        public string? RecurrencePattern { get; set; }
        
        public string? Location { get; set; }
        
        public List<string>? Tags { get; set; }
        
        public List<int>? AssignedMemberIds { get; set; }
    }
    
    public class TaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime? DueDate { get; set; }
        public TaskPriority Priority { get; set; }
        public Models.TaskStatus Status { get; set; }
        public string? Recurrence { get; set; }
        public string? RecurrencePattern { get; set; }
        public string? Location { get; set; }
        public List<string> Tags { get; set; } = new();
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
        public List<AssignedMemberDto> AssignedMembers { get; set; } = new();
    }
    
    public class AssignedMemberDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public bool IsVirtual { get; set; }
    }
}
