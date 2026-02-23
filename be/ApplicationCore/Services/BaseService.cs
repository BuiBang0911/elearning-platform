using ApplicationCore.Data;
using Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services
{
    public abstract class BaseService<T> : IBaseService<T> where T : BaseEntity
    {
        #region Fields

        private readonly IRepository<T> _dataRepository;
        //private readonly IEventPublisher _eventPublisher;

        #endregion

        #region Ctor
        protected BaseService(IRepository<T> dataRepository)
        {
            _dataRepository = dataRepository;
        }
        #endregion

        #region CUD
        public async Task AddAsync(T entity)
        {
            await _dataRepository.AddAsync(entity);
        }

        public async Task<T> AddAndReturnAsync(T entity)
        {
            return await _dataRepository.AddAsync(entity);
        }


        public async Task AddRangeAsync(IEnumerable<T> entities)
        {
            await _dataRepository.AddRangeAsync(entities);
        }

        public async Task UpdateAsync(T entity)
        {
            await _dataRepository.UpdateAsync(entity);
        }


        public async Task DeleteAsync(T entity)
        {
            await _dataRepository.DeleteAsync(entity);
        }

        #endregion

        #region Get list

        public virtual async Task<IPagedList<T>> GetPagedListAsync<TProperty>(Expression<Func<T, bool>> where = null,
           Expression<Func<T, TProperty>> orderBy = null,
           bool ascending = false, int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] earlyLoad)
        {
            return await _dataRepository.GetPagedListAsync(@where, orderBy, ascending, page, count, earlyLoad);
        }

        public virtual async Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>> @where = null, Expression<Func<T, object>> orderBy = null,
            bool @ascending = true, int page = 1, int count = int.MaxValue, params Expression<Func<T, object>>[] earlyLoad)
        {
            return await _dataRepository.GetAsync(@where, orderBy, ascending, page, count, earlyLoad);
        }

        #endregion

        #region Get instance

        public virtual async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where)
        {
            return await _dataRepository.FirstOrDefaultAsync(where);
        }

        public virtual async Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> @where, params Expression<Func<T, object>>[] earlyLoad)
        {
            return await _dataRepository.FirstOrDefaultAsync(where, earlyLoad);
        }
        #endregion

        #region Count
        public virtual async Task<int> CountAsync(Expression<Func<T, bool>> @where = null)
        {
            return await _dataRepository.CountAsync(where == null ? x => true : where);
        }

        #endregion

        #region Next

        public async Task<T> PreviousOrDefault(long currentEntityId, Expression<Func<T, bool>> @where = null, Expression<Func<T, object>> orderBy = null, bool @ascending = true)
        {
            var query = await _dataRepository.GetAsync(where, orderBy, ascending);
            return query.AsEnumerable()
                .TakeWhile(x => x.Id != currentEntityId)
                .LastOrDefault();
        }

        public async Task<T> NextOrDefault<TProperty>(long currentEntityId, Expression<Func<T, bool>> @where = null, Expression<Func<T, TProperty>> orderBy = null, bool @ascending = true)
        {
            var query = await _dataRepository.GetAsync(where, orderBy, ascending);

            return query.AsEnumerable()
                .SkipWhile(x => x.Id != currentEntityId)
                .Skip(1)
                .FirstOrDefault();
        }

        #endregion
    }
}
