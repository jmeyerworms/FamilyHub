using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FamilyHub.Api.Data;
using FamilyHub.Api.DTOs.Families;
using FamilyHub.Api.Models;
using System.Security.Claims;

namespace FamilyHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FamiliesController : ControllerBase
    {
        private readonly FamilyHubDbContext _context;
        private readonly ILogger<FamiliesController> _logger;

        public FamiliesController(FamilyHubDbContext context, ILogger<FamiliesController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        [HttpGet]
        public async Task<ActionResult<List<FamilyDto>>> GetUserFamilies()
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var families = await _context.Families
                    .Include(f => f.Owner)
                    .Include(f => f.Members)
                    .ThenInclude(m => m.User)
                    .Where(f => f.OwnerId == userId || f.Members.Any(m => m.UserId == userId))
                    .Select(f => new FamilyDto
                    {
                        Id = f.Id,
                        Name = f.Name,
                        Description = f.Description,
                        OwnerId = f.OwnerId,
                        OwnerName = f.Owner.Name,
                        CreatedAt = f.CreatedAt,
                        Members = f.Members.Select(m => new FamilyMemberDto
                        {
                            Id = m.Id,
                            Name = m.Name,
                            Avatar = m.Avatar,
                            IsVirtual = m.IsVirtual,
                            Role = m.Role,
                            JoinedAt = m.JoinedAt,
                            UserId = m.UserId
                        }).ToList()
                    })
                    .ToListAsync();

                return Ok(families);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user families");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<FamilyDto>> CreateFamily(CreateFamilyDto createFamilyDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var family = new Family
                {
                    Name = createFamilyDto.Name,
                    Description = createFamilyDto.Description,
                    OwnerId = userId
                };

                _context.Families.Add(family);
                await _context.SaveChangesAsync();

                // Add the creator as a family member with Owner role
                var ownerMember = new FamilyMember
                {
                    FamilyId = family.Id,
                    UserId = userId,
                    Name = User.FindFirst(ClaimTypes.Name)?.Value ?? "Owner",
                    Role = "Owner",
                    IsVirtual = false
                };

                _context.FamilyMembers.Add(ownerMember);
                await _context.SaveChangesAsync();

                // Reload with related data
                var createdFamily = await _context.Families
                    .Include(f => f.Owner)
                    .Include(f => f.Members)
                    .FirstAsync(f => f.Id == family.Id);

                var result = new FamilyDto
                {
                    Id = createdFamily.Id,
                    Name = createdFamily.Name,
                    Description = createdFamily.Description,
                    OwnerId = createdFamily.OwnerId,
                    OwnerName = createdFamily.Owner.Name,
                    CreatedAt = createdFamily.CreatedAt,
                    Members = createdFamily.Members.Select(m => new FamilyMemberDto
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Avatar = m.Avatar,
                        IsVirtual = m.IsVirtual,
                        Role = m.Role,
                        JoinedAt = m.JoinedAt,
                        UserId = m.UserId
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetFamily), new { id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating family");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<FamilyDto>> GetFamily(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var family = await _context.Families
                    .Include(f => f.Owner)
                    .Include(f => f.Members)
                    .ThenInclude(m => m.User)
                    .Where(f => f.Id == id && (f.OwnerId == userId || f.Members.Any(m => m.UserId == userId)))
                    .FirstOrDefaultAsync();

                if (family == null)
                {
                    return NotFound();
                }

                var result = new FamilyDto
                {
                    Id = family.Id,
                    Name = family.Name,
                    Description = family.Description,
                    OwnerId = family.OwnerId,
                    OwnerName = family.Owner.Name,
                    CreatedAt = family.CreatedAt,
                    Members = family.Members.Select(m => new FamilyMemberDto
                    {
                        Id = m.Id,
                        Name = m.Name,
                        Avatar = m.Avatar,
                        IsVirtual = m.IsVirtual,
                        Role = m.Role,
                        JoinedAt = m.JoinedAt,
                        UserId = m.UserId
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting family");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("{familyId}/members")]
        public async Task<ActionResult<FamilyMemberDto>> AddFamilyMember(int familyId, CreateFamilyMemberDto createMemberDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Check if user is owner or admin of the family
                var family = await _context.Families
                    .Include(f => f.Members)
                    .FirstOrDefaultAsync(f => f.Id == familyId);

                if (family == null)
                {
                    return NotFound("Family not found");
                }

                var userMembership = family.Members.FirstOrDefault(m => m.UserId == userId);
                if (family.OwnerId != userId && (userMembership == null || (userMembership.Role != "Owner" && userMembership.Role != "Admin")))
                {
                    return Forbid("Only owners and admins can add family members");
                }

                var member = new FamilyMember
                {
                    FamilyId = familyId,
                    Name = createMemberDto.Name,
                    Avatar = createMemberDto.Avatar,
                    IsVirtual = createMemberDto.IsVirtual,
                    Role = createMemberDto.Role
                };

                _context.FamilyMembers.Add(member);
                await _context.SaveChangesAsync();

                var result = new FamilyMemberDto
                {
                    Id = member.Id,
                    Name = member.Name,
                    Avatar = member.Avatar,
                    IsVirtual = member.IsVirtual,
                    Role = member.Role,
                    JoinedAt = member.JoinedAt,
                    UserId = member.UserId
                };

                return CreatedAtAction(nameof(GetFamily), new { id = familyId }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error adding family member");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{familyId}/members/{memberId}")]
        public async Task<ActionResult<FamilyMemberDto>> UpdateFamilyMember(int familyId, int memberId, UpdateFamilyMemberDto updateMemberDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                // Check if user is owner or admin of the family
                var family = await _context.Families
                    .Include(f => f.Members)
                    .FirstOrDefaultAsync(f => f.Id == familyId);

                if (family == null)
                {
                    return NotFound("Family not found");
                }

                var userMembership = family.Members.FirstOrDefault(m => m.UserId == userId);
                if (family.OwnerId != userId && (userMembership == null || (userMembership.Role != "Owner" && userMembership.Role != "Admin")))
                {
                    return Forbid("Only owners and admins can update family members");
                }

                var memberToUpdate = await _context.FamilyMembers.FindAsync(memberId);
                if (memberToUpdate == null || memberToUpdate.FamilyId != familyId)
                {
                    return NotFound("Family member not found");
                }

                // Update member properties
                memberToUpdate.Name = updateMemberDto.Name;
                memberToUpdate.Avatar = updateMemberDto.Avatar;
                
                // Only allow role changes if user is owner or if changing to/from non-owner roles
                if (family.OwnerId == userId || (memberToUpdate.Role != "Owner" && updateMemberDto.Role != "Owner"))
                {
                    memberToUpdate.Role = updateMemberDto.Role;
                }

                await _context.SaveChangesAsync();

                var result = new FamilyMemberDto
                {
                    Id = memberToUpdate.Id,
                    Name = memberToUpdate.Name,
                    Avatar = memberToUpdate.Avatar,
                    IsVirtual = memberToUpdate.IsVirtual,
                    Role = memberToUpdate.Role,
                    JoinedAt = memberToUpdate.JoinedAt,
                    UserId = memberToUpdate.UserId
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating family member");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{familyId}/members/{memberId}")]
        public async Task<ActionResult> RemoveFamilyMember(int familyId, int memberId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                var family = await _context.Families
                    .Include(f => f.Members)
                    .FirstOrDefaultAsync(f => f.Id == familyId);

                if (family == null)
                {
                    return NotFound("Family not found");
                }

                var userMembership = family.Members.FirstOrDefault(m => m.UserId == userId);
                if (family.OwnerId != userId && (userMembership == null || (userMembership.Role != "Owner" && userMembership.Role != "Admin")))
                {
                    return Forbid("Only owners and admins can remove family members");
                }

                var memberToRemove = await _context.FamilyMembers.FindAsync(memberId);
                if (memberToRemove == null || memberToRemove.FamilyId != familyId)
                {
                    return NotFound("Family member not found");
                }

                // Don't allow removing the owner
                if (memberToRemove.Role == "Owner")
                {
                    return BadRequest("Cannot remove the family owner");
                }

                _context.FamilyMembers.Remove(memberToRemove);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error removing family member");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
