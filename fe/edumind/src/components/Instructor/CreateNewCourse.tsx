import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Button } from "../ui/button";
import { Plus, Loader2 } from "lucide-react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { toast } from "sonner";
import CourseApi from "../../api/Course.api";
import CategoryApi from "../../api/Category.api";
import { CourseLevel, type CourseResponse } from "../../interfaces/Course";
import type { CategoryResponse } from "../../interfaces/Category";
import { useEffect } from "react";
import { parseError } from "../../utils/errorUtils";

type CreateNewCourseProps = {
	createCourseOpen: boolean;
	setCreateCourseOpen: (open: boolean) => void;
	handleCoursesChanged: (delta: number) => void;
	onSave: (newCourse: CourseResponse) => void; // You can replace 'any' with a more specific type if you have one for the course
};

const CreateNewCourse = ({ createCourseOpen, setCreateCourseOpen, handleCoursesChanged, onSave }: CreateNewCourseProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [categories, setCategories] = useState<CategoryResponse[]>([]);
	const [courseForm, setCourseForm] = useState({
		title: "",
		description: "",
		level: CourseLevel.BEGINNER as CourseLevel,
		categoryId: undefined as number | undefined,
		price: 0,
		thumbnail: null as File | null
	});

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const cats = await CategoryApi.getAll();
				setCategories(cats);
			} catch (error) {
				console.error("Error fetching categories:", error);
			}
		};
		fetchCategories();
	}, []);

	const handleCreateCourse = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!courseForm.title.trim() || courseForm.title.trim().length < 10) {
			toast.error("Course title must be at least 10 characters.");
			return;
		}

		if (courseForm.title.length > 255) {
			toast.error("Course title must not exceed 255 characters.");
			return;
		}

		if (!courseForm.description.trim() || courseForm.description.trim().length < 50) {
			toast.error("Course description must be at least 50 characters.");
			return;
		}

		if (courseForm.description.length > 5000) {
			toast.error("Course description must not exceed 5000 characters.");
			return;
		}

		if (courseForm.price > 0 && courseForm.price < 2000) {
			toast.error("Price must be 0 (Free) or at least 2,000 VND.");
			return;
		}

		if (!courseForm.categoryId) {
			toast.error("Please select a category for the course.");
			return;
		}

		setIsLoading(true);
		try {
			const newCourse = await CourseApi.create(courseForm);
			toast.success(`Course "${courseForm.title}" created successfully!`);
			setCreateCourseOpen(false);
			onSave(newCourse);
			handleCoursesChanged(1);
			setCourseForm({ title: "", description: "", level: CourseLevel.BEGINNER, categoryId: undefined, price: 0, thumbnail: null });
		} catch (error: any) {
			toast.error(parseError(error, "Failed to create course. Please try again."));
		} finally {
			setIsLoading(false);
		}
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (e.target.files && e.target.files[0]) {
			const file = e.target.files[0];
			// 2MB limit
			if (file.size > 2 * 1024 * 1024) {
				toast.error("Thumbnail size exceeds 2MB limit.");
				return;
			}
			setCourseForm({ ...courseForm, thumbnail: file });
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
			<DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
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
							disabled={isLoading}
							required
							maxLength={255}
						/>
						<span className="text-[10px] text-slate-400 mt-1 block">
							{courseForm.title.length}/255 characters (minimum 10 characters)
						</span>
					</div>
					<div>
						<Label htmlFor="course-description">Description</Label>
						<Textarea
							id="course-description"
							placeholder="Describe what students will learn..."
							rows={4}
							value={courseForm.description}
							onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
							disabled={isLoading}
							required
							maxLength={5000}
						/>
						<span className="text-[10px] text-slate-400 mt-1 block">
							{courseForm.description.length}/5000 characters (minimum 50 characters)
						</span>
					</div>
					<div className="grid sm:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="level" className="mb-2 block">Difficulty Level</Label>
							<Select
								value={courseForm.level?.toString()}
								onValueChange={(value) => setCourseForm({ ...courseForm, level: Number(value) as CourseLevel })}
								disabled={isLoading}
							>
								<SelectTrigger id="level">
									<SelectValue placeholder="Select level" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="0">Beginner</SelectItem>
									<SelectItem value="1">Intermediate</SelectItem>
									<SelectItem value="2">Advanced</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div>
							<Label htmlFor="category" className="mb-2 block">Category</Label>
							<Select
								value={courseForm.categoryId?.toString()}
								onValueChange={(value) => setCourseForm({ ...courseForm, categoryId: Number(value) })}
								disabled={isLoading}
							>
								<SelectTrigger id="category">
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
						<Label htmlFor="course-price">Course Price (VND)</Label>
						<Input
							id="course-price"
							type="number"
							min="0"
							placeholder="e.g., 500000"
							value={courseForm.price}
							onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
							disabled={isLoading}
							required
						/>
					</div>
					<div>
						<Label htmlFor="thumbnail" className="mb-2 block">Course Thumbnail</Label>
						<div className="mt-2">
							<Input
								id="thumbnail"
								type="file"
								accept="image/*"
								onChange={handleFileChange}
								className="cursor-pointer file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4"
								disabled={isLoading}
							/>
							{courseForm.thumbnail && (
								<p className="text-xs text-blue-600 mt-2 font-medium">
									✓ {courseForm.thumbnail.name} selected
								</p>
							)}
						</div>
					</div>
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setCreateCourseOpen(false)} disabled={isLoading}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading} className="min-w-36 bg-blue-600 hover:bg-blue-700">
							{isLoading ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Creating...
								</>
							) : (
								"Create Course"
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default CreateNewCourse;