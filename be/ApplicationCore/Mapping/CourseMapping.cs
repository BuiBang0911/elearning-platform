using ApplicationCore.DTO;
using ApplicationCore.Mapping;
using Infrastructure.Entities;

namespace Web.Mapping
{
    public class CourseMapping : BaseMapping<Course, CourseRequest, CourseUpdateRequest, CourseResponse>
    {
        public CourseMapping()
        {
            // Entity → Response
            CreateMap<Course, CourseResponse>()
                .ForMember(dest => dest.CategoryName,
                    opt => opt.MapFrom(src => src.Category.Name))
                .ForMember(dest => dest.LectureName,
                    opt => opt.MapFrom(src => src.Lecturer.FullName));

            // Create
            CreateMap<CourseRequest, Course>()
                .ForMember(dest => dest.Thumbnail, opt => opt.Ignore());

            // Update
            CreateMap<CourseUpdateRequest, Course>()
                .ForMember(dest => dest.Thumbnail, opt => opt.Ignore());
        }
    }
}
