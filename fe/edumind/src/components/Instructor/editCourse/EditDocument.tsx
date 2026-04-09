import { useState } from "react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { type DocumentResponse } from "../../../interfaces/Document";
import { toast } from "sonner";
import documentApi from "../../../api/Document.api";

type EditDocumentProps = {
	editDocumentOpen: boolean;
	setEditDocumentOpen: (open: boolean) => void;
	document: DocumentResponse;
	onSave: (updatedDoc: DocumentResponse) => void; // You can replace 'any' with a more specific type if you have one for the document
}
const EditDocument = ({ editDocumentOpen, setEditDocumentOpen, document, onSave }: EditDocumentProps) => {
	const [documentForm, setDocumentForm] = useState({
		lessonId: document.lessonId,
		fileName: document.fileName,
		status: document.status,
		file: document.filePath as unknown as File // This is a bit of a hack since we don't have the actual File object, just the path. You might want to handle this differently.
	});

	const handleSaveDocumentEdit = async (e: React.FormEvent) => {
		e.preventDefault();
		try {
			await documentApi.update(document.id, {
				lessonId: documentForm.lessonId,
				fileName: documentForm.fileName,
				status: documentForm.status,
				file: documentForm.file
			});
			onSave({
				...document,
				lessonId: documentForm.lessonId,
				fileName: documentForm.fileName,
				status: documentForm.status,
				filePath: documentForm.file ? URL.createObjectURL(documentForm.file) : document.filePath // Update file path if a new file is selected
			});
			toast.success(`Document "${documentForm.fileName}" updated successfully!`);
			setEditDocumentOpen(false);
		} catch (error) {
			console.error("Error updating document:", error);
			toast.error("Failed to update document. Please try again.");
		}
		toast.success(`Document "${documentForm.fileName}" updated successfully!`);
		setEditDocumentOpen(false);
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
						<Button type="button" variant="outline" onClick={() => setEditDocumentOpen(false)}>
							Cancel
						</Button>
						<Button type="submit">Save Changes</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	)
}

export default EditDocument;