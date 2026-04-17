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

  const handleProcess = async (id: number, status: number) => {
    const adminNote = status === 2 ? prompt("Enter rejection reason:") : "";
    if (status === 2 && adminNote === null) return;

    try {
      setProcessingId(id);
      await instructorRequestApi.process(id, status, adminNote || "");
      toast.success(status === 1 ? "Instructor approved!" : "Application rejected.");
      fetchRequests();
    } catch (err) {
      toast.error("Process failed");
    } finally {
      setProcessingId(null);
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
                  onClick={() => handleProcess(req.id, 1)}
                  loading={processingId === req.id}
                  className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </Button>
                <Button 
                  variant="outline"
                  loading={processingId === req.id}
                  onClick={() => handleProcess(req.id, 2)}
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
    </div>
  );
};

export default AdminInstructorRequests;
