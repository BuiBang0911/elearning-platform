import { useEffect, useState } from "react";
import {
  Search,
  Mail,
  Calendar,
  Filter,
  UserCheck,
  UserX,
  Users
} from "lucide-react";
import AdminApi, { type AdminUser } from "../../api/admin.api";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import FullPageLoader from "../../components/PostLoading/FullPageLoader";
import { format } from "date-fns";
import { toast } from "sonner";

const AdminUserManagement = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");

  const fetchUsers = async () => {
    try {
      const data = await AdminApi.getUsers();
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleToggleStatus = async (userId: number) => {
    try {
      await AdminApi.toggleUserStatus(userId);
      toast.success("User status updated successfully");
      fetchUsers();
    } catch (err) {
      toast.error("Failed to update user status");
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  if (loading) return <FullPageLoader />;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
          <p className="text-slate-500">View and manage all platform users.</p>
        </div>
      </div>

      <Card className="p-4 border-none shadow-sm flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search by name or email..."
            className="pl-10 bg-slate-50 border-none focus-visible:ring-1"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select
            className="bg-slate-50 border-none text-sm font-medium px-4 py-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="All">All Roles</option>
            <option value="Student">Students</option>
            <option value="Instructor">Instructors</option>
            <option value="Admin">Admins</option>
          </select>
          <Button variant="outline" className="gap-2 border-slate-200">
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>
      </Card>

      <Card className="overflow-hidden border-none shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                        {user.fullName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">{user.fullName}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className={
                      user.role === 'Admin' ? 'border-red-200 text-red-600 bg-red-50' :
                        user.role === 'Instructor' ? 'border-purple-200 text-purple-600 bg-purple-50' :
                          'border-blue-200 text-blue-600 bg-blue-50'
                    }>
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {format(new Date(user.createdAt), "MMM dd, yyyy")}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${user.isDelete ? 'bg-red-400' : 'bg-green-400'}`} />
                      <span className="text-sm font-medium text-slate-700">
                        {user.isDelete ? 'Deactivated' : 'Active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(user.id)}
                      className={`gap-2 ${user.isDelete ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
                    >
                      {user.isDelete ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                      {user.isDelete ? 'Activate' : 'Deactivate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-20 text-center">
              <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-slate-800 font-bold">No users found</h3>
              <p className="text-slate-500">Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AdminUserManagement;
