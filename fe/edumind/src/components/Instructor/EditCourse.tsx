import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Button } from "../ui/button";
import { BookOpen, Download, Edit, Eye, FileText, GripVertical, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { Card } from "../ui/card";
import { CourseLevel, type CourseResponse } from "../../interfaces/Course";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import type { LessonResponse } from "../../interfaces/Lesson";
import lessonApi from "../../api/Lesson.api";
import { FileStatus, FileStatusConfig, type DocumentResponse } from "../../interfaces/Document";
import UploadDocument from "./editCourse/UploadDocument";
import AddNewLesson from "./editCourse/AddNewLesson";
import EditLesson from "./editCourse/EditLesson";
import { Badge } from "../ui/badge";
import EditDocument from "./editCourse/EditDocument";
import documentApi from "../../api/Document.api";
import CourseApi from "../../api/Course.api";
import CategoryApi from "../../api/Category.api";
import type { CategoryResponse } from "../../interfaces/Category";
import { formatDate } from "../../Format/FormatDate";
import { formatFileSize } from "../../Format/FormatFileSize";
import { parseError } from "../../utils/errorUtils";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "../ui/alert-dialog";

type EditCourseProps = {
	editCourseOpen: boolean;
	setEditCourseOpen: (open: boolean) => void;
	selectedCourse: CourseResponse;
	handleMaterialsChanged: (delta: number) => void;
	onSave: (updatedCourse: CourseResponse) => void;
	preFetchedLessons?: LessonResponse[];
	preFetchedDocuments?: DocumentResponse[];
	preFetchedCategories?: CategoryResponse[];
};

const EditCourse = ({
	editCourseOpen,
	setEditCourseOpen,
	selectedCourse,
	handleMaterialsChanged,
	onSave,
	preFetchedLessons,
	preFetchedDocuments,
	preFetchedCategories
}: EditCourseProps) => {
	const [courseLessons, setCourseLessons] = useState<LessonResponse[]>([]);
	const [addLessonOpen, setAddLessonOpen] = useState(false);
	const [editLessonOpen, setEditLessonOpen] = useState(false);
	const [selectedLesson, setSelectedLesson] = useState<LessonResponse | null>(null);

	const [courseDocuments, setCourseDocuments] = useState<DocumentResponse[]>([]);
	const [uploadDocumentOpen, setUploadDocumentOpen] = useState(false);
	const [editDocumentOpen, setEditDocumentOpen] = useState(false);
	const [selectedDocument, setSelectedDocument] = useState<DocumentResponse | null>(null);
	const [selectedLessonForUpload, setSelectedLessonForUpload] = useState<number | undefined>(undefined);

	const [categories, setCategories] = useState<CategoryResponse[]>([]);
	const [editForm, setEditForm] = useState({
		title: selectedCourse.title,
		description: selectedCourse.description,
		level: selectedCourse.level,
		categoryId: selectedCourse.categoryId,
		price: selectedCourse.price,
		thumbnail: null as File | null,
		lecturerId: selectedCourse.lecturerId
	});

	// Sync form state when selectedCourse or open status changes
	useEffect(() => {
		if (editCourseOpen && selectedCourse) {
			setEditForm({
				title: selectedCourse.title,
				description: selectedCourse.description,
				level: selectedCourse.level,
				categoryId: selectedCourse.categoryId,
				price: selectedCourse.price,
				thumbnail: null,
				lecturerId: selectedCourse.lecturerId
			});
		}
	}, [selectedCourse, editCourseOpen]);

	const [isLoading, setIsLoading] = useState(false);

	const [deleteDocId, setDeleteDocId] = useState<number | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const fetchCourseDetails = async () => {
			// If we have pre-fetched data, use it
			if (preFetchedLessons) setCourseLessons(preFetchedLessons);
			if (preFetchedDocuments) setCourseDocuments(preFetchedDocuments);
			if (preFetchedCategories) setCategories(preFetchedCategories);

			// If any data is missing, fetch it
			if (!preFetchedLessons || !preFetchedDocuments || !preFetchedCategories) {
				try {
					setIsLoading(true);
					const [lessons, documents, cats] = await Promise.all([
						!preFetchedLessons ? lessonApi.getByCourseId(selectedCourse.id) : Promise.resolve(preFetchedLessons),
						!preFetchedDocuments ? CourseApi.searchDocuments(selectedCourse.id) : Promise.resolve(preFetchedDocuments),
						!preFetchedCategories ? CategoryApi.getAll() : Promise.resolve(preFetchedCategories)
					]);

					setCategories(cats);
					setCourseDocuments(documents);
					setCourseLessons(lessons);
				} catch (error) {
					console.error("Error fetching course details:", error);
					toast.error(parseError(error, "Failed to load course details. Please try again."));
				} finally {
					setIsLoading(false);
				}
			}
		};

		if (editCourseOpen) {
			fetchCourseDetails();
		}
	}, [selectedCourse.id, editCourseOpen, preFetchedLessons, preFetchedDocuments, preFetchedCategories]);

	const handleUpdateLesson = (updatedLesson: LessonResponse) => {
		setCourseLessons(prev =>
			prev.map(lesson => lesson.id === updatedLesson.id ? updatedLesson : lesson)
		);
	};

	const handleUpdateDocument = (updatedDoc: DocumentResponse) => {
		setCourseDocuments(prev =>
			prev.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
		);
	}

	const handleAddDocument = (newDoc: DocumentResponse) => {
		setCourseDocuments(prev => [...prev, newDoc]);
		handleMaterialsChanged(1);
	}

	const handleDeleteDocument = async () => {
		if (!deleteDocId) return;
		try {
			setIsDeleting(true);
			await documentApi.remove(deleteDocId);
			setCourseDocuments(prev => prev.filter(d => d.id !== deleteDocId));
			handleMaterialsChanged(-1);
			toast.success("Document deleted successfully");
		} catch (error) {
			console.error("Error deleting document:", error);
			toast.error("Failed to delete document. Please try again.");
		} finally {
			setIsDeleting(false);
			setDeleteDocId(null);
		}
	};

	const handleDownload = (id: number) => {
		const url = `${import.meta.env.VITE_API_BASE_URL}/Document/download/${id}?download=true`;
		window.open(url, '_blank');
	};

	const handleViewDocument = (id: number) => {
		const url = `${import.meta.env.VITE_API_BASE_URL}/Document/download/${id}`;
		window.open(url, '_blank');
	};

	const handleAddLesson = (newLesson: LessonResponse) => {
		setCourseLessons(prev => [...prev, newLesson]);
	}

	const handleDeleteLesson = async (lessonId: number) => {
		try {
			await lessonApi.delete(lessonId);
		} catch (error) {
			console.error("Error deleting lesson:", error);
			toast.error("Failed to delete lesson. Please try again.");
			return;

		}
		setCourseLessons(courseLessons.filter(l => l.id !== lessonId));
		toast.success(`Lesson deleted successfully!`);
	};

	const [isSaving, setIsSaving] = useState(false);
	const handleSaveEdit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!editForm.title.trim() || editForm.title.trim().length < 10) {
			toast.error("Course title must be at least 10 characters.");
			return;
		}

		if (editForm.title.length > 255) {
			toast.error("Course title must not exceed 255 characters.");
			return;
		}

		if (!editForm.description.trim() || editForm.description.trim().length < 50) {
			toast.error("Description must be at least 50 characters.");
			return;
		}

		if (editForm.description.length > 5000) {
			toast.error("Description must not exceed 5000 characters.");
			return;
		}

		if (editForm.price > 0 && editForm.price < 2000) {
			toast.error("Price must be 0 (Free) or at least 2,000 VND.");
			return;
		}

		if (!editForm.categoryId) {
			toast.error("Please select a category for the course.");
			return;
		}

		setIsSaving(true);
		try {
			const updatedCourse = await CourseApi.update(selectedCourse.id, {
				title: editForm.title,
				description: editForm.description,
				level: editForm.level,
				categoryId: editForm.categoryId,
				price: editForm.price,
				thumbnail: editForm.thumbnail instanceof File ? editForm.thumbnail : null,
				lecturerId: selectedCourse.lecturerId
			});
			toast.success(`Course "${editForm.title}" updated successfully!`);
			onSave(updatedCourse);
			setEditCourseOpen(false);
		} catch (error: any) {
			toast.error(parseError(error, "Failed to update course. Please try again."));
		} finally {
			setIsSaving(false);
		}
	};

	return (
		<>
			<Dialog open={editCourseOpen} onOpenChange={setEditCourseOpen}>
				<DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
					<DialogHeader>
						<DialogTitle>Edit Course - {selectedCourse?.title}</DialogTitle>
					</DialogHeader>

					<Tabs defaultValue="basic" className="space-y-4">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="basic">Basic Information</TabsTrigger>
							<TabsTrigger value="lessons">Lessons</TabsTrigger>
							<TabsTrigger value="materials">Course Materials</TabsTrigger>
						</TabsList>

						<TabsContent value="basic" className="space-y-4">
							<form className="space-y-4" onSubmit={handleSaveEdit}>
								<div>
									<Label htmlFor="edit-title">Course Title</Label>
									<Input
										id="edit-title"
										value={editForm.title}
										onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
										disabled={isSaving}
										maxLength={255}
									/>
									<span className="text-[10px] text-slate-400 mt-1 block">
										{editForm.title.length}/255 characters (minimum 10 characters)
									</span>
								</div>
								<div>
									<Label htmlFor="edit-description">Description</Label>
									<Textarea
										id="edit-description"
										rows={4}
										value={editForm.description}
										onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
										disabled={isSaving}
										maxLength={5000}
									/>
									<span className="text-[10px] text-slate-400 mt-1 block">
										{editForm.description.length}/5000 characters (minimum 50 characters)
									</span>
								</div>
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<Label htmlFor="edit-level">Level</Label>
										<Select
											value={editForm.level.toString()}
											onValueChange={(value) => setEditForm({ ...editForm, level: Number(value) as CourseLevel })}
											disabled={isSaving}
										>
											<SelectTrigger id="edit-level">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="0">Beginner</SelectItem>
												<SelectItem value="1">Intermediate</SelectItem>
												<SelectItem value="2">Advanced</SelectItem>
											</SelectContent>
										</Select>
									</div>

									<div>
										<Label htmlFor="edit-category">Category</Label>
										<Select
											value={editForm.categoryId?.toString()}
											onValueChange={(value) => setEditForm({ ...editForm, categoryId: Number(value) })}
											disabled={isSaving}
										>
											<SelectTrigger id="edit-category">
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												{categories.map((cat) => (
													<SelectItem key={cat.id} value={cat.id.toString()}>
														{cat.name}
													</SelectItem>
												))}
												{categories.length === 0 && (
													<SelectItem value="none" disabled>No categories available</SelectItem>
												)}
											</SelectContent>
										</Select>
									</div>
								</div>
								<div>
									<Label htmlFor="edit-price">Course Price (VND)</Label>
									<Input
										id="edit-price"
										type="number"
										min="0"
										value={editForm.price}
										onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
										disabled={isSaving}
										required
									/>
								</div>
								{/* <div>
								<Label htmlFor="edit-duration">Duration</Label>
								<Input
									id="edit-duration"
									value={editForm.duration}
									onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
								/>
							</div> */}
								<div className="flex justify-end gap-2 pt-4">
									<Button type="button" variant="outline" onClick={() => setEditCourseOpen(false)} disabled={isSaving}>
										Cancel
									</Button>
									<Button type="submit" disabled={isSaving} className="min-w-32">
										{isSaving ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" />
												Saving...
											</>
										) : (
											"Save Changes"
										)}
									</Button>
								</div>
							</form>
						</TabsContent>

						<TabsContent value="lessons" className="space-y-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="font-semibold">Course Lessons</h3>
									<p className="text-sm text-gray-600">Manage lessons and content for this course</p>
								</div>
								<AddNewLesson addLessonOpen={addLessonOpen} setAddLessonOpen={setAddLessonOpen} courseId={selectedCourse.id} onSave={handleAddLesson} />
							</div>

							{courseLessons.length === 0 ? (
								<Card className="p-12 text-center">
									<BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
									<h3 className="font-medium text-gray-900 mb-2">No lessons yet</h3>
									<p className="text-sm text-gray-600 mb-4">
										Add lessons to structure your course content
									</p>
									<Button onClick={() => setAddLessonOpen(true)} className="gap-2">
										<Plus className="w-4 h-4" />
										Add First Lesson
									</Button>
								</Card>
							) : (
								<div className="space-y-3">
									{courseLessons
										.sort((a, b) => a.lessonOrder - b.lessonOrder)
										.map((lesson, index) => (
											<Card key={lesson.id} className="p-4 hover:shadow-md transition-shadow">
												<div className="flex items-start gap-4">
													<div className="flex items-center gap-2">
														<GripVertical className="w-5 h-5 text-gray-400 cursor-move" />
														<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
															<span className="font-bold text-blue-600">{index + 1}</span>
														</div>
													</div>
													<div className="flex-1 min-w-0">
														<div className="flex items-start justify-between gap-4">
															<div className="flex-1 min-w-0">
																<h4 className="font-medium break-all">{lesson.title}</h4>
															</div>
															<div className="flex items-center gap-2 flex-shrink-0">
																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => {
																		setSelectedLesson(lesson);
																		setEditLessonOpen(true);
																	}}
																	title="Edit lesson"
																>
																	<Edit className="w-4 h-4" />
																</Button>

																<Button
																	variant="ghost"
																	size="icon"
																	onClick={() => handleDeleteLesson(lesson.id)}
																	className="text-red-600 hover:text-red-700 hover:bg-red-50"
																	title="Delete lesson"
																>
																	<Trash2 className="w-4 h-4" />
																</Button>
															</div>
														</div>
														<p className="text-sm text-gray-600 whitespace-pre-wrap break-all">{lesson.description}</p>
													</div>
												</div>
											</Card>
										))}
								</div>
							)}
							{selectedLesson && (
								<EditLesson
									key={selectedLesson.id}
									editLessonOpen={editLessonOpen}
									setEditLessonOpen={setEditLessonOpen}
									selectedLesson={selectedLesson}
									courseId={selectedCourse.id}
									onSave={(updated) => {
										handleUpdateLesson(updated);
										setSelectedLesson(null);
									}}
								/>
							)}
						</TabsContent>

						<TabsContent value="materials" className="space-y-4">
							<div className="flex items-center justify-between mb-4">
								<div>
									<h3 className="font-semibold">Course Documents & Materials</h3>
									<p className="text-sm text-gray-600">Manage files for this course</p>
								</div>
								<Button size="sm" onClick={() => {
									setSelectedLessonForUpload(undefined);
									setUploadDocumentOpen(true);
								}} className="gap-2">
									<Plus className="w-4 h-4" />
									Add Document
								</Button>
								<UploadDocument
									uploadDocumentOpen={uploadDocumentOpen}
									setUploadDocumentOpen={setUploadDocumentOpen}
									courseId={selectedCourse.id}
									onSave={handleAddDocument}
									initialLessonId={selectedLessonForUpload}
								/>

							</div>

							{courseDocuments.length === 0 ? (
								<Card className="p-12 text-center">
									<FileText className="w-16 h-16 mx-auto text-gray-300 mb-4" />
									<h3 className="font-medium text-gray-900 mb-2">No documents yet</h3>
									<p className="text-sm text-gray-600 mb-4">
										Upload course materials to help students learn with AI assistance
									</p>
									<Button onClick={() => setUploadDocumentOpen(true)} className="gap-2">
										<Upload className="w-4 h-4" />
										Upload First Document
									</Button>
								</Card>
							) : (
								<div className="space-y-3">
									{courseDocuments.map((doc) => (
										<Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
											<div className="flex items-center justify-between">
												<div className="flex items-center gap-3 flex-1">
													{/* <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
													{doc.type === "video" ? (
														<Video className="w-6 h-6 text-gray-600" />
													) : (
														<FileText className="w-6 h-6 text-gray-600" />
													)}
												</div> */}
													<div className="flex-1 min-w-0">
														<h4 className="font-medium mb-1 truncate">{doc.fileName}</h4>
														<div className="flex items-center gap-3 text-sm text-gray-600">
															{/* <span className="capitalize">{doc.type}</span>
														<span>•</span> */}
															<span>{formatFileSize(doc.size)}</span>
															<span>•</span>
															<span>{formatDate(doc.uploadedAt)}</span>
															<span>•</span>
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
												</div>
												<div className="flex items-center gap-2 ml-4">
													<Button
														variant="ghost"
														size="icon"
														onClick={() => handleViewDocument(doc.id)}
														title="View document"
													>
														<Eye className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => {
															setSelectedDocument(doc);
															setEditDocumentOpen(true);
														}}
														title="Edit document"
													>
														<Edit className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														title="Download document"
														onClick={() => handleDownload(doc.id)}
													>
														<Download className="w-4 h-4" />
													</Button>
													<Button
														variant="ghost"
														size="icon"
														onClick={() => setDeleteDocId(doc.id)}
														className="text-red-600 hover:text-red-700 hover:bg-red-50"
														title="Delete document"
													>
														<Trash2 className="w-4 h-4" />
													</Button>
												</div>
											</div>
										</Card>
									))}
								</div>
							)}
							{selectedDocument && (
								<EditDocument
									key={selectedDocument.id}
									editDocumentOpen={editDocumentOpen}
									setEditDocumentOpen={setEditDocumentOpen}
									document={selectedDocument}
									onSave={(updated) => {
										handleUpdateDocument(updated);
										setSelectedDocument(null);
									}}
								/>
							)}
						</TabsContent>
					</Tabs>
				</DialogContent>
			</Dialog>

			<AlertDialog open={!!deleteDocId} onOpenChange={(open) => !open && setDeleteDocId(null)}>
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
								handleDeleteDocument();
							}}
							className="bg-red-600 hover:bg-red-700 font-medium"
							disabled={isDeleting}
						>
							{isDeleting ? (
								<span className="flex items-center">
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Deleting...
								</span>
							) : (
								"Delete Document"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	)
}

export default EditCourse;