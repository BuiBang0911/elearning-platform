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
    public interface IBaseService<T> where T : BaseEntity
    {
        #region CUD

        Task AddRangeAsync(IEnumerable<T> entities);

        Task AddAsync(T entity);

        Task<T> AddAndReturnAsync(T entity);

        Task UpdateAsync(T entity);

        //Task DeleteAsync(Expression<Func<T, bool>> where);

        Task DeleteAsync(T entity);

        #endregion

        #region Get list

        Task<IPagedList<T>> GetPagedListAsync<TProperty>(Expression<Func<T, bool>> where = null,
            Expression<Func<T, TProperty>> orderBy = null, bool ascending = false, int page = 0,
            int count = int.MaxValue, params Expression<Func<T, object>>[] earlyLoad);

        Task<IEnumerable<T>> GetAsync(Expression<Func<T, bool>> @where = null, Expression<Func<T, object>> orderBy = null,
            bool @ascending = true, int page = 0, int count = int.MaxValue, params Expression<Func<T, object>>[] earlyLoad);

        #endregion

        #region get instance

        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> where);

        Task<T> FirstOrDefaultAsync(Expression<Func<T, bool>> where, params Expression<Func<T, object>>[] earlyLoad);

        #endregion

        #region Count

        Task<int> CountAsync(Expression<Func<T, bool>> where = null);

        #endregion

        #region Navigation

        Task<T> PreviousOrDefault(long currentEntityId, Expression<Func<T, bool>> where = null, Expression<Func<T, object>> orderBy = null, bool ascending = true);

        Task<T> NextOrDefault<TProperty>(long currentEntityId, Expression<Func<T, bool>> @where = null, Expression<Func<T, TProperty>> orderBy = null, bool @ascending = true);

        #endregion
    }
}
