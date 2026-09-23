import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { PageHeader } from "@/components/layout/PageHeader";
import { EmptyState } from "@/components/common/EmptyState";
import api from "@/lib/api";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editCategory, setEditCategory] = useState({ id: null, name: "" });
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  const canManage =
    loggedInUserType === "SUPER ADMIN" || loggedInUserType === "Admin";
  const isSuperAdmin = loggedInUserType === "SUPER ADMIN";

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories/");
        setCategories(response.data);
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error.response?.data || error.message
        );
      }
    };

    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") {
      toast.warning("Category name cannot be empty.", { duration: 2000 });
      return;
    }

    try {
      const response = await api.post("/categories/", {
        name: newCategory.trim(),
      });

      setCategories([...categories, response.data]);
      setNewCategory("");

      toast.success("Category added successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error adding category:",
        error.response?.data || error.message
      );
      toast.error("Failed to add category.", { duration: 2000 });
    }
  };

  const handleEditCategory = async () => {
    if (editCategory.name.trim() === "") {
      toast.warning("Category name cannot be empty.", { duration: 2000 });
      return;
    }

    try {
      const response = await api.put(`/categories/${editCategory.id}/`, {
        name: editCategory.name.trim(),
      });

      setCategories(
        categories.map((cat) =>
          cat.id === editCategory.id ? response.data : cat
        )
      );

      setIsEditPopupOpen(false);

      toast.success("Category updated successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error editing category:",
        error.response?.data || error.message
      );
      toast.error("Failed to update category.", { duration: 2000 });
    }
  };

  const handleDeleteCategory = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/categories/${categoryToDelete.id}/`);
      setCategories(categories.filter((cat) => cat.id !== categoryToDelete.id));
      toast.success("Category deleted successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error deleting category:",
        error.response?.data || error.message
      );
      toast.error("Failed to delete category.", { duration: 2000 });
    } finally {
      setIsDeleting(false);
      setCategoryToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Categories"
        description="Manage product categories"
      />

      {canManage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Category</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="new-category">Category Name</Label>
              <Input
                id="new-category"
                type="text"
                placeholder="Enter Category Name"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
              />
            </div>
            <Button onClick={handleAddCategory}>
              <PlusIcon />
              Add Category
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium w-16">No.</th>
                  <th className="py-2 pr-4 font-medium">Category</th>
                  {isSuperAdmin && (
                    <th className="py-2 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {categories.map((category, index) => (
                  <tr key={category.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 pr-4 font-medium">{category.name}</td>
                    {isSuperAdmin && (
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-success"
                            onClick={() => {
                              setEditCategory(category);
                              setIsEditPopupOpen(true);
                            }}
                            aria-label={`Edit ${category.name}`}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setCategoryToDelete(category)}
                            aria-label={`Delete ${category.name}`}
                          >
                            <Trash2Icon className="size-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState
              title="No categories yet"
              description="Add your first category to start organizing products."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditPopupOpen} onOpenChange={setIsEditPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Update the category name below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="edit-category">Category Name</Label>
            <Input
              id="edit-category"
              type="text"
              value={editCategory.name}
              onChange={(e) =>
                setEditCategory({ ...editCategory, name: e.target.value })
              }
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPopupOpen(false)}>
              Discard
            </Button>
            <Button onClick={handleEditCategory}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the category &quot;
              {categoryToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteCategory}
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

export default Categories;