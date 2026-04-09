import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import CourseApi from "../../api/Course.api";
import { CourseLevel, type CourseResponse } from "../../interfaces/Course";

type CreateNewCourseProps = {
  createCourseOpen: boolean;
  setCreateCourseOpen: (open: boolean) => void;
  handleCoursesChanged: (delta: number) => void;
  onSave: (newCourse: CourseResponse) => void; // You can replace 'any' with a more specific type if you have one for the course
};

const CreateNewCourse = ({ createCourseOpen, setCreateCourseOpen, handleCoursesChanged, onSave }: CreateNewCourseProps) => {

	const [courseForm, setCourseForm] = useState({
		title: "",
		description: "",
		level: CourseLevel.BEGINNER as CourseLevel,
		thumbnail: null as File | null
	});

	const handleCreateCourse = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			const newCourse = await CourseApi.create(courseForm);
			toast.success(`Course "${courseForm.title}" created successfully!`);
			setCreateCourseOpen(false);
			onSave(newCourse);
			handleCoursesChanged(1);
			setCourseForm({ title: "", description: "", level: CourseLevel.BEGINNER, thumbnail: null});
		} catch (error) {
			console.error("Error creating course:", error);
			toast.error("Failed to create course. Please try again.");
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			setCourseForm({ ...courseForm, thumbnail: e.target.files[0] });
		}
	};

	return (
		<Dialog open={createCourseOpen} onOpenChange={setCreateCourseOpen}>
			<DialogTrigger asChild>
				<Button className="gap-2">
					<Plus className="w-4 h-4" />
					Create New Course
				</Button>
			</DialogTrigger>
			<DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Create New Course</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleCreateCourse}>
					<div>
						<Label htmlFor="course-title">Course Title</Label>
						<Input
							id="course-title"
							placeholder="e.g., Introduction to Machine Learning"
							value={courseForm.title}
							onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
						/>
					</div>
					<div>
						<Label htmlFor="course-description">Description</Label>
						<Textarea
							id="course-description"
							placeholder="Describe what students will learn..."
							rows={4}
							value={courseForm.description}
							onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
						/>
					</div>
					<div className="grid sm:grid-cols-2 gap-4">
						{/* <div>
							<Label htmlFor="category">Category</Label>
							<Select
								value={courseForm.category}
								onValueChange={(value) => setCourseForm({ ...courseForm, category: value })}
							>
								<SelectTrigger id="category">
									<SelectValue placeholder="Select category" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="ai">AI & Machine Learning</SelectItem>
									<SelectItem value="web">Web Development</SelectItem>
									<SelectItem value="data">Data Science</SelectItem>
									<SelectItem value="design">Design</SelectItem>
								</SelectContent>
							</Select>
						</div> */}
						<div>
							<Label htmlFor="level">Level</Label>
							<Select
								value={courseForm.level?.toString()}
								onValueChange={(value) => setCourseForm({ ...courseForm, level: Number(value) as CourseLevel })}
							>
								<SelectTrigger id="level">
									<SelectValue placeholder="Select level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="1">Beginner</SelectItem>
									<SelectItem value="2">Intermediate</SelectItem>
									<SelectItem value="3">Advanced</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>
					{/* <div>
						<Label htmlFor="duration">Duration</Label>
						<Input
							id="duration"
							placeholder="e.g., 8 weeks"
							value={courseForm.duration}
							onChange={(e) => setCourseForm({ ...courseForm, duration: e.target.value })}
						/>
					</div> */}
					<div>
						<Label htmlFor="thumbnail">Course Thumbnail</Label>
						<div className="mt-2">
							<Input
								id="thumbnail"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="cursor-pointer"
							/>
							{courseForm.thumbnail && (
								<p className="text-sm text-gray-600 mt-2">
									Selected: {courseForm.thumbnail.name}
								</p>
							)}
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" className="cursor-pointer" variant="outline" onClick={() => setCreateCourseOpen(false)}>
							Cancel
						</Button>
						<Button type="submit" className="cursor-pointer">Create Course</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default CreateNewCourse;