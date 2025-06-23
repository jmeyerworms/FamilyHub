using Azure.Core;
using System.Text;

namespace FamilyHub.Api.Middleware
{
    public class RequestResponseLoggingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<RequestResponseLoggingMiddleware> _logger;

        public RequestResponseLoggingMiddleware(RequestDelegate next, ILogger<RequestResponseLoggingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            // Only log API endpoints and skip Swagger, static files, etc.
            if (ShouldLogRequest(context.Request))
            {
                // Log the request
                var request = await FormatRequest(context.Request);
                _logger.LogDebug("HTTP Request: {Request}", request);

                // Store the original response body stream
                var originalBodyStream = context.Response.Body;

                try
                {
                    // Create a new memory stream to capture the response
                    using var responseBody = new MemoryStream();
                    context.Response.Body = responseBody;

                    // Continue down the middleware pipeline
                    await _next(context);

                    // Format and log the response
                    var response = await FormatResponse(context.Response);
                    _logger.LogDebug("HTTP Response: {Response}", response);

                    // Copy the response body to the original stream and reset the position
                    responseBody.Position = 0;
                    await responseBody.CopyToAsync(originalBodyStream);
                }
                finally
                {
                    // Restore the original response body stream
                    context.Response.Body = originalBodyStream;
                }
            }
            else
            {
                // Skip logging and just call the next middleware
                await _next(context);
            }
        }

        private static bool ShouldLogRequest(HttpRequest request)
        {
            return request.Path.StartsWithSegments("/api") && 
                   !request.Path.StartsWithSegments("/swagger") &&
                   !request.Path.StartsWithSegments("/healthz");
        }

        private static async Task<string> FormatRequest(HttpRequest request)
        {
            // Enable buffering so we can read the request body multiple times
            request.EnableBuffering();
            
            // Read the request body
            var bodyAsText = string.Empty;
            if (request.Body.CanRead)
            {
                using var reader = new StreamReader(
                    request.Body,
                    encoding: Encoding.UTF8,
                    detectEncodingFromByteOrderMarks: false,
                    leaveOpen: true);
                
                bodyAsText = await reader.ReadToEndAsync();
                request.Body.Position = 0;  // Reset the position for future reads
            }

            var headerList = request.Headers.Select(x => $"{x.Key} , {x.Value}");
            var formattedHeaders = string.Join(", ", headerList);

            return $"{request.Method} {request.Path}{request.QueryString} {request.Protocol}, " +
                   $"Headers: {formattedHeaders}, " +
                   $"Body: {bodyAsText}";
        }

        private static async Task<string> FormatResponse(HttpResponse response)
        {
            response.Body.Seek(0, SeekOrigin.Begin);
            
            // Read the response body
            var bodyAsText = await new StreamReader(response.Body).ReadToEndAsync();
            
            // Don't include response body if it's too large (e.g., file downloads)
            if (bodyAsText.Length > 4000)
            {
                bodyAsText = $"[Content length: {bodyAsText.Length} characters]";
            }

            var headerList = response.Headers.Select(x => $"{x.Key} , {x.Value}");
            var formattedHeaders = string.Join(", ", headerList);

            response.Body.Seek(0, SeekOrigin.Begin);

            return $"Status: {response.StatusCode}, " +
                   $"Headers: {formattedHeaders}, " +
                   $"Body: {bodyAsText}";
        }
    }
}