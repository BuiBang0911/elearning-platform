import { Badge } from "../../ui/badge";
import { FileStatus, FileStatusConfig, type DocumentResponse } from "../../../interfaces/Document";
import { ScrollArea } from "../../ui/scroll-area";
import { useEffect, useMemo, useState } from "react";
import documentApi from "../../../api/Document.api";
import type { PagedList } from "../../../interfaces";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "../../ui/pagination";
import DashboardSkeleton from "../../PostLoading/Loading";
import { formatDate } from "../../../Format/FormatDate";
import { formatFileSize } from "../../../Format/FormatFileSize";
import { Search, FileText, Download, Trash2, HardDrive } from "lucide-react";
import { Input } from "../../ui/input";
import { toast } from "sonner";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../../ui/alert-dialog";

const LearningMaterial = () => {
	const [materialPage, setMaterialPage] = useState(1);
	const [isLoading, setIsLoading] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [deleteId, setDeleteId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	const [courseDocuments, setCourseDocuments] = useState<PagedList<DocumentResponse>>({
		items: [],
		totalCount: 0,
		pageIndex: 1,
		pageSize: 10
	});

	useEffect(() => {
		const fetchDocuments = async () => {
			try {
				setIsLoading(true);
				const res = await documentApi.getByInstructorId({ pageIndex: materialPage - 1, pageSize: 12 });
				setCourseDocuments(res);
			} catch (error) {
				console.error("Error fetching documents:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchDocuments();
	}, [materialPage]);

	const handleDelete = async () => {
		if (!deleteId) return;
		try {
			setIsDeleting(true);
			await documentApi.remove(deleteId);
			setCourseDocuments(prev => ({
				...prev,
				items: prev.items.filter(doc => doc.id !== deleteId),
				totalCount: prev.totalCount - 1
			}));
			toast.success("Document deleted successfully");
		} catch (error) {
			console.error("Error deleting document:", error);
			toast.error("Failed to delete document");
		} finally {
			setIsDeleting(false);
			setDeleteId(null);
		}
	}

	const handleDownload = (id: number) => {
		const url = `${import.meta.env.VITE_API_BASE_URL}/Document/download/${id}?download=true`;
		window.open(url, '_blank');
	}

	const filteredItems = useMemo(() => {
		return courseDocuments.items.filter(doc =>
			doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())
		);
	}, [courseDocuments.items, searchTerm]);

	const totalMaterialPages = Math.ceil(courseDocuments.totalCount / 12);

	if (isLoading) return <DashboardSkeleton />;

	return (
		<div className="space-y-6">
			{/* Search & Stats Header */}
			<div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-100">
				<div className="relative w-full md:w-96">
					<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
					<Input
						placeholder="Search materials..."
						className="pl-10 bg-slate-50 border-none h-11 focus-visible:ring-blue-500"
						value={searchTerm}
						onChange={(e) => setSearchTerm(e.target.value)}
					/>
				</div>
				<div className="flex items-center gap-2 text-sm font-medium text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
					<HardDrive className="w-4 h-4" />
					Total Documents: {courseDocuments.totalCount}
				</div>
			</div>

			<ScrollArea className="h-[500px] pr-4">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
					{filteredItems.length > 0 ? (
						filteredItems.map((doc) => (
							<div key={doc.id} className="p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-4">
										<div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-colors">
											<FileText className="w-6 h-6" />
										</div>
										<div>
											<h4 className="font-bold text-slate-800 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
												{doc.fileName}
											</h4>
											<div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
												<span>{formatFileSize(doc.size)}</span>
												<span className="text-slate-300">•</span>
												<span>{formatDate(doc.uploadedAt)}</span>
											</div>
										</div>
									</div>
									<div className="flex flex-col items-end gap-2">
										<Badge
											variant={
												doc.status === FileStatus.Processing
													? "default"
													: doc.status === FileStatus.Failed
														? "destructive"
														: "outline"
											}
											className={`${FileStatusConfig[doc.status].className} text-[10px] px-2 py-0 h-5`}
										>
											{FileStatusConfig[doc.status].label}
										</Badge>
										<div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
											<button 
												onClick={() => handleDownload(doc.id)}
												className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
											>
												<Download className="w-4 h-4" />
											</button>
											<button
												onClick={() => setDeleteId(doc.id)}
												className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
											>
												<Trash2 className="w-4 h-4" />
											</button>
										</div>
									</div>
								</div>
							</div>
						))
					) : (
						<div className="col-span-full py-20 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
							<Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
							<p className="font-medium">No materials found matching "{searchTerm}"</p>
						</div>
					)}
				</div>
			</ScrollArea>

			{/* AlertDialog for Delete Confirmation */}
			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the document
							and remove all associated AI vector data.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction 
							onClick={(e) => {
								e.preventDefault();
								handleDelete();
							}}
							className="bg-red-600 hover:bg-red-700"
							disabled={isDeleting}
						>
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{courseDocuments.totalCount > 12 && (
				<Pagination className="mt-6">
					<PaginationContent>
						<PaginationPrevious
							onClick={() => setMaterialPage((prev) => Math.max(prev - 1, 1))}
							className={materialPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
						/>
						{Array.from({ length: totalMaterialPages }, (_, index) => (
							<PaginationItem key={index + 1} className="hidden sm:block">
								<PaginationLink
									onClick={() => setMaterialPage(index + 1)}
									isActive={index + 1 === materialPage}
									className="cursor-pointer"
								>
									{index + 1}
								</PaginationLink>
							</PaginationItem>
						))}
						<PaginationNext
							onClick={() => setMaterialPage((prev) => Math.min(prev + 1, totalMaterialPages))}
							className={materialPage === totalMaterialPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
						/>
					</PaginationContent>
				</Pagination>
			)}
		</div>
	)
}

export default LearningMaterial;