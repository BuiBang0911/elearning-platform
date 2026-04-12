import { FileText, Loader2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Label } from "../../ui/label";
import { Input } from "../../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../ui/select";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileStatus, type DocumentResponse } from "../../../interfaces/Document";
import documentApi from "../../../api/Document.api";
import type { LessonResponse } from "../../../interfaces/Lesson";
import lessonApi from "../../../api/Lesson.api";

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
			setSelectedFile(file);
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
		try {
			const newDoc = await documentApi.create({
				lessonId,
				fileName: fileName,
				status: FileStatus.Uploaded,
				file: selectedFile
			});

			toast.success("Document uploaded successfully!");
			onSave(newDoc);
			setUploadDocumentOpen(false);
			resetForm();
		} catch (error) {
			console.error("Upload error:", error);
			toast.error("Failed to upload document.");
		} finally {
			setIsUploading(false);
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

						<div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all group flex flex-col items-center justify-center text-center cursor-pointer relative">
							<Input
								type="file"
								className="absolute inset-0 opacity-0 cursor-pointer z-10 h-full w-full"
								onChange={handleFileChange}
								accept=".pdf"
								disabled={isUploading}
							/>
							<div className="w-12 h-12 bg-blue-100/50 text-blue-600 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
								<FileText className="w-6 h-6" />
							</div>
							<div className="space-y-1">
								<p className="font-semibold text-slate-700">
									{selectedFile ? selectedFile.name : "Click to select PDF file"}
								</p>
								<p className="text-xs text-slate-500">Only PDF files are supported for documents</p>
							</div>
						</div>
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