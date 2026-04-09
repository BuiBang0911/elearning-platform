import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import { Plus } from "lucide-react"
import { useState } from "react"
import lessonApi from "../../../api/Lesson.api"
import { toast } from "sonner"
import type { LessonResponse } from "../../../interfaces/Lesson"

type AddNewLessonProps = {
	addLessonOpen: boolean;
	setAddLessonOpen: (open: boolean) => void;
	courseId: number;
	onSave: (lesson: LessonResponse) => void;
};

const AddNewLesson = ({ addLessonOpen, setAddLessonOpen, courseId, onSave }: AddNewLessonProps) => {
	const [lessonForm, setLessonForm] = useState({
		title: "",
		description: "",
		content: "",
		lessonOrder: 1,
	});

	const handleAddLesson = async (e: React.FormEvent) => {
		e.preventDefault();
		const newLesson = {
			...lessonForm,
			courseId: courseId,
		};
		try {
			const response = await lessonApi.create(newLesson);
			onSave(response);
			toast.success(`Lesson "${lessonForm.title}" added successfully!`);
			setAddLessonOpen(false);
			setLessonForm({ title: "", description: "", content: "", lessonOrder: 0 });
		}
		catch (error) {
			console.error("Error adding lesson:", error);
			toast.error("Failed to add lesson. Please try again.");
			return;
		}
		// setCourseLessons([...courseLessons, newLesson]);
		
	};

	return (
		<Dialog
			open={addLessonOpen}
			onOpenChange={(open) => {
				setAddLessonOpen(open);
				if (open) {
					setLessonForm({
						title: "",
						description: "",
						content: "",
						lessonOrder: 0,
					});
				}
			}}
		>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="w-4 h-4" />
					Add Lesson
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Add New Lesson</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleAddLesson}>
					<div>
						<Label htmlFor="lesson-title">Lesson Title</Label>
						<Input
							id="lesson-title"
							placeholder="e.g., Introduction to Neural Networks"
							value={lessonForm.title}
							onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
							required
						/>
					</div>
					<div>
						<Label htmlFor="lesson-description">Description</Label>
						<Textarea
							id="lesson-description"
							placeholder="Brief overview of the lesson..."
							rows={3}
							value={lessonForm.description}
							onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor="lesson-content">Lesson Content</Label>
						<Textarea
							id="lesson-content"
							placeholder="Main lesson content and materials..."
							rows={6}
							value={lessonForm.content}
							onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
						/>
					</div>
					{/* <div className="grid sm:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="lesson-duration">Duration</Label>
							<Input
								id="lesson-duration"
								placeholder="e.g., 30 min"
								value={lessonForm.duration}
								onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
								required
							/>
						</div>
					</div> */}
					<div>
						<Label htmlFor="lesson-order">Lesson Order</Label>
						<Input
							id="lesson-order"
							type="number"
							min="1"
							value={lessonForm.lessonOrder}
							onChange={(e) => setLessonForm({ ...lessonForm, lessonOrder: parseInt(e.target.value) || 1 })}
							required
						/>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setAddLessonOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Add Lesson</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default AddNewLesson