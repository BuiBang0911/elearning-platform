import { Brain, Upload } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog";
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
	onSave: (newDoc: DocumentResponse) => void; // You can replace 'any' with a more specific type if you have one for the document
}
const UploadDocument = ({ uploadDocumentOpen, setUploadDocumentOpen, courseId, onSave }: UploadDocumentProps) => {
	const [documentForm, setDocumentForm] = useState({
		lessonId: 0,
		fileName: "",
		status: FileStatus.Idle,
		file: null as File | null,
	});

	const [lessons, setLessons] = useState<LessonResponse[]>([]);

	useEffect(() => {
		// Fetch lessons for the course to populate the select dropdown
		const fetchLessons = async () => {
			try {
				const res = await lessonApi.getByCourseId(courseId);
				setLessons(res);
			} catch (error) {
				console.error("Error fetching lessons:", error);
				toast.error("Failed to load lessons. Please try again.");
			}
		};
		if (uploadDocumentOpen) {
			fetchLessons();
		}
	}, [uploadDocumentOpen, courseId]);


	const handleUploadDocument = async (e: React.FormEvent) => {
		e.preventDefault();
		const newDoc = {
			fileName: documentForm.fileName,
			lessonId: documentForm.lessonId,
			status: FileStatus.Processing,
			file: documentForm.file as File
		};
		try {
			const res = await documentApi.create(newDoc);
			onSave(res);
		} catch (error) {
			console.error("Error uploading document:", error);
			toast.error("Failed to upload document. Please try again.");
			return;
		}
		toast.success(`"${documentForm.fileName}" uploaded successfully!`);
		setUploadDocumentOpen(false);
		setDocumentForm({ fileName: "", lessonId: 0, status: FileStatus.Idle, file: null });
	};

	return (
		<Dialog open={uploadDocumentOpen} onOpenChange={setUploadDocumentOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Upload className="w-4 h-4" />
					Upload File
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Upload Course Document</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleUploadDocument}>
					<div>
						<Label htmlFor="doc-filename">File Name</Label>
						<Input
							id="doc-filename"
							placeholder="e.g., Lecture 1 - Introduction"
							value={documentForm.fileName}
							onChange={(e) => setDocumentForm({ ...documentForm, fileName: e.target.value })}
							required
						/>
					</div>
					<div>
						<Label htmlFor="select-lesson">Lesson</Label>
						<Select
							value={documentForm.lessonId.toString()}
							onValueChange={(value) => setDocumentForm({ ...documentForm, lessonId: Number(value) })}
							required
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
					<div>
						<Label htmlFor="doc-file">File</Label>
						<div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
							<Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
							<p className="text-sm text-gray-600 mb-2">
								{documentForm.file ? documentForm.file.name : "Drag and drop or click to upload"}
							</p>
							<Input
								id="doc-file"
								type="file"
								onChange={(e) => setDocumentForm({ ...documentForm, file: e.target.files?.[0] || null })}
								required
							/>
						</div>
					</div>
					<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
						<div className="flex items-start gap-2">
							<Brain className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
							<div className="text-sm text-blue-900">
								<p className="font-medium mb-1">AI Processing</p>
								<p className="text-blue-700">
									File will be processed for AI-powered Q&A and student assistance.
								</p>
							</div>
						</div>
					</div>
					<div className="flex justify-end gap-2">
						<Button type="button" variant="outline" onClick={() => setUploadDocumentOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Upload</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>)
}

export default UploadDocument;