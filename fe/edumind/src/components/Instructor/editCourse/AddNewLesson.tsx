import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../../ui/dialog"
import { Input } from "../../ui/input"
import { Label } from "../../ui/label"
import { Textarea } from "../../ui/textarea"
import { Button } from "../../ui/button"
import { Plus, Loader2 } from "lucide-react"
import { useState } from "react"
import lessonApi from "../../../api/Lesson.api"
import { toast } from "sonner"
import type { LessonRequest, LessonResponse } from "../../../interfaces/Lesson"
import { parseError } from "../../../utils/errorUtils";

type AddNewLessonProps = {
	addLessonOpen: boolean;
	setAddLessonOpen: (open: boolean) => void;
	courseId: number;
	onSave: (lesson: LessonResponse) => void;
};

const AddNewLesson = ({ addLessonOpen, setAddLessonOpen, courseId, onSave }: AddNewLessonProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState<LessonRequest>({
		courseId: courseId,
		title: "",
		lessonOrder: 1,
		description: "",
		content: "",
		videoFile: undefined
	});

	const handleAddLesson = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.title.trim() || formData.title.length < 5) {
			toast.error("Lesson title must be at least 5 characters.");
			return;
		}

		setIsLoading(true);
		try {
			const newLesson = await lessonApi.create(formData);
			toast.success(`Lesson "${formData.title}" created successfully!`);
			onSave(newLesson);
			setAddLessonOpen(false);
			setFormData({ ...formData, title: "", description: "", content: "", videoFile: undefined });
		} catch (error: any) {
			toast.error(parseError(error, "Failed to create lesson. Please try again."));
		} finally {
			setIsLoading(false);
		}
	};

	const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			// 100MB limit
			if (file.size > 100 * 1024 * 1024) {
				toast.error("Video file size exceeds 100MB limit.");
				return;
			}
			// Extension check
			const allowed = [".mp4", ".mov", ".avi", ".mkv"];
			const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
			if (!allowed.includes(ext)) {
				toast.error("Invalid video format. Use .mp4, .mov, .avi, or .mkv");
				return;
			}
			setFormData({ ...formData, videoFile: file });
		}
	};

	return (
		<Dialog open={addLessonOpen} onOpenChange={setAddLessonOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="w-4 h-4" />
					Add Lesson
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-xl">
				<DialogHeader>
					<DialogTitle>Add New Lesson</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleAddLesson}>
					<div>
						<Label htmlFor="lesson-title">Lesson Title</Label>
						<Input
							id="lesson-title"
							placeholder="e.g., Understanding React Hooks"
							value={formData.title}
							onChange={(e) => setFormData({ ...formData, title: e.target.value })}
							disabled={isLoading}
							required
						/>
					</div>
					<div>
						<Label htmlFor="lesson-desc">Description</Label>
						<Textarea
							id="lesson-desc"
							placeholder="What will students learn in this lesson..."
							value={formData.description}
							onChange={(e) => setFormData({ ...formData, description: e.target.value })}
							disabled={isLoading}
							rows={3}
						/>
					</div>
					<div>
						<Label htmlFor="lesson-video">Lesson Video (Max 100MB)</Label>
						<Input
							id="lesson-video"
							type="file"
							accept="video/*"
							onChange={handleVideoChange}
							className="mt-2"
							disabled={isLoading}
						/>
						{formData.videoFile && (
							<p className="text-xs text-blue-600 mt-2 font-medium">
								✓ {formData.videoFile.name} selected
							</p>
						)}
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setAddLessonOpen(false)} disabled={isLoading}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading} className="min-w-32">
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Adding...
								</>
							) : (
								"Add Lesson"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default AddNewLesson