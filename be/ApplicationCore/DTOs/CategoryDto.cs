using ApplicationCore.DTO;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.DTOs
{
    public class CategoryResponse : BaseDto
    {
        public string Name { get; set; }
    }

    public class CategoryRequest
    {
        public string Name { get; set; }
    }
}
