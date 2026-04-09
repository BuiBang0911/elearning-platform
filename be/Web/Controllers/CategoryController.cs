using ApplicationCore.Data;
using ApplicationCore.DTOs;
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

        public CategoryController(IRepository<Category> categoryRepository)
        {
            _categoryRepository = categoryRepository;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<CategoryResponse>>> GetAll()
        {
            var categories = await _categoryRepository.ListAllAsync();
            var categoryResponses = categories.Select(c => new CategoryResponse { Id = c.Id, Name = c.Name });
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
            var category = new Category { Name = categoryRequest.Name };
            var res = await _categoryRepository.AddAsync(category);
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
            existingCategory.Name = categoryRequest.Name;
            await _categoryRepository.UpdateAsync(existingCategory);
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
            return NoContent();
        }
    }

}
