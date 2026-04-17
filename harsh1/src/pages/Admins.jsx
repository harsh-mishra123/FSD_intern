import Sidebar from "../components/Sidebar";
import { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "sonner";
import { Edit2, Trash2, Plus, ShieldCheck } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from "../context/AuthContext";

export default function Admins() {
  const [admins, setAdmins] = useState([]);
  const { user: currentUser } = useAuth();
  
  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  
  // Delete Dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });

  const fetchAdmins = async () => {
    try {
      const { data } = await axios.get("http://localhost:5005/api/users", {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setAdmins(data.filter(u => u.role === "admin"));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (currentUser?.token) {
      fetchAdmins();
    }
  }, [currentUser]);

  const confirmDelete = (admin) => {
    setAdminToDelete(admin);
    setIsDeleteDialogOpen(true);
  };

  const executeDelete = async () => {
    if (!adminToDelete) return;
    try {
      await axios.delete(`http://localhost:5005/api/users/${adminToDelete._id}`, {
        headers: { Authorization: `Bearer ${currentUser.token}` }
      });
      setAdmins(admins.filter(a => a._id !== adminToDelete._id));
      toast.success("Admin deleted successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to delete admin");
    } finally {
      setIsDeleteDialogOpen(false);
      setAdminToDelete(null);
    }
  };

  const openAddDialog = () => {
    setEditingAdmin(null);
    setFormData({ name: "", email: "", password: "" });
    setIsDialogOpen(true);
  };

  const openEditDialog = (admin) => {
    setEditingAdmin(admin);
    setFormData({ name: admin.name, email: admin.email, password: "" });
    setIsDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    try {
      if (editingAdmin) {
        const { data } = await axios.put(`http://localhost:5005/api/users/${editingAdmin._id}`, formData, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        setAdmins(admins.map(a => a._id === editingAdmin._id ? { ...a, ...data } : a));
      } else {
        const { data } = await axios.post("http://localhost:5005/api/users", {
          ...formData,
          role: "admin",
        }, {
          headers: { Authorization: `Bearer ${currentUser.token}` }
        });
        setAdmins([...admins, data]);
      }
      setIsDialogOpen(false);
      toast.success(editingAdmin ? "Admin updated successfully!" : "Admin added successfully!");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "An error occurred");
    }
  };

  return (
    <Sidebar>
      <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-card p-6 rounded-xl shadow-sm border">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-primary" /> Admins
            </h1>
            <p className="text-muted-foreground mt-1">Manage system administrators and their access.</p>
          </div>
          <Button size="default" className="shadow-sm" onClick={openAddDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Admin
          </Button>
        </div>

        <div className="bg-card rounded-xl shadow-sm border overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[300px]">Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => (
                <TableRow key={admin._id} className="group">
                  <TableCell className="font-medium">
                    {admin.name} {admin._id === currentUser?.id && <span className="text-muted-foreground ml-1 font-normal text-xs">(You)</span>}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{admin.email}</TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20 font-medium">
                      Admin
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => openEditDialog(admin)}
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10" 
                      onClick={() => confirmDelete(admin)} 
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {admins.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                    No administrators found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Admin Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle>{editingAdmin ? "Edit Admin" : "Add New Admin"}</DialogTitle>
              <DialogDescription>
                {editingAdmin ? "Make changes to the admin profile here. Click save when you're done." : "Enter the details for the new admin. They will be granted administrator access."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="password" className="text-right">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="col-span-3"
                  placeholder={editingAdmin ? "Leave blank to keep same" : "Required"}
                  required={!editingAdmin}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete admin "{adminToDelete?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={executeDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
