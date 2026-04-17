import { FileText, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { Progress } from "../../ui/progress";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileStatus, type DocumentResponse } from "../../../interfaces/Document";
import documentApi from "../../../api/Document.api";
import type { LessonResponse } from "../../../interfaces/Lesson";
import lessonApi from "../../../api/Lesson.api";
import { parseError } from "../../../utils/errorUtils";

type UploadDocumentProps = {
	uploadDocumentOpen: boolean;
	setUploadDocumentOpen: (open: boolean) => void;
	courseId: number;
	onSave: (newDoc: DocumentResponse) => void;
	initialLessonId?: number;
}

const UploadDocument = ({ uploadDocumentOpen, setUploadDocumentOpen, courseId, onSave, initialLessonId }: UploadDocumentProps) => {
	const [isUploading, setIsUploading] = useState(false);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [fileName, setFileName] = useState("");
	const [uploadProgress, setUploadProgress] = useState(0);
	const [lessonId, setLessonId] = useState<number>(initialLessonId || 0);
	const [lessons, setLessons] = useState<LessonResponse[]>([]);

	useEffect(() => {
		if (initialLessonId) {
			setLessonId(initialLessonId);
		}
	}, [initialLessonId, uploadDocumentOpen]);

	useEffect(() => {
		const fetchLessons = async () => {
			try {
				const res = await lessonApi.getByCourseId(courseId);
				setLessons(res);
				if (res.length > 0) setLessonId(res[0].id);
			} catch (error) {
				console.error("Error fetching lessons:", error);
				toast.error("Failed to load lessons.");
			}
		};
		if (uploadDocumentOpen) {
			fetchLessons();
		}
	}, [uploadDocumentOpen, courseId]);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			if (file.type !== "application/pdf") {
				toast.error("Only PDF documents are accepted here.");
				return;
			}
			// 5MB limit
			if (file.size > 5 * 1024 * 1024) {
				toast.error("File size exceeds 5MB limit.");
				return;
			}
			setSelectedFile(file);
			if (!fileName) {
				const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
				setFileName(nameWithoutExt);
			}
		}
	};

	const handleUpload = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!selectedFile) {
			toast.error("Please select a PDF file first");
			return;
		}
		if (lessonId === 0) {
			toast.error("Please select a lesson to associate with.");
			return;
		}

		setIsUploading(true);
		setUploadProgress(0);
		try {
			const newDoc = await documentApi.create(
				{
					lessonId,
					fileName: fileName,
					status: FileStatus.Uploaded,
					file: selectedFile
				},
				(progressEvent) => {
					const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
					setUploadProgress(progress);
				}
			);

			toast.success("Document uploaded successfully!");
			onSave(newDoc);
			setUploadDocumentOpen(false);
			resetForm();
		} catch (error: any) {
			toast.error(parseError(error, "Failed to upload document."));
		} finally {
			setIsUploading(false);
			setUploadProgress(0);
		}
	};

	const resetForm = () => {
		setSelectedFile(null);
		setFileName("");
	};

	return (
		<Dialog open={uploadDocumentOpen} onOpenChange={setUploadDocumentOpen}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Upload Learning Material</DialogTitle>
				</DialogHeader>
				<form className="space-y-6 pt-4" onSubmit={handleUpload}>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="doc-file-name" className="text-sm font-semibold text-slate-700">Display Title (File Name)</Label>
							<Input
								id="doc-file-name"
								value={fileName}
								onChange={(e) => setFileName(e.target.value)}
								placeholder="Enter document title (e.g. Chapter 1: Introduction)"
								className="h-11 border-slate-200 focus:ring-blue-500"
								disabled={isUploading}
								required
							/>
						</div>

						<div>
							<Label htmlFor="select-lesson">Associate with Lesson</Label>
							<Select
								value={lessonId.toString()}
								onValueChange={(value) => setLessonId(Number(value))}
								disabled={isUploading}
							>
								<SelectTrigger id="select-lesson">
									<SelectValue placeholder="Select lesson" />
								</SelectTrigger>
								<SelectContent>
									{lessons.length === 0 ? (
										<SelectItem value="0" disabled>No lessons available</SelectItem>
									) : (
										lessons.map((lesson) => (
											<SelectItem key={lesson.id} value={lesson.id.toString()}>
												{lesson.title}
											</SelectItem>
										))
									)}
								</SelectContent>
							</Select>
						</div>

						<div className={`p-8 border-2 border-dashed rounded-2xl transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative ${selectedFile ? "border-blue-400 bg-blue-50/30" : "border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400"}`}>
							<Input
								type="file"
								className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
								onChange={handleFileChange}
								accept=".pdf"
								disabled={isUploading}
							/>
							<div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-transform ${selectedFile ? "bg-blue-600 text-white scale-110" : "bg-blue-100/50 text-blue-600 group-hover:scale-110"}`}>
								<FileText className="w-6 h-6" />
							</div>
							<div className="space-y-1">
								<p className="font-semibold text-slate-700">
									{selectedFile ? selectedFile.name : "Click to select PDF file"}
								</p>
								{selectedFile && !isUploading && (
									<p className="text-xs text-blue-600 font-medium">Click to change file</p>
								)}
								{!selectedFile && (
									<p className="text-xs text-slate-500">Only PDF files are supported for documents</p>
								)}
							</div>
						</div>

						{isUploading && (
							<div className="space-y-2 px-1">
								<div className="flex justify-between text-xs font-medium text-slate-600">
									<span>Uploading...</span>
									<span>{uploadProgress}%</span>
								</div>
								<Progress value={uploadProgress} className="h-2 bg-slate-100" />
							</div>
						)}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button type="button" variant="ghost" onClick={() => setUploadDocumentOpen(false)} disabled={isUploading}>
							Cancel
						</Button>
						<Button type="submit" disabled={!selectedFile || isUploading} className="min-w-[140px] bg-blue-600 hover:bg-blue-700 shadow-md">
							{isUploading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Uploading...
								</>
							) : (
								"Start Upload"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default UploadDocument;