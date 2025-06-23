using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace FamilyHub.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly EmailSettings _emailSettings;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IOptions<EmailSettings> emailSettings, ILogger<EmailService> logger)
        {
            _emailSettings = emailSettings.Value;
            _logger = logger;
        }

        public async Task SendPasswordResetEmailAsync(string email, string resetToken, string userName)
        {
            try
            {
                var subject = "Password Reset - Family Hub";
                var resetLink = $"{_emailSettings.FrontendUrl}/reset-password?token={resetToken}&email={Uri.EscapeDataString(email)}";
                
                var body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                            <h2 style='color: #343a40; text-align: center;'>Password Reset Request</h2>
                            <p>Hello {userName},</p>
                            <p>You have requested to reset your password for your Family Hub account.</p>
                            <p>Click the button below to reset your password:</p>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{resetLink}' style='background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Reset Password</a>
                            </div>
                            <p>Or copy and paste this link into your browser:</p>
                            <p style='word-break: break-all; color: #007bff;'>{resetLink}</p>
                            <p><strong>This link will expire in 1 hour.</strong></p>
                            <p>If you didn't request this password reset, please ignore this email.</p>
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #dee2e6;'>
                            <p style='color: #6c757d; font-size: 12px; text-align: center;'>Family Hub - Keeping families connected</p>
                        </div>
                    </body>
                    </html>";

                await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send password reset email to {Email}", email);
                throw;
            }
        }

        public async Task SendWelcomeEmailAsync(string email, string userName)
        {
            try
            {
                var subject = "Welcome to Family Hub!";
                var body = $@"
                    <html>
                    <body style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <div style='background-color: #f8f9fa; padding: 20px; border-radius: 10px;'>
                            <h2 style='color: #343a40; text-align: center;'>Welcome to Family Hub!</h2>
                            <p>Hello {userName},</p>
                            <p>Welcome to Family Hub! We're excited to help you keep your family organized and connected.</p>
                            <p>You can now:</p>
                            <ul>
                                <li>Create and manage family tasks</li>
                                <li>Share family calendars</li>
                                <li>Organize family photos</li>
                                <li>Manage family members</li>
                            </ul>
                            <div style='text-align: center; margin: 30px 0;'>
                                <a href='{_emailSettings.FrontendUrl}' style='background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;'>Get Started</a>
                            </div>
                            <p>If you have any questions, feel free to contact our support team.</p>
                            <hr style='margin: 30px 0; border: none; border-top: 1px solid #dee2e6;'>
                            <p style='color: #6c757d; font-size: 12px; text-align: center;'>Family Hub - Keeping families connected</p>
                        </div>
                    </body>
                    </html>";

                await SendEmailAsync(email, subject, body);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send welcome email to {Email}", email);
                throw;
            }
        }

        private async Task SendEmailAsync(string toEmail, string subject, string body)
        {
            if (!_emailSettings.IsEnabled)
            {
                _logger.LogInformation("Email sending is disabled. Would send email to {Email} with subject: {Subject}", toEmail, subject);
                return;
            }

            using var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.SmtpPort);
            client.EnableSsl = _emailSettings.UseSsl;
            client.Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password);

            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.FromEmail, _emailSettings.FromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = true
            };

            mailMessage.To.Add(toEmail);

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
        }
    }

    public class EmailSettings
    {
        public bool IsEnabled { get; set; } = false;
        public string SmtpServer { get; set; } = string.Empty;
        public int SmtpPort { get; set; } = 587;
        public bool UseSsl { get; set; } = true;
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FromEmail { get; set; } = string.Empty;
        public string FromName { get; set; } = "Family Hub";
        public string FrontendUrl { get; set; } = "http://localhost:4200";
    }
}
