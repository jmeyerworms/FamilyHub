using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using FamilyHub.Api.Data;
using FamilyHub.Api.DTOs.Auth;
using FamilyHub.Api.Models;
using FamilyHub.Api.Services;
using BCrypt.Net;
using Microsoft.AspNetCore.Authorization;
using System.Security.Cryptography;
using System.Text;

namespace FamilyHub.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly FamilyHubDbContext _context;
        private readonly IJwtService _jwtService;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(FamilyHubDbContext context, IJwtService jwtService, IEmailService emailService, ILogger<AuthController> logger)
        {
            _context = context;
            _jwtService = jwtService;
            _emailService = emailService;
            _logger = logger;
        }

        [HttpPost("register")]
        public async Task<ActionResult<AuthResponseDto>> Register(RegisterDto registerDto)
        {
            try
            {
                // Check if user already exists
                if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
                {
                    return BadRequest(new { message = "User with this email already exists" });
                }

                // Create new user
                var user = new User
                {
                    Email = registerDto.Email,
                    Name = registerDto.Name,
                    Avatar = registerDto.Avatar,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password)
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);

                var response = new AuthResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        Name = user.Name,
                        Avatar = user.Avatar
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user registration");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("login")]
        public async Task<ActionResult<AuthResponseDto>> Login(LoginDto loginDto)
        {
            try
            {
                // Find user by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == loginDto.Email);
                
                if (user == null || !BCrypt.Net.BCrypt.Verify(loginDto.Password, user.PasswordHash))
                {
                    return BadRequest(new { message = "Invalid credentials" });
                }

                // Generate JWT token
                var token = _jwtService.GenerateToken(user);

                var response = new AuthResponseDto
                {
                    Token = token,
                    User = new UserDto
                    {
                        Id = user.Id,
                        Email = user.Email,
                        Name = user.Name,
                        Avatar = user.Avatar
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during user login");
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("forgot-password")]
        public async Task<IActionResult> ForgotPassword(ForgotPasswordDto forgotPasswordDto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == forgotPasswordDto.Email);
                
                if (user == null)
                {
                    // Don't reveal if email exists or not for security
                    return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
                }

                // Generate reset token
                var resetToken = GenerateSecureToken();
                var tokenExpiry = DateTime.UtcNow.AddHours(1); // Token expires in 1 hour

                // Update user with reset token
                user.PasswordResetToken = resetToken;
                user.PasswordResetTokenExpiry = tokenExpiry;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                // Send password reset email
                await _emailService.SendPasswordResetEmailAsync(user.Email, resetToken, user.Name);

                return Ok(new { message = "If an account with that email exists, a password reset link has been sent." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset request for {Email}", forgotPasswordDto.Email);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("reset-password")]
        public async Task<IActionResult> ResetPassword(ResetPasswordDto resetPasswordDto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => 
                    u.Email == resetPasswordDto.Email && 
                    u.PasswordResetToken == resetPasswordDto.Token &&
                    u.PasswordResetTokenExpiry > DateTime.UtcNow);

                if (user == null)
                {
                    return BadRequest(new { message = "Invalid or expired reset token." });
                }

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(resetPasswordDto.NewPassword);
                user.PasswordResetToken = null;
                user.PasswordResetTokenExpiry = null;
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password has been reset successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password reset for {Email}", resetPasswordDto.Email);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword(ChangePasswordDto changePasswordDto)
        {
            try
            {
                var userId = int.Parse(User.FindFirst("userId")?.Value ?? "0");
                var user = await _context.Users.FindAsync(userId);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Verify current password
                if (!BCrypt.Net.BCrypt.Verify(changePasswordDto.CurrentPassword, user.PasswordHash))
                {
                    return BadRequest(new { message = "Current password is incorrect." });
                }

                // Update password
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(changePasswordDto.NewPassword);
                user.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync();

                return Ok(new { message = "Password has been changed successfully." });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during password change for user {UserId}", User.FindFirst("userId")?.Value);
                return StatusCode(500, new { message = "Internal server error" });
            }
        }

        private static string GenerateSecureToken()
        {
            using var rng = RandomNumberGenerator.Create();
            var bytes = new byte[64];
            rng.GetBytes(bytes);
            return Convert.ToBase64String(bytes)
                .Replace("+", "-")
                .Replace("/", "_")
                .Replace("=", "");
        }
    }
}
