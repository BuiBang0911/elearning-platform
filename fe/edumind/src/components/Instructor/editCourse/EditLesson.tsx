import { useState } from "react"
import type { LessonResponse } from "../../../interfaces/Lesson"
import { Button } from "../../ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { toast } from "sonner"
import lessonApi from "../../../api/Lesson.api"

type EditLessonProps = {
	editLessonOpen: boolean;
	setEditLessonOpen: (open: boolean) => void;
	selectedLesson: LessonResponse;
	courseId: number;
	onSave: (updatedLesson: LessonResponse) => void;
};

const EditLesson = ({ editLessonOpen, setEditLessonOpen, selectedLesson, courseId, onSave }: EditLessonProps) => {
	const [lessonForm, setLessonForm] = useState({
		title: selectedLesson.title,
		description: selectedLesson.description,
		content: selectedLesson.content,
		lessonOrder: 1,
		courseId: courseId
	});

	const handleSaveLessonEdit = async (e: React.FormEvent) => {
    e.preventDefault();
		try {
			await lessonApi.update(selectedLesson.id, lessonForm);
			toast.success(`Lesson "${lessonForm.title}" updated successfully!`);
			onSave({ ...selectedLesson, ...lessonForm });
			setEditLessonOpen(false);
		} catch (error) {
			console.error("Error updating lesson:", error);
			toast.error("Failed to update lesson. Please try again.");
			return;
		}
    
    toast.success(`Lesson "${lessonForm.title}" updated successfully!`);
    setEditLessonOpen(false);
  };

	return (
		<Dialog open={editLessonOpen} onOpenChange={setEditLessonOpen}>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Lesson</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSaveLessonEdit}>
					<div>
						<Label htmlFor="edit-lesson-title">Lesson Title</Label>
						<Input
							id="edit-lesson-title"
							value={lessonForm.title}
							onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
							required
						/>
					</div>
					<div>
						<Label htmlFor="edit-lesson-description">Description</Label>
						<Textarea
							id="edit-lesson-description"
							rows={3}
							value={lessonForm.description}
							onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor="edit-lesson-content">Lesson Content</Label>
						<Textarea
							id="edit-lesson-content"
							rows={6}
							value={lessonForm.content}
							onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
						/>
					</div>
					{/* <div className="grid sm:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="edit-lesson-video">Video URL (optional)</Label>
							<Input
								id="edit-lesson-video"
								placeholder="https://..."
								value={selectedLesson.videoUrl}
								onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
							/>
						</div>
						<div>
							<Label htmlFor="edit-lesson-duration">Duration</Label>
							<Input
								id="edit-lesson-duration"
								placeholder="e.g., 30 min"
								value={selectedLesson.duration}
								onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
								required
							/>
						</div>
					</div> */}
					<div>
						<Label htmlFor="edit-lesson-order">Lesson Order</Label>
						<Input
							id="edit-lesson-order"
							type="number"
							min="1"
							value={lessonForm.lessonOrder}
							onChange={(e) => setLessonForm({ ...lessonForm, lessonOrder: parseInt(e.target.value) || 1 })}
							required
						/>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setEditLessonOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default EditLesson