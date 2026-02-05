using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using ApplicationCore.Entities;

namespace Infrastructure.Data
{
    public class DatabaseContext : DbContext
    {
        public DatabaseContext() : base()
        {

        }

        public DatabaseContext(DbContextOptions<DatabaseContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Course> Courses { get; set; }
        public DbSet<Enrollment> Enrollments { get; set; }
        public DbSet<Lesson> Lessons { get; set; }
        public DbSet<Document> Documents { get; set; }
        public DbSet<ChatSession> ChatSessions { get; set; }
        public DbSet<ChatMessage> ChatMessages { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // 1. Cấu hình bảng Users
            modelBuilder.Entity<User>(entity =>
            {
                entity.HasKey(u => u.Id);
                entity.HasIndex(u => u.Email).IsUnique();
                entity.Property(u => u.Email).IsRequired().HasMaxLength(255);
                entity.Property(u => u.FullName).IsRequired();
            });

            // 2. Cấu hình bảng Courses
            modelBuilder.Entity<Course>(entity =>
            {
                entity.HasKey(c => c.Id);
                // Quan hệ 1-N: Một Lecturer (User) dạy nhiều Course
                entity.HasOne(c => c.Lecturer)
                      .WithMany(u => u.TeachesCourses)
                      .HasForeignKey(c => c.LecturerId)
                      .OnDelete(DeleteBehavior.Restrict);
            });

            // 3. Cấu hình bảng Enrollments (Bảng trung gian N-N giữa User và Course)
            modelBuilder.Entity<Enrollment>(entity =>
            {
                // Khóa chính phức hợp (Composite Key)
                entity.HasKey(e => new { e.UserId, e.CourseId });

                entity.HasOne(e => e.User)
                      .WithMany(u => u.Enrollments)
                      .HasForeignKey(e => e.UserId);

                entity.HasOne(e => e.Course)
                      .WithMany(c => c.Enrollments)
                      .HasForeignKey(e => e.CourseId);
            });

            // 4. Cấu hình bảng Lessons
            modelBuilder.Entity<Lesson>(entity =>
            {
                entity.HasKey(l => l.Id);
                // Quan hệ 1-N: Course contains Lessons
                entity.HasOne(l => l.Course)
                      .WithMany(c => c.Lessons)
                      .HasForeignKey(l => l.CourseId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // 5. Cấu hình bảng Documents
            modelBuilder.Entity<Document>(entity =>
            {
                entity.HasKey(d => d.Id);
                // Quan hệ 1-N: Lesson has Documents
                entity.HasOne(d => d.Lesson)
                      .WithMany(l => l.Documents)
                      .HasForeignKey(d => d.LessonId);
            });

            // 6. Cấu hình bảng ChatSessions
            modelBuilder.Entity<ChatSession>(entity =>
            {
                entity.HasKey(s => s.Id);

                // Quan hệ sở hữu bởi User
                entity.HasOne(s => s.User)
                      .WithMany()
                      .HasForeignKey(s => s.UserId);

                // Quan hệ ngữ cảnh Course
                entity.HasOne(s => s.Course)
                      .WithMany()
                      .HasForeignKey(s => s.CourseId);
            });

            // 7. Cấu hình bảng ChatMessages
            modelBuilder.Entity<ChatMessage>(entity =>
            {
                entity.HasKey(m => m.Id);
                // Quan hệ 1-N: Session contains Messages
                entity.HasOne(m => m.Session)
                      .WithMany(s => s.Messages)
                      .HasForeignKey(m => m.SessionId)
                      .OnDelete(DeleteBehavior.Cascade);
            });
        }

    }
}
