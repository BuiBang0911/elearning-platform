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

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var jwtKey = builder.Configuration["Jwt:Key"];


builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(connectionString,
        x => x.MigrationsAssembly("Infrastructure"))); 

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

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
            )
        };
    });

builder.Services.AddScoped<JwtService>();

// 1. Kh?i t?o c?u hình và quét các Profile trong Assembly c?a UserMapping
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

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();