using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.DTOs
{
    public class DashboardDto
    {
    }

    public class StudentStatsDto
    {
        public int EnrolledCount { get; set; }
        public int CompletedCount { get; set; }
        public int TotalLessonsFinished { get; set; }
    }
}
