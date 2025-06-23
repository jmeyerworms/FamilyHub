namespace FamilyHub.Api.Services
{
    public interface IEmailService
    {
        Task SendPasswordResetEmailAsync(string email, string resetToken, string userName);
        Task SendWelcomeEmailAsync(string email, string userName);
    }
}
