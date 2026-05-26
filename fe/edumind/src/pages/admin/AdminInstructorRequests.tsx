import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  User,
  Briefcase,
  AlertCircle
} from "lucide-react";
import instructorRequestApi from "../../api/instructorRequest.api";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Textarea } from "../../components/ui/textarea";

interface Request {
  id: number;
  userId: number;
  userEmail: string;
  userFullName: string;
  specialty: string;
  experience: string;
  portfolioUrl: string;
  status: string;
  createdAt: string;
}

const AdminInstructorRequests = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Custom dialog states
  const [dialogOpen, setDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [targetRequestId, setTargetRequestId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const fetchRequests = async () => {
    try {
      const data = await instructorRequestApi.getPending();
      setRequests(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch pending requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const initiateProcess = (id: number, status: number) => {
    setTargetRequestId(id);
    setActionType(status === 1 ? "approve" : "reject");
    setRejectionReason("");
    setDialogOpen(true);
  };

  const handleProcess = async () => {
    if (!targetRequestId || !actionType) return;
    const note = actionType === "reject" ? rejectionReason : "";

    try {
      setProcessingId(targetRequestId);
      setDialogOpen(false);
      await instructorRequestApi.process(targetRequestId, actionType === "approve" ? 1 : 2, note);
      toast.success(actionType === "approve" ? "Instructor approved!" : "Application rejected.");
      fetchRequests();
    } catch (err) {
      toast.error("Process failed");
    } finally {
      setProcessingId(null);
      setTargetRequestId(null);
      setActionType(null);
      setRejectionReason("");
    }
  };

  if (loading) return <FullPageLoader isFullPage={false} />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Instructor Applications</h1>
        <p className="text-slate-500">Review and approve new instructors for the platform.</p>
      </div>

      <div className="grid gap-6">
        {requests.map((req) => (
          <Card key={req.id} className="p-6 border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xl">
                      {req.userFullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800">{req.userFullName}</h3>
                      <p className="text-sm text-slate-500">{req.userEmail}</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-50 text-orange-600 border-orange-100 hover:bg-orange-100">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Briefcase className="w-3 h-3" />
                      Specialty
                    </p>
                    <p className="text-sm font-medium text-slate-700">{req.specialty}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Portfolio
                    </p>
                    <a
                      href={req.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View Portfolio <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div className="space-y-1 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase">Experience Background</p>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                    "{req.experience}"
                  </p>
                </div>

                <div className="text-xs text-slate-400 flex items-center gap-1 italic">
                  Submitted on {format(new Date(req.createdAt), "PPP")}
                </div>
              </div>

              <div className="flex flex-col justify-center gap-3 min-w-[180px]">
                <Button
                  onClick={() => initiateProcess(req.id, 1)}
                  loading={processingId === req.id}
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button
                  variant="outline"
                  loading={processingId === req.id}
                  onClick={() => initiateProcess(req.id, 2)}
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 gap-2 font-bold"
                >
                  <XCircle className="w-4 h-4" />
                  Reject
                </Button>
              </div>
            </div>
          </Card>
        ))}

        {requests.length === 0 && (
          <div className="py-20 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Clear! No Pending Requests</h3>
            <p className="text-slate-500 max-w-sm mx-auto mt-2">
              All instructor applications have been processed. New ones will appear here.
            </p>
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Application" : "Reject Application"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "Are you sure you want to approve this candidate to become an instructor? They will gain teaching permissions on the platform."
                : "Please provide a reason for rejecting this candidate's application. This feedback will be visible to the student."}
            </DialogDescription>
          </DialogHeader>

          {actionType === "reject" && (
            <div className="py-2">
              <Textarea
                placeholder="Enter rejection reason (e.g. Portfolio link is invalid, not enough experience)..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full min-h-[100px]"
              />
            </div>
          )}

          <DialogFooter className="flex gap-2 sm:justify-end">
            <button
              onClick={() => setDialogOpen(false)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleProcess}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors ${
                actionType === "approve"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }`}
            >
              Confirm
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminInstructorRequests;
