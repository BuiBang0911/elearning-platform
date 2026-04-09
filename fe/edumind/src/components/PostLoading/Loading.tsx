function DashboardSkeleton() {
	return (
		<div className="p-6 space-y-6 animate-pulse">
			{/* Header */}
			<div className="h-8 bg-gray-300 rounded w-1/3"></div>

			{/* Stats */}
			<div className="grid grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="p-4 bg-white rounded-xl shadow">
						<div className="h-4 bg-gray-300 rounded w-1/2 mb-2"></div>
						<div className="h-6 bg-gray-400 rounded w-1/3"></div>
					</div>
				))}
			</div>

			{/* List */}
			<div className="space-y-3">
				{[1, 2, 3, 4].map((i) => (
					<div key={i} className="h-12 bg-gray-200 rounded"></div>
				))}
			</div>
		</div>
	);
}

export default DashboardSkeleton;