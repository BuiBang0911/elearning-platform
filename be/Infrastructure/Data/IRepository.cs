using Ardalis.Specification;
using Ardalis.Specification.EntityFrameworkCore;
using Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Data
{
    public interface IRepository<T> where T : BaseEntity
    {
        #region Get instance

        Task<T> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        Task<IList<T>> GetByIdsAsync(IList<int> ids);

        Task<T> FirstAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

        Task<T> FirstOrDefaultSpecificationAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

        Task<T> FirstOrDefaultAsync();

        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where);

        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where, params Expression<Func<T, object>>[] relatedEntities);

        Task<T> FirstOrDefaultAsync<TProperty>(Expression<Func<T, bool>> @where, Expression<Func<T, TProperty>> orderBy, bool ascending,
            params Expression<Func<T, object>>[] relatedEntities);

        #endregion

        #region Get list

        Task<List<T>> ListAllAsync(CancellationToken cancellationToken = default);

        Task<List<T>> ListAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

        Task<IList<T>> ListFilterAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

        IQueryable<T> Get<TProperty>(Expression<Func<T, bool>> where = null, Expression<Func<T, TProperty>> orderBy = null, bool ascending = true, int page = 1, int count = int.MaxValue,
            params Expression<Func<T, object>>[] relatedEntities);

        Task<IEnumerable<T>> GetAsync<TProperty>(Expression<Func<T, bool>> where = null, Expression<Func<T, TProperty>> orderBy = null, bool ascending = true,
            int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] relatedEntities);

        Task<IPagedList<T>> GetPagedListAsync<TProperty>(Expression<Func<T, bool>> where = null,
            Expression<Func<T, TProperty>> orderBy = null,
            bool ascending = false, int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] relatedEntities);

        #endregion

        #region Count

        Task<int> CountAsync(ISpecification<T> spec, CancellationToken cancellationToken = default);

        Task<int> CountAsync(Expression<Func<T, bool>> @where);

        #endregion

        #region CUD

        Task<T> AddAsync(T entity, CancellationToken cancellationToken = default);

        Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

        Task UpdateAsync(T entity, CancellationToken cancellationToken = default);

        Task UpdateAsync(IList<T> entities, CancellationToken cancellationToken = default);

        Task DeleteAsync(T entity, CancellationToken cancellationToken = default);

        Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default);

        #endregion

        #region Properties
        /// <summary>
        /// Gets a table
        /// </summary>
        IQueryable<T> Table { get; }

        #endregion
    }
}
