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

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<DatabaseContext>(options =>
    options.UseNpgsql(connectionString,
        x => x.MigrationsAssembly("Infrastructure"))); 

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// 1. Kh?i t?o c?u hình và quét các Profile trong Assembly c?a UserMapping
builder.Services.AddAutoMapper(cfg =>
{
    cfg.AddProfile<UserMapping>();
    cfg.AddProfile<CourseMapping>();
}, AppDomain.CurrentDomain.GetAssemblies());


builder.Services.AddScoped<IRepository<User>, Repository<User>>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IRepository<Course>, Repository<Course>>();
builder.Services.AddScoped<ICourseService, CourseService>();

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