import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, PlusIcon, ShieldCheckIcon, Trash2Icon, UserIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isAddUserPopupOpen, setIsAddUserPopupOpen] = useState(false);
  const [isEditUserPopupOpen, setIsEditUserPopupOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "USER",
  });

  const [editUser, setEditUser] = useState({
    id: null,
    name: "",
    username: "",
    email: "",
    password: "",
    userType: "USER",
  });

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserId = loggedInUser?.id || "";
  const loggedInUserType = loggedInUser?.user_type_display;
  const canAdd = loggedInUserType === "SUPER ADMIN" || loggedInUserType === "Admin";
  const isSuperAdmin = loggedInUserType === "SUPER ADMIN";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/");
      setUsers(response.data);
    } catch (error) {
      console.error(
        "Error fetching users:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser({ ...editUser, [name]: value });
  };

  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!editUser.id) {
      toast.error("Invalid user ID.");
      return;
    }

    try {
      const response = await api.put(`/users/${editUser.id}/edit/`, {
        username: editUser.username,
        email: editUser.email,
        first_name: editUser.name.split(" ")[0] || "",
        last_name: editUser.name.split(" ")[1] || "",
        user_type: editUser.userType,
      });

      if (response.status === 200) {
        toast.success("User updated successfully!");

        const updatedUser = response.data;

        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === editUser.id ? { ...user, ...updatedUser } : user
          )
        );

        setIsEditUserPopupOpen(false);
      } else {
        toast.error("Failed to update user.");
      }
    } catch (error) {
      console.error(
        "Error updating user:",
        error.response?.data || error.message
      );
      toast.error("Failed to update user. Please try again.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();

    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        first_name: newUser.name.split(" ")[0] || "",
        last_name: newUser.name.split(" ")[1] || "",
        user_type: newUser.userType,
      };

      const response = await api.post("/register/", userData);

      if (response.status === 201) {
        toast.success("User created successfully!", {
          duration: 2000,
        });
        setIsAddUserPopupOpen(false);

        setUsers((prevUsers) => [...prevUsers, response.data.data]);

        setNewUser({
          name: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          userType: "USER",
        });
      } else {
        toast.error("Failed to add user.");
      }
    } catch (error) {
      console.error(
        "Error adding user:",
        error.response?.data || error.message
      );

      toast.error("Failed to add user. Please try again.", {
        duration: 1000,
      });
    }
  };

  const canModifyUser = (user) => {
    const isCurrentUser = user.id === loggedInUserId;
    const isAdmin = user.user_type === "ADMIN";
    const isLoggedInAdmin = loggedInUserType === "ADMIN";

    if (loggedInUserType === "USER" && !isCurrentUser) return false;
    if (isLoggedInAdmin && isAdmin && !isCurrentUser) return false;
    return true;
  };

  const handleDeleteUser = () => {
    if (!userToDelete) return;
    const userId = userToDelete.id;
    const userType = userToDelete.user_type;

    if (!userId) {
      toast.error("Error: Cannot delete user. User ID is missing.");
      setUserToDelete(null);
      return;
    }

    if (userId.toString() === loggedInUserId) {
      toast.error("You cannot delete your own account!");
      setUserToDelete(null);
      return;
    }

    if (loggedInUserType === "USER") {
      toast.error("You do not have permission to delete users.");
      setUserToDelete(null);
      return;
    }

    if (loggedInUserType === "ADMIN" && userType === "ADMIN") {
      toast.error("You cannot delete another admin.");
      setUserToDelete(null);
      return;
    }

    setIsDeleting(true);
    api
      .delete(`/users/${userId}/delete/`)
      .then(() => {
        setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
        toast.success("User deleted successfully!", { duration: 2000 });
      })
      .catch((error) => {
        console.error(
          "Error deleting user:",
          error.response?.data || error.message
        );
        toast.error("Failed to delete user. Please try again.", {
          duration: 1000,
        });
      })
      .finally(() => {
        setIsDeleting(false);
        setUserToDelete(null);
      });
  };

  const openEditPopup = (user) => {
    if (loggedInUserType === "USER" && user.id !== loggedInUserId) {
      toast.error("You can only edit your own account.");
      return;
    }

    if (
      loggedInUserType === "ADMIN" &&
      user.user_type === "ADMIN" &&
      user.id !== loggedInUserId
    ) {
      toast.error("You cannot edit another admin.");
      return;
    }

    setEditUser({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      username: user.username,
      email: user.email,
      userType: user.user_type,
    });

    setIsEditUserPopupOpen(true);
  };

  return (
    <>
      <PageHeader title="User Management" description="Manage system users and roles">
        {canAdd && (
          <Button onClick={() => setIsAddUserPopupOpen(true)}>
            <PlusIcon />
            Add User
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          {users.length > 0 ? (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Name</th>
                    <th className="py-2 pr-4 font-medium">Username</th>
                    <th className="py-2 pr-4 font-medium">Email</th>
                    <th className="py-2 pr-4 font-medium">Role</th>
                    {isSuperAdmin && (
                      <th className="py-2 text-right font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => {
                    const isCurrentUser = user.id === loggedInUserId;
                    const isAdmin = user.user_type === "ADMIN";
                    const editable = canModifyUser(user);

                    return (
                      <tr
                        key={user.id}
                        className="border-b last:border-0"
                      >
                        <td className="py-3 pr-4">
                          <span className="flex items-center gap-2 font-medium">
                            {user.first_name} {user.last_name}
                            {isCurrentUser && (
                              <Badge variant="secondary">You</Badge>
                            )}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {user.username}
                        </td>
                        <td className="py-3 pr-4 text-muted-foreground">
                          {user.email}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge
                            variant={isAdmin ? "destructive" : "secondary"}
                          >
                            {isAdmin ? (
                              <ShieldCheckIcon className="size-3.5" />
                            ) : (
                              <UserIcon className="size-3.5" />
                            )}
                            {user.user_type_display}
                          </Badge>
                        </td>
                        {isSuperAdmin && (
                          <td className="py-3">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success"
                                onClick={() => openEditPopup(user)}
                                disabled={!editable}
                                title={
                                  editable
                                    ? `Edit ${user.username}`
                                    : "Not allowed to edit this user"
                                }
                                aria-label={`Edit ${user.username}`}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setUserToDelete(user)}
                                disabled={!editable}
                                title={
                                  editable
                                    ? `Delete ${user.username}`
                                    : "Not allowed to delete this user"
                                }
                                aria-label={`Delete ${user.username}`}
                              >
                                <Trash2Icon className="size-4" />
                              </Button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No users found"
              description="There are no users registered in the system."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isAddUserPopupOpen} onOpenChange={setIsAddUserPopupOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>New User</DialogTitle>
            <DialogDescription>Enter the details for the new user</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="add-name">Full Name</Label>
              <Input
                id="add-name"
                type="text"
                placeholder="Enter Full Name"
                name="name"
                value={newUser.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-username">Username</Label>
              <Input
                id="add-username"
                type="text"
                placeholder="Enter Username"
                name="username"
                value={newUser.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-email">Email</Label>
              <Input
                id="add-email"
                type="email"
                placeholder="Enter Email"
                name="email"
                value={newUser.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-password">Password</Label>
              <Input
                id="add-password"
                type="password"
                placeholder="Enter Password"
                name="password"
                value={newUser.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-confirm-password">Confirm Password</Label>
              <Input
                id="add-confirm-password"
                type="password"
                placeholder="Confirm Password"
                name="confirmPassword"
                value={newUser.confirmPassword}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="add-user-type">Role</Label>
              <select
                id="add-user-type"
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                name="userType"
                value={newUser.userType}
                onChange={handleInputChange}
                required
              >
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddUserPopupOpen(false)}
              >
                Discard
              </Button>
              <Button type="submit">Add User</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditUserPopupOpen} onOpenChange={setIsEditUserPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update the user details below</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditUser} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                type="text"
                placeholder="Enter Full Name"
                name="name"
                value={editUser.name}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                type="text"
                placeholder="Enter Username"
                name="username"
                value={editUser.username}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="Enter Email"
                name="email"
                value={editUser.email}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-user-type">Role</Label>
              <select
                id="edit-user-type"
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                name="userType"
                value={editUser.userType}
                onChange={handleEditInputChange}
                required
              >
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditUserPopupOpen(false)}
              >
                Discard
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!userToDelete}
        onOpenChange={(open) => !open && setUserToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the user &quot;
              {userToDelete?.username}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteUser}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Yes, Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserManagementPage;