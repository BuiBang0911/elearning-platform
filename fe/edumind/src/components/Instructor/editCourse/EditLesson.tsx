import { useState } from "react"
import type { LessonResponse, LessonUpdateRequest } from "../../../interfaces/Lesson"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import lessonApi from "../../../api/Lesson.api"

type EditLessonProps = {
	editLessonOpen: boolean;
	setEditLessonOpen: (open: boolean) => void;
	selectedLesson: LessonResponse;
	courseId: number;
	onSave: (updatedLesson: LessonResponse) => void;
};

const EditLesson = ({ editLessonOpen, setEditLessonOpen, selectedLesson: lesson, courseId, onSave: onUpdate }: EditLessonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState<LessonUpdateRequest>({
		courseId: lesson.courseId,
		title: lesson.title,
		lessonOrder: lesson.lessonOrder,
		description: lesson.description || "",
		content: lesson.content || "",
		videoFile: undefined
	});

	const handleUpdateLesson = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		try {
			const updated = await lessonApi.update(lesson.id, formData);
			toast.success(`Lesson "${formData.title}" updated successfully!`);
			onUpdate(updated);
			setEditLessonOpen(false);
		} catch (error) {
			console.error("Error updating lesson:", error);
			toast.error("Failed to update lesson. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setFormData({ ...formData, videoFile: e.target.files[0] });
		}
	};

	return (
		<Dialog open={editLessonOpen} onOpenChange={setEditLessonOpen}>
			<DialogHeader className="hidden">
				<DialogTitle>Edit Lesson</DialogTitle>
			</DialogHeader>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Edit Lesson Information</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleUpdateLesson}>
					<div>
						<Label htmlFor="edit-lesson-title">Lesson Title</Label>
						<Input
							id="edit-lesson-title"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							disabled={isLoading}
							required
						/>
					</div>
					<div>
						<Label htmlFor="edit-lesson-desc">Description</Label>
						<Textarea
							id="edit-lesson-desc"
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							disabled={isLoading}
							rows={3}
						/>
					</div>
					<div>
						<Label htmlFor="edit-lesson-video" className="flex items-center gap-2">
							Change Lesson Video
							<span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
						</Label>
						{lesson.videoUrl && (
							<p className="text-[10px] text-blue-500 mb-1 line-clamp-1 italic">Current: {lesson.videoUrl}</p>
						)}
						<Input
							id="edit-lesson-video"
							type="file"
							accept="video/*"
							onChange={handleVideoChange}
							className="mt-1 cursor-pointer file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4"
							disabled={isLoading}
						/>
						{formData.videoFile && (
							<p className="text-xs text-blue-600 mt-2 font-medium">
								✓ New video selected: {formData.videoFile.name}
							</p>
						)}
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setEditLessonOpen(false)} disabled={isLoading}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading} className="min-w-36 bg-blue-600 hover:bg-blue-700">
							{isLoading ? (
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
			</DialogContent>
		</Dialog>
	)
}

export default EditLesson