using Microsoft.EntityFrameworkCore;
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

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];
var redisConnectionString = builder.Configuration.GetConnectionString("Redis");


builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(connectionString,
        x => x.MigrationsAssembly("Infrastructure"))); 

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

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

            RoleClaimType = "role",
            NameClaimType = "sub",
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy(UserRole.Admin.ToString(),
        p => p.RequireRole("Admin"));

    options.AddPolicy(UserRole.Lecturer.ToString(),
        p => p.RequireRole("Lecture"));

    options.AddPolicy(UserRole.Student.ToString(),
        p => p.RequireRole("Student"));
});

builder.Services.AddScoped<JwtService>();

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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthentication();

app.Use(async (context, next) =>
{
    var endpoint = context.GetEndpoint();

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
app.MapControllers();

app.Run();