using System.ComponentModel.DataAnnotations;
using FamilyHub.Api.Models;

namespace FamilyHub.Api.DTOs.Families
{
    public class CreateFamilyDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Description { get; set; }
    }
    
    public class FamilyDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public int OwnerId { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public List<FamilyMemberDto> Members { get; set; } = new();
    }
    
    public class FamilyMemberDto
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public bool IsVirtual { get; set; }
        public string Role { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public int? UserId { get; set; }
    }
    
    public class CreateFamilyMemberDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Avatar { get; set; }
        
        public bool IsVirtual { get; set; } = true;
        
        public string Role { get; set; } = "Member";
    }
      public class UpdateFamilyMemberDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public string? Avatar { get; set; }
        
        public string Role { get; set; } = "Member";
    }
    
    public class InviteFamilyMemberDto
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
        
        public string Role { get; set; } = "Member";
    }
}
