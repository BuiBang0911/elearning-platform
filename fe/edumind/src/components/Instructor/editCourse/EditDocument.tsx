import { useEffect, useState } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { type DocumentResponse } from "../../../interfaces/Document";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import documentApi from "../../../api/Document.api";
import { parseError } from "../../../utils/errorUtils";

type EditDocumentProps = {
	editDocumentOpen: boolean;
	setEditDocumentOpen: (open: boolean) => void;
	document: DocumentResponse;
	onSave: (updatedDoc: DocumentResponse) => void; // You can replace 'any' with a more specific type if you have one for the document
}
const EditDocument = ({ editDocumentOpen, setEditDocumentOpen, document, onSave }: EditDocumentProps) => {
	const [isLoading, setIsLoading] = useState(false);
	const [documentForm, setDocumentForm] = useState({
		lessonId: document.lessonId,
		fileName: document.fileName,
		status: document.status,
		file: document.filePath as unknown as File // This is a bit of a hack since we don't have the actual File object, just the path. You might want to handle this differently.
	});

	// Sync form state when document changes or modal opens
	useEffect(() => {
		if (editDocumentOpen && document) {
			setDocumentForm({
				lessonId: document.lessonId,
				fileName: document.fileName,
				status: document.status,
				file: document.filePath as unknown as File
			});
		}
	}, [document, editDocumentOpen]);

	const handleSaveDocumentEdit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!documentForm.fileName.trim()) {
			toast.error("File name is required.");
			return;
		}

		setIsLoading(true);
		try {
			await documentApi.update(document.id, {
				lessonId: documentForm.lessonId,
				fileName: documentForm.fileName,
				status: documentForm.status,
				file: documentForm.file || undefined
			});
			onSave({
				...document,
				lessonId: documentForm.lessonId,
				fileName: documentForm.fileName,
				status: documentForm.status,
			});
			toast.success(`Document "${documentForm.fileName}" updated successfully!`);
			setEditDocumentOpen(false);
		} catch (error: any) {
			toast.error(parseError(error, "Failed to update document. Please try again."));
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={editDocumentOpen} onOpenChange={setEditDocumentOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Edit Document</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSaveDocumentEdit}>
					<div>
						<Label htmlFor="edit-doc-filename">File Name</Label>
						<Input
							id="edit-doc-filename"
							value={documentForm.fileName}
							onChange={(e) => setDocumentForm({ ...documentForm, fileName: e.target.value })}
							required
							disabled={isLoading}
						/>
					</div>
					{/* <div>
						<Label htmlFor="edit-doc-type">Document Type</Label>
						<Select
							value={documentForm.type}
							onValueChange={(value) => setDocumentForm({ ...documentForm, type: value })}
							required
						>
							<SelectTrigger id="edit-doc-type">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="pdf">PDF Document</SelectItem>
								<SelectItem value="video">Video</SelectItem>
								<SelectItem value="slide">Presentation Slides</SelectItem>
								<SelectItem value="text">Text Document</SelectItem>
							</SelectContent>
						</Select>
					</div> */}
					<div className="flex justify-end gap-2 pt-4">
						<Button type="button" variant="outline" onClick={() => setEditDocumentOpen(false)} disabled={isLoading}>
							Cancel
						</Button>
						<Button type="submit" disabled={isLoading} className="min-w-32 bg-blue-600 hover:bg-blue-700">
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

export default EditDocument;