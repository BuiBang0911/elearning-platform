using Microsoft.EntityFrameworkCore;
using PayOS;
using Infrastructure;
using Infrastructure.Data;
using ApplicationCore.Data;
using ApplicationCore.Services.Users;
using Infrastructure.Entities;
using ApplicationCore.Services.Courses;
using Web.Mapping;
using Microsoft.Extensions.DependencyInjection;
using AutoMapper;
using ApplicationCore.Services.Documents;
using ApplicationCore.Services.Lessons;
using ApplicationCore.Services.ChatSessions;
using ApplicationCore.Services.ChatMessages;
using ApplicationCore.Services.Token;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Web.Services.WorkContext;
using System.Security.Claims;
using ApplicationCore.Services.Auth;
using StackExchange.Redis;
using ApplicationCore.Services.Cache;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using ApplicationCore.Services.Storage;
using ApplicationCore.Services.Enrollments;
using ApplicationCore.Services.UserLessons;
using ApplicationCore.Services.Dashboard;
using ApplicationCore.Services.Admin;
using ApplicationCore.Services.Rag;
using ApplicationCore.Services.Payments;
using ApplicationCore.Services.Wallets;
using ApplicationCore.Services.Withdrawals;
using Microsoft.AspNetCore.RateLimiting;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");
var aiServiceUrl = builder.Configuration["AIService:Url"] ?? "http://localhost:8000";
var allowedOrigins = builder.Configuration["AllowedOrigins"]?.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
    ?? new[] { "http://localhost:5173" };


builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(connectionString,
        x => x.MigrationsAssembly("Infrastructure"))); 

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 200,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    options.AddPolicy("AuthPolicy", httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6
        });
    });
    
    options.AddPolicy("AuthRegisterPolicy", httpContext =>
    {
        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetSlidingWindowLimiter(ip, _ => new SlidingWindowRateLimiterOptions
        {
            PermitLimit = 3,
            Window = TimeSpan.FromMinutes(1),
            SegmentsPerWindow = 6
        });
    });

    options.AddPolicy("UploadPolicy", httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
        return RateLimitPartition.GetFixedWindowLimiter(userId, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    options.AddPolicy("AiPolicy", httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
        return RateLimitPartition.GetFixedWindowLimiter(userId, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 10,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    options.AddPolicy("PaymentPolicy", httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var userId = httpContext.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
            ?? httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
            
        return RateLimitPartition.GetFixedWindowLimiter(userId, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 5,
            Window = TimeSpan.FromMinutes(1)
        });
    });

    options.AddPolicy("SearchPolicy", httpContext =>
    {
        var role = httpContext.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (role == nameof(UserRole.Admin)) return RateLimitPartition.GetNoLimiter("Admin");

        var ip = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(ip, _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 60,
            Window = TimeSpan.FromMinutes(1)
        });
    });
});

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new() { Title = "My API", Version = "v1" });

    // ?? Add Bearer Auth
    options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "token: Bearer {your_token}"
    });

    options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins(allowedOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
});

JwtSecurityTokenHandler.DefaultInboundClaimTypeMap.Clear();

builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,

            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],

            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            ),

            RoleClaimType = ClaimTypes.Role,
            NameClaimType = ClaimTypes.NameIdentifier,
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Cookies["accessToken"];

                if (!string.IsNullOrEmpty(token))
                {
                    context.Token = token;
                }

                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(UserRole.Admin.ToString(),
        p => p.RequireRole("Admin"));

    options.AddPolicy(UserRole.Instructor.ToString(),
        p => p.RequireRole("Instructor"));

    options.AddPolicy(UserRole.Student.ToString(),
        p => p.RequireRole("Student"));
});

builder.Services.AddScoped<JwtService>();

builder.Services.AddHttpClient("AIService", client =>
{
    client.BaseAddress = new Uri(aiServiceUrl);
    client.Timeout = TimeSpan.FromSeconds(60);
});

builder.Services.AddSingleton<IConnectionMultiplexer>(ConnectionMultiplexer.Connect(redisConnectionString));

builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<UserMapping>();
    cfg.AddProfile<CourseMapping>();
    cfg.AddProfile<LessonMapping>();
}, AppDomain.CurrentDomain.GetAssemblies());


builder.Services.AddScoped<IRepository<User>, Repository<User>>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRepository<Course>, Repository<Course>>();
builder.Services.AddScoped<ICourseService, CourseService>();
builder.Services.AddScoped<ILessonService, LessonService>();
builder.Services.AddScoped<IRepository<Lesson>, Repository<Lesson>>();
builder.Services.AddScoped<IEnrollmentService, EnrollmentService>();
builder.Services.AddScoped<IRepository<Enrollment>, Repository<Enrollment>>();
builder.Services.AddScoped<IRepository<UserLesson>, Repository<UserLesson>>();
builder.Services.AddScoped<IUserLessonService, UserLessonService>();
builder.Services.AddScoped<IRepository<Category>, Repository<Category>>();

builder.Services.AddScoped<IDashboardService, DashboardService>();
builder.Services.AddScoped<IAdminService, AdminService>();

builder.Services.AddScoped<IDocumentService, DocumentService>();
builder.Services.AddScoped<IRepository<Document>, Repository<Document>>();

// --- CHAT AI Services & Repositories ---
builder.Services.AddScoped<IChatSessionService, ChatSessionService>();
builder.Services.AddScoped<IRepository<ChatSession>, Repository<ChatSession>>();
builder.Services.AddScoped<IChatMessageService, ChatMessageService>();
builder.Services.AddScoped<IRepository<ChatMessage>, Repository<ChatMessage>>();
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IAuthService, AuthService>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IWorkContextService, WorkContextService>();

builder.Services.AddScoped<ICacheService, CacheService>();
builder.Services.AddScoped<ICeleryService, CeleryService>();
builder.Services.AddScoped<IStorageService, AzureStorageService>();
builder.Services.AddHttpClient<IRagService, RagService>();

// --- Payment & Wallet Services ---
var payOSClientId = builder.Configuration["PayOS:ClientId"] ?? "";
var payOSApiKey = builder.Configuration["PayOS:ApiKey"] ?? "";
var payOSChecksumKey = builder.Configuration["PayOS:ChecksumKey"] ?? "";
builder.Services.AddSingleton(new PayOSClient(payOSClientId, payOSApiKey, payOSChecksumKey));


builder.Services.AddScoped<IRepository<Infrastructure.Entities.Order>, Repository<Infrastructure.Entities.Order>>();
builder.Services.AddScoped<IRepository<TeacherWallet>, Repository<TeacherWallet>>();
builder.Services.AddScoped<IRepository<WalletTransaction>, Repository<WalletTransaction>>();
builder.Services.AddScoped<IRepository<WithdrawalRequest>, Repository<WithdrawalRequest>>();
builder.Services.AddScoped<IPaymentService, PaymentService>();
builder.Services.AddScoped<ITeacherWalletService, TeacherWalletService>();
builder.Services.AddScoped<IWithdrawalService, WithdrawalService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseHttpsRedirection();
}


app.UseCors("AllowFrontend");

app.UseRouting();

app.UseAuthentication();

app.Use(async (context, next) =>
{
    var endpoint = context.GetEndpoint();

    if (endpoint?.Metadata.GetMetadata<IAllowAnonymous>() != null)
    {
        await next();
        return;
    }

    if (endpoint == null)
    {
        await next();
        return;
    }

    var authorizeAttribute = endpoint?.Metadata.GetMetadata<IAuthorizeData>();
    if (authorizeAttribute == null)
    {
        await next();
        return;
    }
    var cacheService = context.RequestServices.GetRequiredService<ICacheService>();

    var jti = context.User.FindFirst("jti")?.Value;

    if (!string.IsNullOrEmpty(jti))
    {
        if (await cacheService.ExistsAsync(jti))
        {
            context.Response.StatusCode = 401; 
            await context.Response.WriteAsync("Log out success");
            return; 
        }
    }

    await next(); 
});

app.UseAuthorization();
app.UseRateLimiter();
app.MapControllers();

app.Run();