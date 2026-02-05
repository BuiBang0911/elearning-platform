using ApplicationCore.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;
using Ardalis.Specification;
using Ardalis.Specification.EntityFrameworkCore;

namespace Infrastructure.Data
{
    public class Repository<T> : IRepository<T> where T : BaseEntity
    {
        #region Fields
        private IQueryable<T> _entities;

        protected readonly DatabaseContext _dbContext;
        #endregion

        #region Propertise

        /// <summary>
        /// Gets an entity set
        /// </summary>
        public virtual IQueryable<T> Table => _entities ?? (_entities = _dbContext.Set<T>());

        #endregion

        #region Ctor

        public Repository(DatabaseContext dbContext)
        {
            _dbContext = dbContext;
        }

        #endregion

        #region Get instance

        /// <summary>
        /// 
        /// </summary>
        /// <param name="id"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public virtual async Task<T> GetByIdAsync(int id, CancellationToken cancellationToken = default)
        {
            var keyValues = new object[] { id };
            return await _dbContext.Set<T>().FindAsync(keyValues, cancellationToken);
        }

        public virtual async Task<IList<T>> GetByIdsAsync(IList<int> ids)
        {
            if (!ids?.Any() ?? true)
                return new List<T>();

            //get entries
            var entries = await _dbContext.Set<T>().Where(entry => ids.Contains(entry.Id)).ToListAsync();

            return entries;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="spec"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<T> FirstAsync(ISpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var specificationResult = ApplySpecification(spec);
            return await specificationResult.FirstAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="spec"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<T> FirstOrDefaultSpecificationAsync(ISpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var specificationResult = ApplySpecification(spec);
            return await specificationResult.FirstOrDefaultAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <returns></returns>
        public async Task<T> FirstOrDefaultAsync()
        {
            return await _dbContext.Set<T>().FirstOrDefaultAsync();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <returns></returns>
        public async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where)
        {
            return await _dbContext.Set<T>().Where(@where).FirstOrDefaultAsync();
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where, params Expression<Func<T, object>>[] relatedEntities)
        {
            var resultSet = _dbContext.Set<T>().AsQueryable();
            resultSet = IncludeRelatedEntities(resultSet, relatedEntities);

            return await resultSet.Where(where).FirstOrDefaultAsync();
        }


        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="TProperty"></typeparam>
        /// <param name="where"></param>
        /// <param name="orderBy"></param>
        /// <param name="ascending"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public async Task<T> FirstOrDefaultAsync<TProperty>(Expression<Func<T, bool>> @where, Expression<Func<T, TProperty>> orderBy, bool ascending,
            params Expression<Func<T, object>>[] relatedEntities)
        {
            if (where == null)
                where = (x => true);

            var resultSet = _dbContext.Set<T>().Where(where);

            if (orderBy != null)
                //order
                resultSet = ascending ? resultSet.OrderBy(orderBy) : resultSet.OrderByDescending(orderBy);
            else
                resultSet = resultSet.OrderBy(x => x.Id);

            resultSet = IncludeRelatedEntities(resultSet, relatedEntities); ;

            return await resultSet.FirstOrDefaultAsync();
        }

        #endregion

        #region Get list

        /// <summary>
        /// 
        /// </summary>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>s
        public async Task<List<T>> ListAllAsync(CancellationToken cancellationToken = default)
        {
            return await _dbContext.Set<T>().ToListAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="spec"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<List<T>> ListAsync(ISpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var specificationResult = ApplySpecification(spec);
            return await specificationResult.AsNoTracking().ToListAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="spec"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<IList<T>> ListFilterAsync(ISpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var specificationResult = ApplySpecification(spec);
            return await specificationResult.AsNoTracking().ToListAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <returns></returns>
        public virtual IQueryable<T> Get(Expression<Func<T, bool>> @where)
        {
            return _dbContext.Set<T>().Where(where);
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public virtual IQueryable<T> Get(Expression<Func<T, bool>> @where, params Expression<Func<T, object>>[] relatedEntities)
        {
            IQueryable<T> resultSet = _dbContext.Set<T>().Where(where);

            resultSet = IncludeRelatedEntities(resultSet, relatedEntities); ;

            return resultSet;
        }

        public virtual IQueryable<T> Get<TProperty>(Expression<Func<T, bool>> where = null, Expression<Func<T, TProperty>> orderBy = null,
            bool ascending = true, int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] relatedEntities)
        {
            IQueryable<T> resultSet = _dbContext.Set<T>().AsQueryable();

            if (where != null)
            {
                resultSet = resultSet.Where(where);
            }

            if (orderBy != null)
                //order
                resultSet = ascending ? resultSet.OrderBy(orderBy) : resultSet.OrderByDescending(orderBy);
            else
                resultSet = resultSet.OrderBy(x => x.Id);

            //pagination
            resultSet = resultSet.Skip((page) * count).Take(count);

            resultSet = IncludeRelatedEntities(resultSet, relatedEntities); ;

            return resultSet;
        }

        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="TProperty"></typeparam>
        /// <param name="where"></param>
        /// <param name="orderBy"></param>
        /// <param name="ascending"></param>
        /// <param name="page"></param>
        /// <param name="count"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public virtual async Task<IEnumerable<T>> GetAsync<TProperty>(Expression<Func<T, bool>> where = null,
            Expression<Func<T, TProperty>> orderBy = null, bool ascending = true, int page = 0, int count = int.MaxValue,
            params Expression<Func<T, object>>[] relatedEntities)
        {
            IQueryable<T> resultSet = _dbContext.Set<T>().AsQueryable();

            if (where != null)
            {
                resultSet = resultSet.Where(where);
            }
            if (orderBy != null)
                //order
                resultSet = ascending ? resultSet.OrderBy(orderBy) : resultSet.OrderByDescending(orderBy);
            else
                resultSet = resultSet.OrderBy(x => x.Id);

            //pagination
            resultSet = resultSet.Skip(page * count).Take(count);

            resultSet = IncludeRelatedEntities(resultSet, relatedEntities); ;

            return await resultSet.ToListAsync();
        }
        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="TProperty"></typeparam>
        /// <param name="where"></param>
        /// <param name="orderBy"></param>
        /// <param name="ascending"></param>
        /// <param name="page"></param>
        /// <param name="count"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public virtual IPagedList<T> GetPagedList<TProperty>(Expression<Func<T, bool>> where = null, Expression<Func<T, TProperty>> orderBy = null,
            bool ascending = false, int page = 0, int count = int.MaxValue,
            params Expression<Func<T, object>>[] relatedEntities)
        {
            IQueryable<T> resultSet = _dbContext.Set<T>().AsQueryable();

            if (where != null)
            {
                resultSet = resultSet.Where(where);
            }

            resultSet = IncludeRelatedEntities(resultSet, relatedEntities); ;

            if (orderBy != null)
            {
                resultSet = ascending ? resultSet.OrderBy(orderBy) : resultSet.OrderByDescending(orderBy);
            }
            else
                resultSet = ascending ? resultSet.OrderBy(x => x.Id) : resultSet.OrderByDescending(x => x.Id);
            return new PagedList<T>(resultSet, page, count);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <typeparam name="TProperty"></typeparam>
        /// <param name="where"></param>
        /// <param name="orderBy"></param>
        /// <param name="ascending"></param>
        /// <param name="page"></param>
        /// <param name="count"></param>
        /// <param name="relatedEntities"></param>
        /// <returns></returns>
        public virtual async Task<IPagedList<T>> GetPagedListAsync<TProperty>(Expression<Func<T, bool>> where = null,
            Expression<Func<T, TProperty>> orderBy = null,
            bool ascending = false, int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] relatedEntities)
        {
            IQueryable<T> query = _dbContext.Set<T>().AsQueryable();

            // Filter
            if (where != null)
                query = query.Where(where);

            // Include navigation properties
            query = IncludeRelatedEntities(query, relatedEntities);

            // Order
            if (orderBy != null)
                query = ascending ? query.OrderBy(orderBy) : query.OrderByDescending(orderBy);
            else
                query = ascending ? query.OrderBy(x => x.Id) : query.OrderByDescending(x => x.Id);

            // Total count
            var totalCount = await query.CountAsync();

            // Paging
            var items = await query
                .Skip(page * count)
                .Take(count)
                .ToListAsync();

            return new PagedList<T>(items, totalCount, page, count);
        }

        #endregion

        #region Count
        /// <summary>
        /// 
        /// </summary>
        /// <param name="spec"></param>
        /// <param name="cancellationToken"></param>
        /// <returns></returns>
        public async Task<int> CountAsync(ISpecification<T> spec, CancellationToken cancellationToken = default)
        {
            var specificationResult = ApplySpecification(spec);
            return await specificationResult.CountAsync(cancellationToken);
        }

        /// <summary>
        /// 
        /// </summary>
        /// <param name="where"></param>
        /// <returns></returns>
        public virtual async Task<int> CountAsync(Expression<Func<T, bool>> @where)
        {
            return await Table.CountAsync(where);
        }
        #endregion

        #region CUD

        public async Task<T> AddAsync(T entity, CancellationToken cancellationToken = default)
        {
            await _dbContext.Set<T>().AddAsync(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return entity;
        }

        public async Task<IEnumerable<T>> AddRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            await _dbContext.Set<T>().AddRangeAsync(entities);
            await _dbContext.SaveChangesAsync(cancellationToken);

            return entities;
        }

        public async Task UpdateAsync(T entity, CancellationToken cancellationToken = default)
        {
            _dbContext.Entry(entity).State = EntityState.Modified;
            await _dbContext.SaveChangesAsync(cancellationToken);

        }

        /// <summary>
        /// Update entity entries
        /// </summary>
        /// <param name="entities">Entity entries</param>
        /// <param name="publishEvent">Whether to publish event notification</param>
        /// <returns>A task that represents the asynchronous operation</returns>
        public virtual async Task UpdateAsync(IList<T> entities, CancellationToken cancellationToken = default)
        {
            if (entities == null)
                throw new ArgumentNullException(nameof(entities));

            if (!entities.Any())
                return;

            foreach (var entity in entities)
            {
                _dbContext.Entry(entity).State = EntityState.Modified;
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }


        public async Task DeleteAsync(T entity, CancellationToken cancellationToken = default)
        {
            _dbContext.Set<T>().Remove(entity);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        public async Task DeleteRangeAsync(IEnumerable<T> entities, CancellationToken cancellationToken = default)
        {
            _dbContext.Set<T>().RemoveRange(entities);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        ///// <summary>
        ///// Truncates database table
        ///// </summary>
        ///// <param name="resetIdentity">Performs reset identity column</param>
        ///// <returns>A task that represents the asynchronous operation</returns>
        //public virtual async Task TruncateAsync(bool resetIdentity = false)
        //{
        // TODO implement
        //}
        #endregion

        #region Utils
        private IQueryable<T> ApplySpecification(ISpecification<T> spec)
        {
            return SpecificationEvaluator.Default
                .GetQuery(_dbContext.Set<T>().AsQueryable(), spec);
        }
        private IQueryable<T> IncludeRelatedEntities(IQueryable<T> resultSet, params Expression<Func<T, object>>[] relatedEntities)
        {
            if (relatedEntities != null)
            {
                foreach (var entity in relatedEntities)
                {
                    resultSet = resultSet.Include(entity);
                }
            }
            return resultSet;
        }
        #endregion
    }
}
