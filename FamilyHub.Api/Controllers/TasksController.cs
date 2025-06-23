using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FamilyHub.Api.Data;
using FamilyHub.Api.DTOs.Tasks;
using FamilyHub.Api.Models;
using System.Security.Claims;
using System.Text.Json;

namespace FamilyHub.Api.Controllers
{
    [ApiController]
    [Route("api/families/{familyId}/[controller]")]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly FamilyHubDbContext _context;
        private readonly ILogger<TasksController> _logger;

        public TasksController(FamilyHubDbContext context, ILogger<TasksController> logger)
        {
            _context = context;
            _logger = logger;
        }

        private int GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userIdClaim ?? "0");
        }

        private async Task<bool> IsUserFamilyMember(int familyId, int userId)
        {
            return await _context.FamilyMembers
                .AnyAsync(fm => fm.FamilyId == familyId && fm.UserId == userId);
        }

        [HttpGet]
        public async Task<ActionResult<List<TaskDto>>> GetFamilyTasks(int familyId)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!await IsUserFamilyMember(familyId, userId))
                {
                    return Forbid("You are not a member of this family");
                }                var tasks = await _context.Tasks
                    .Include(t => t.Assignments)
                    .ThenInclude(a => a.FamilyMember)
                    .Where(t => t.FamilyId == familyId)
                    .ToListAsync();

                var taskDtos = tasks.Select(t => new TaskDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    DueDate = t.DueDate,
                    Priority = t.Priority,
                    Status = t.Status,
                    Recurrence = t.Recurrence,
                    RecurrencePattern = t.RecurrencePattern,
                    Location = t.Location,
                    Tags = string.IsNullOrEmpty(t.Tags) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(t.Tags) ?? new List<string>(),
                    CreatedAt = t.CreatedAt,
                    UpdatedAt = t.UpdatedAt,
                    AssignedMembers = t.Assignments.Select(a => new AssignedMemberDto
                    {
                        Id = a.FamilyMember.Id,
                        Name = a.FamilyMember.Name,
                        Avatar = a.FamilyMember.Avatar,
                        IsVirtual = a.FamilyMember.IsVirtual
                    }).ToList()
                }).ToList();

                return Ok(taskDtos);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting family tasks");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost]
        public async Task<ActionResult<TaskDto>> CreateTask(int familyId, CreateTaskDto createTaskDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!await IsUserFamilyMember(familyId, userId))
                {
                    return Forbid("You are not a member of this family");
                }

                var task = new FamilyTask
                {
                    FamilyId = familyId,
                    Title = createTaskDto.Title,
                    Description = createTaskDto.Description,
                    DueDate = createTaskDto.DueDate,
                    Priority = createTaskDto.Priority,
                    Recurrence = createTaskDto.Recurrence,
                    RecurrencePattern = createTaskDto.RecurrencePattern,
                    Location = createTaskDto.Location,
                    Tags = createTaskDto.Tags != null ? JsonSerializer.Serialize(createTaskDto.Tags) : null
                };

                _context.Tasks.Add(task);
                await _context.SaveChangesAsync();

                // Add task assignments
                if (createTaskDto.AssignedMemberIds != null && createTaskDto.AssignedMemberIds.Any())
                {
                    var assignments = createTaskDto.AssignedMemberIds.Select(memberId => new TaskAssignment
                    {
                        TaskId = task.Id,
                        FamilyMemberId = memberId
                    }).ToList();

                    _context.TaskAssignments.AddRange(assignments);
                    await _context.SaveChangesAsync();
                }

                // Reload task with assignments
                var createdTask = await _context.Tasks
                    .Include(t => t.Assignments)
                    .ThenInclude(a => a.FamilyMember)
                    .FirstAsync(t => t.Id == task.Id);

                var result = new TaskDto
                {
                    Id = createdTask.Id,
                    Title = createdTask.Title,
                    Description = createdTask.Description,
                    DueDate = createdTask.DueDate,
                    Priority = createdTask.Priority,
                    Status = createdTask.Status,
                    Recurrence = createdTask.Recurrence,
                    RecurrencePattern = createdTask.RecurrencePattern,
                    Location = createdTask.Location,
                    Tags = string.IsNullOrEmpty(createdTask.Tags) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(createdTask.Tags) ?? new List<string>(),
                    CreatedAt = createdTask.CreatedAt,
                    UpdatedAt = createdTask.UpdatedAt,
                    AssignedMembers = createdTask.Assignments.Select(a => new AssignedMemberDto
                    {
                        Id = a.FamilyMember.Id,
                        Name = a.FamilyMember.Name,
                        Avatar = a.FamilyMember.Avatar,
                        IsVirtual = a.FamilyMember.IsVirtual
                    }).ToList()
                };

                return CreatedAtAction(nameof(GetTask), new { familyId, id = result.Id }, result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<TaskDto>> GetTask(int familyId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!await IsUserFamilyMember(familyId, userId))
                {
                    return Forbid("You are not a member of this family");
                }

                var task = await _context.Tasks
                    .Include(t => t.Assignments)
                    .ThenInclude(a => a.FamilyMember)
                    .Where(t => t.Id == id && t.FamilyId == familyId)
                    .FirstOrDefaultAsync();

                if (task == null)
                {
                    return NotFound();
                }

                var result = new TaskDto
                {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    DueDate = task.DueDate,
                    Priority = task.Priority,
                    Status = task.Status,
                    Recurrence = task.Recurrence,
                    RecurrencePattern = task.RecurrencePattern,
                    Location = task.Location,
                    Tags = string.IsNullOrEmpty(task.Tags) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(task.Tags) ?? new List<string>(),
                    CreatedAt = task.CreatedAt,
                    UpdatedAt = task.UpdatedAt,
                    AssignedMembers = task.Assignments.Select(a => new AssignedMemberDto
                    {
                        Id = a.FamilyMember.Id,
                        Name = a.FamilyMember.Name,
                        Avatar = a.FamilyMember.Avatar,
                        IsVirtual = a.FamilyMember.IsVirtual
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPut("{id}")]
        public async Task<ActionResult<TaskDto>> UpdateTask(int familyId, int id, UpdateTaskDto updateTaskDto)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!await IsUserFamilyMember(familyId, userId))
                {
                    return Forbid("You are not a member of this family");
                }

                var task = await _context.Tasks
                    .Include(t => t.Assignments)
                    .Where(t => t.Id == id && t.FamilyId == familyId)
                    .FirstOrDefaultAsync();

                if (task == null)
                {
                    return NotFound();
                }

                // Update task properties
                if (updateTaskDto.Title != null) task.Title = updateTaskDto.Title;
                if (updateTaskDto.Description != null) task.Description = updateTaskDto.Description;
                if (updateTaskDto.DueDate.HasValue) task.DueDate = updateTaskDto.DueDate;
                if (updateTaskDto.Priority.HasValue) task.Priority = updateTaskDto.Priority.Value;
                if (updateTaskDto.Status.HasValue) task.Status = updateTaskDto.Status.Value;
                if (updateTaskDto.Recurrence != null) task.Recurrence = updateTaskDto.Recurrence;
                if (updateTaskDto.RecurrencePattern != null) task.RecurrencePattern = updateTaskDto.RecurrencePattern;
                if (updateTaskDto.Location != null) task.Location = updateTaskDto.Location;
                if (updateTaskDto.Tags != null) task.Tags = JsonSerializer.Serialize(updateTaskDto.Tags);

                task.UpdatedAt = DateTime.UtcNow;

                // Update assignments if provided
                if (updateTaskDto.AssignedMemberIds != null)
                {
                    // Remove existing assignments
                    _context.TaskAssignments.RemoveRange(task.Assignments);
                    
                    // Add new assignments
                    var newAssignments = updateTaskDto.AssignedMemberIds.Select(memberId => new TaskAssignment
                    {
                        TaskId = task.Id,
                        FamilyMemberId = memberId
                    }).ToList();

                    _context.TaskAssignments.AddRange(newAssignments);
                }

                await _context.SaveChangesAsync();

                // Reload task with updated assignments
                var updatedTask = await _context.Tasks
                    .Include(t => t.Assignments)
                    .ThenInclude(a => a.FamilyMember)
                    .FirstAsync(t => t.Id == task.Id);

                var result = new TaskDto
                {
                    Id = updatedTask.Id,
                    Title = updatedTask.Title,
                    Description = updatedTask.Description,
                    DueDate = updatedTask.DueDate,
                    Priority = updatedTask.Priority,
                    Status = updatedTask.Status,
                    Recurrence = updatedTask.Recurrence,
                    RecurrencePattern = updatedTask.RecurrencePattern,
                    Location = updatedTask.Location,
                    Tags = string.IsNullOrEmpty(updatedTask.Tags) ? new List<string>() : JsonSerializer.Deserialize<List<string>>(updatedTask.Tags) ?? new List<string>(),
                    CreatedAt = updatedTask.CreatedAt,
                    UpdatedAt = updatedTask.UpdatedAt,
                    AssignedMembers = updatedTask.Assignments.Select(a => new AssignedMemberDto
                    {
                        Id = a.FamilyMember.Id,
                        Name = a.FamilyMember.Name,
                        Avatar = a.FamilyMember.Avatar,
                        IsVirtual = a.FamilyMember.IsVirtual
                    }).ToList()
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> DeleteTask(int familyId, int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                
                if (!await IsUserFamilyMember(familyId, userId))
                {
                    return Forbid("You are not a member of this family");
                }

                var task = await _context.Tasks
                    .Where(t => t.Id == id && t.FamilyId == familyId)
                    .FirstOrDefaultAsync();

                if (task == null)
                {
                    return NotFound();
                }

                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting task");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }
    }
}
