using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using FamilyHub.Api.Models;

namespace FamilyHub.Api.Services
{
    public interface IJwtService
    {
        string GenerateToken(User user);
        ClaimsPrincipal? GetPrincipalFromToken(string token);
    }

    public class JwtService : IJwtService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<JwtService> _logger;

        public JwtService(IConfiguration configuration, ILogger<JwtService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public string GenerateToken(User user)
        {
            _logger.LogInformation("Generating JWT token for user {UserId} with email {Email}", user.Id, user.Email);
            
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong");
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"]
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            var tokenString = tokenHandler.WriteToken(token);
            
            _logger.LogDebug("JWT token generated successfully with expiry {Expiry}", tokenDescriptor.Expires);
            
            return tokenString;
        }

        public ClaimsPrincipal? GetPrincipalFromToken(string token)
        {
            try
            {
                _logger.LogDebug("Validating JWT token");
                
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes(_configuration["Jwt:Secret"] ?? "YourSuperSecretKeyThatIsAtLeast32CharactersLong");
                
                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = true,
                    ValidIssuer = _configuration["Jwt:Issuer"],
                    ValidateAudience = true,
                    ValidAudience = _configuration["Jwt:Audience"],
                    ValidateLifetime = true,
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParameters, out _);
                
                var userId = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var email = principal.FindFirst(ClaimTypes.Email)?.Value;
                
                _logger.LogInformation("JWT token validated successfully for user {UserId} with email {Email}", userId, email);
                
                return principal;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "JWT token validation failed");
                return null;
            }
        }
    }
}
