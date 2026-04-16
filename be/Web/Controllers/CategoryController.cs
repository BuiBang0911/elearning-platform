using ApplicationCore.Data;
using ApplicationCore.DTOs;
using ApplicationCore.Services.Cache;
using Infrastructure.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Web.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CategoryController : ControllerBase
    {
        private readonly IRepository<Category> _categoryRepository;
        private readonly ICacheService _cacheService;
        private const string CategoriesCacheKey = "categories:all";

        public CategoryController(IRepository<Category> categoryRepository, ICacheService cacheService)
        {
            _categoryRepository = categoryRepository;
            _cacheService = cacheService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetAll()
        {
            var cached = await _cacheService.GetAsync<List<CategoryResponse>>(CategoriesCacheKey);
            if (cached != null) return Ok(cached);

            var categories = await _categoryRepository.ListAllAsync();
            var categoryResponses = categories.Select(c => new CategoryResponse { Id = c.Id, Name = c.Name }).ToList();
            
            await _cacheService.SetAsync(CategoriesCacheKey, categoryResponses, TimeSpan.FromHours(1));
            
            return Ok(categoryResponses);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<CategoryResponse>> GetById(int id)
        {
            var category = await _categoryRepository.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound();
            }
            var categoryResponse = new CategoryResponse { Id = category.Id, Name = category.Name };
            return Ok(categoryResponse);
        }

        [HttpPost]
        public async Task<ActionResult<CategoryResponse>> Create(CategoryRequest categoryRequest)
        {
            // Check for duplicate name (case-insensitive)
            var existing = await _categoryRepository.FirstOrDefaultAsync(c => c.Name.ToLower() == categoryRequest.Name.ToLower());
            if (existing != null)
            {
                return BadRequest("A category with this name already exists.");
            }

            var category = new Category { Name = categoryRequest.Name };
            var res = await _categoryRepository.AddAsync(category);
            await _cacheService.RemoveAsync(CategoriesCacheKey);
            var categoryResponse = new CategoryResponse { Id = res.Id, Name = res.Name };
            return Ok(categoryResponse);
        }

        [HttpPut("{id}")]
        public async Task<ActionResult> Update(int id, CategoryRequest categoryRequest)
        {
            var existingCategory = await _categoryRepository.FirstOrDefaultAsync(c => c.Id == id);
            if (existingCategory == null)
            {
                return NotFound();
            }

            // Check if another category already has this name
            var duplicate = await _categoryRepository.FirstOrDefaultAsync(c => c.Id != id && c.Name.ToLower() == categoryRequest.Name.ToLower());
            if (duplicate != null)
            {
                return BadRequest("Another category with this name already exists.");
            }

            existingCategory.Name = categoryRequest.Name;
            await _categoryRepository.UpdateAsync(existingCategory);
            await _cacheService.RemoveAsync(CategoriesCacheKey);
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(int id)
        {
            var category = await _categoryRepository.FirstOrDefaultAsync(c => c.Id == id);
            if (category == null)
            {
                return NotFound();
            }
            await _categoryRepository.DeleteAsync(category);
            await _cacheService.RemoveAsync(CategoriesCacheKey);
            return NoContent();
        }
    }

}
