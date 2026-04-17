using ApplicationCore.Data;
using ApplicationCore.DTO;
using ApplicationCore.Services.Courses;
using ApplicationCore.Services.Wallets;
using AutoMapper;
using Infrastructure.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ApplicationCore.Services.InstructorRequests
{
    public interface IInstructorRequestService : IBaseService<InstructorRequest>
    {
        Task<InstructorRequest> ApplyAsync(int userId, InstructorApplyRequest request);
        Task<List<InstructorRequestResponse>> GetPendingRequestsAsync();
        Task<InstructorRequest> ProcessRequestAsync(int requestId, ProcessRequestDto request);
    }

    public class InstructorRequestService : BaseService<InstructorRequest>, IInstructorRequestService
    {
        private readonly IRepository<InstructorRequest> _repository;
        private readonly IRepository<User> _userRepository;
        private readonly ITeacherWalletService _walletService;
        private readonly IMapper _mapper;

        public InstructorRequestService(IRepository<InstructorRequest> repository, IRepository<User> userRepository, ITeacherWalletService walletService, IMapper mapper) : base(repository)
        {
            _repository = repository;
            _userRepository = userRepository;
            _walletService = walletService;
            _mapper = mapper;
        }

        public async Task<InstructorRequest> ApplyAsync(int userId, InstructorApplyRequest request)
        {
            var existing = await _repository.FirstOrDefaultAsync(x => x.UserId == userId && x.Status == RequestStatus.Pending);
            if (existing != null) throw new Exception("You already have a pending request.");

            var instructorRequest = new InstructorRequest
            {
                UserId = userId,
                Specialty = request.Specialty,
                Experience = request.Experience,
                PortfolioUrl = request.PortfolioUrl,
                Status = RequestStatus.Pending,
                CreatedAt = DateTime.UtcNow
            };

            return await _repository.AddAsync(instructorRequest);
        }

        public async Task<List<InstructorRequestResponse>> GetPendingRequestsAsync()
        {
            var list = await _repository.GetAsync(x => x.Status == RequestStatus.Pending, orderBy: x => x.CreatedAt, relatedEntities: [x => x.User]);
            return list.Select(x => new InstructorRequestResponse
            {
                Id = x.Id,
                UserId = x.UserId,
                UserEmail = x.User?.Email ?? "N/A",
                UserFullName = x.User?.FullName ?? "N/A",
                Specialty = x.Specialty,
                Experience = x.Experience,
                PortfolioUrl = x.PortfolioUrl,
                Status = x.Status.ToString(),
                CreatedAt = x.CreatedAt
            }).ToList();
        }

        public async Task<InstructorRequest> ProcessRequestAsync(int requestId, ProcessRequestDto request)
        {
            var entity = await base.FirstOrDefaultAsync(x => x.Id == requestId, earlyLoad: [x => x.User]);
            if (entity == null) throw new Exception("Request not found.");

            entity.Status = request.Status;
            entity.AdminNote = request.AdminNote;
            entity.ProcessedAt = DateTime.UtcNow;

            if (request.Status == RequestStatus.Approved)
            {
                var user = entity.User;
                user.Role = UserRole.Instructor;
                await _userRepository.UpdateAsync(user);
                
                // Initialize wallet for new instructor
                await _walletService.GetOrCreateWalletAsync(user.Id);
            }

            await _repository.UpdateAsync(entity);
            return entity;
        }
    }
}
