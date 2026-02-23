using ApplicationCore.Data;
using ApplicationCore.Services;
using AutoMapper;
using Infrastructure;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using Web.Mapping;

namespace Web.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseEntityController<TEntity, TRequest, TUpdateRequest, TResponse> : ControllerBase where TEntity : BaseEntity
    {
        private readonly IBaseService<TEntity> _baseService;
        private readonly IMapper _mapper;

        public BaseEntityController(IBaseService<TEntity> baseService, IMapper mapper)
        {
            _baseService = baseService;
            _mapper = mapper;
        }

        #region CRUD

        [HttpPost]
        public virtual async Task<ActionResult<TResponse>> Create([FromBody] TUpdateRequest rq)
        {
            var entity = _mapper.Map<TEntity>(rq);
            var result = await _baseService.AddAndReturnAsync(entity);
            var res = _mapper.Map<TResponse>(result);
            return Ok(res);
        }

        [HttpPut("{id}")]
        public virtual async Task<IActionResult> Update(int id, [FromBody] TUpdateRequest rq)
        {
            /*var entity = _mapper.Map<TEntity>(rq);
            entity.Id = id;*/
            var entity = await _baseService.FirstOrDefaultAsync(x => x.Id == id);

            if (entity == null) return BadRequest();

            _mapper.Map(rq, entity);

            await _baseService.UpdateAsync(entity);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public virtual async Task<IActionResult> Delete(int id)
        {
            var entity = await _baseService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();

            await _baseService.DeleteAsync(entity);
            return NoContent();
        }

        #endregion

        #region Get

        [HttpGet("{id}")]
        public virtual async Task<ActionResult<TResponse>> GetById(int id)
        {
            var entity = await _baseService.FirstOrDefaultAsync(x => x.Id == id);
            if (entity == null)
                return NotFound();
            var res = _mapper.Map<TResponse>(entity);
            return Ok(res);
        }

        [HttpGet]
        public virtual async Task<ActionResult<IEnumerable<TResponse>>> GetAll()
        {
            var list = await _baseService.GetAsync();
            var res = _mapper.Map<IEnumerable<TResponse>>(list);
            return Ok(res);
        }

        #endregion

        #region Paging

        [HttpGet("get-page")]
        public virtual async Task<ActionResult<IPagedList<TResponse>>> GetPaged(
            int page = 0,
            int count = 20)
        {
            var result = await _baseService.GetPagedListAsync(
                where: null,
                orderBy: x => x.Id,
                ascending: false,
                page: page,
            count: count);

            var mappedItems = _mapper.Map<List<TResponse>>(result);

            var res = new PagedList<TResponse>(
                mappedItems,
                result.PageIndex,
                result.PageSize,
                result.TotalCount);

            return Ok(res);
        }

        #endregion

        #region Count

        [HttpGet("count")]
        public virtual async Task<ActionResult<int>> Count()
        {
            var count = await _baseService.CountAsync();
            return Ok(count);
        }

        #endregion
    }
}
