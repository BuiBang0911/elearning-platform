using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Data
{
    [Serializable]
    public class PagedList<T> : IPagedList<T>
    {
        public List<T> Items { get; set; } = new List<T>();

        public PagedList()
        {
        }

        public PagedList(IQueryable<T> source, int pageIndex, int pageSize, bool getOnlyTotalCount = false)
        {
            var total = source.Count();
            TotalCount = total;

            TotalPages = (int)Math.Ceiling(total / (double)pageSize);

            PageSize = pageSize;
            PageIndex = pageIndex;

            if (getOnlyTotalCount)
                return;

            AddRange(source.Skip(pageIndex * pageSize).Take(pageSize));
        }

        public PagedList(IList<T> source, int pageIndex, int pageSize)
        {
            if (pageSize <= 0)
                pageSize = 10;

            if (pageIndex < 0)
                pageIndex = 0;

            if (source != null)
            {
                TotalCount = source.Count;
                TotalPages = (int)Math.Ceiling(TotalCount / (double)pageSize);

                PageSize = pageSize;
                PageIndex = pageIndex;

                AddRange(source.Skip(pageIndex * pageSize).Take(pageSize));
            }
        }

        public PagedList(IEnumerable<T> source, int pageIndex, int pageSize, int totalCount)
        {
            TotalCount = totalCount;
            TotalPages = (int)Math.Ceiling(TotalCount / (double)pageSize);

            PageSize = pageSize;
            PageIndex = pageIndex;

            if (source != null)
            {
                AddRange(source);
            }
        }

        public void AddRange(IEnumerable<T> items)
        {
            Items.AddRange(items);
        }

        // 🔥 giữ tương thích code cũ (giống List)
        public int Count => Items.Count;

        public T this[int index]
        {
            get => Items[index];
            set => Items[index] = value;
        }

        // metadata
        public int PageIndex { get; set; }
        public int PageSize { get; set; }
        public int TotalCount { get; set; }
        public int TotalPages { get; set; }

        public bool HasPreviousPage => PageIndex > 0;
        public bool HasNextPage => PageIndex + 1 < TotalPages;
    }
}
