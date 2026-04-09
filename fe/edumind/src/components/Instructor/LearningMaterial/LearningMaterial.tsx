import { Badge } from "../../ui/badge";
import { FileStatus, FileStatusConfig, type DocumentResponse } from "../../../interfaces/Document";
import { ScrollArea } from "../../ui/scroll-area";
import { useEffect, useState } from "react";
import documentApi from "../../../api/Document.api";
import type { PagedList } from "../../../interfaces";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../ui/pagination";
import DashboardSkeleton from "../../PostLoading/Loading";
import { formatDate } from "../../../Format/FormatDate";
import { formatFileSize } from "../../../Format/FormatFileSize";

const LearningMaterial = () => {
	const [materialPage, setMaterialPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [courseDocuments, setCourseDocuments] = useState<PagedList<DocumentResponse>>({
		items: [],
		totalCount: 0,
		pageIndex: 1,
		pageSize: 10
	});

	useEffect(() => {
		// Fetch documents for the instructor's courses to populate the learning materials section
		const fetchDocuments = async () => {
			try {
				setIsLoading(true);
				const res = await documentApi.getByInstructorId({ pageIndex: materialPage, pageSize: 10 });
				setCourseDocuments(res);
				setIsLoading(false);
			} catch (error) {
				console.error("Error fetching documents:", error);
				setIsLoading(false);
			}
		};
		fetchDocuments();
	}, []);

	const materialPerPage = 5; // Fixed number of students per page
	const totalMaterialPages = Math.ceil(courseDocuments.totalCount / materialPerPage);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<>
			<ScrollArea className="h-96">
				<div className="divide-y">
					{courseDocuments.items.map((doc) => (
						<div key={doc.id} className="p-4 hover:bg-gray-50">
							<div className="flex items-start justify-between">
								<div className="flex items-start gap-3">
									{/* <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
						{doc.type === "video" ? (
							<Video className="w-5 h-5 text-gray-600" />
						) : (
							<FileText className="w-5 h-5 text-gray-600" />
						)}
					</div> */}
									<div>
										<h4 className="font-medium mb-1">{doc.fileName}</h4>
										<div className="flex items-center gap-3 text-sm text-gray-600">
											{/* <span className="capitalize">{doc.type}</span>
							<span>•</span> */}
											<span>{formatFileSize(doc.size)}</span>
											<span>•</span>
											<span>{formatDate(doc.uploadedAt)}</span>
										</div>
									</div>
								</div>
								<Badge
									variant={
										doc.status === FileStatus.Processing
											? "default"
											: doc.status === FileStatus.Failed
												? "destructive"
												: "outline"
									}
									className={FileStatusConfig[doc.status].className}
								>
									{FileStatusConfig[doc.status].label}
								</Badge>
							</div>
						</div>
					))}
				</div>
			</ScrollArea>
			<Pagination className="mt-4">
				<PaginationContent>
					<PaginationPrevious
						onClick={() => setMaterialPage((prev) => Math.max(prev - 1, 1))}
						disabled={materialPage === 1}
					>
						Previous
					</PaginationPrevious>
					{Array.from({ length: totalMaterialPages }, (_, index) => (
						<PaginationItem key={index + 1}>
							<PaginationLink
								onClick={() => setMaterialPage(index + 1)}
								isActive={index + 1 === materialPage}
							>
								{index + 1}
							</PaginationLink>
						</PaginationItem>
					))}
					<PaginationNext
						onClick={() => setMaterialPage((prev) => Math.min(prev + 1, totalMaterialPages))}
						disabled={materialPage === totalMaterialPages}
					>
						Next
					</PaginationNext>
				</PaginationContent>
			</Pagination>
		</>
	)
}

export default LearningMaterial;