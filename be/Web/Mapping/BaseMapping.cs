using AutoMapper;
using Infrastructure;

namespace Web.Mapping
{
    public class BaseMapping<TEntity, TRequest, TUpdateRequest, TResponse> : Profile where TEntity : BaseEntity
    {
        public BaseMapping() { 
            CreateMap<TEntity, TResponse>();

            CreateMap<TRequest, TEntity>();

            CreateMap<TUpdateRequest, TEntity>();
        }
    }
}
