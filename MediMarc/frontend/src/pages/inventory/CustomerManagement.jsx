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

const CustomerManagement = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: "", address: "" });
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editCustomer, setEditCustomer] = useState({
    id: null,
    name: "",
    address: "",
  });
  const [customerToDelete, setCustomerToDelete] = useState(null);
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
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers/");
        const sortedCustomers = response.data.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        setCustomers(sortedCustomers);
      } catch (error) {
        console.error(
          "Error fetching customers:",
          error.response?.data || error.message
        );
      }
    };

    fetchCustomers();
  }, []);

  const handleAddCustomer = async () => {
    if (!newCustomer.name.trim() || !newCustomer.address.trim()) {
      toast.error("Both Customer Name and Address are required.");
      return;
    }

    try {
      const response = await api.post("/customers/", newCustomer);

      setCustomers([...customers, response.data]);
      setNewCustomer({ name: "", address: "" });

      toast.success("Customer added successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error adding customer:",
        error.response?.data || error.message
      );
      toast.error("Failed to add customer. Please try again.");
    }
  };

  const openEditPopup = (customer) => {
    setEditCustomer(customer);
    setIsEditPopupOpen(true);
  };

  const handleEditCustomer = async () => {
    if (!editCustomer.name.trim() || !editCustomer.address.trim()) {
      toast.error("Both Customer Name and Address are required.");
      return;
    }

    try {
      const response = await api.put(
        `/customers/${editCustomer.id}/`,
        editCustomer
      );

      setCustomers(
        customers.map((cust) =>
          cust.id === editCustomer.id ? response.data : cust
        )
      );
      setIsEditPopupOpen(false);

      toast.success("Customer updated successfully!", {
        duration: 2000,
      });
    } catch (error) {
      console.error(
        "Error updating customer:",
        error.response?.data || error.message
      );

      toast.error("Failed to update customer. Please try again.", {
        duration: 2000,
      });
    }
  };

  const handleDeleteCustomer = async () => {
    if (!customerToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/customers/${customerToDelete.id}/`);

      setCustomers((prevCustomers) =>
        prevCustomers.filter((cust) => cust.id !== customerToDelete.id)
      );

      toast.success("Customer deleted successfully!", {
        duration: 2000,
      });
    } catch (error) {
      console.error(
        "Error deleting customer:",
        error.response?.data || error.message
      );

      toast.error("Failed to delete customer. Please try again.", {
        duration: 2000,
      });
    } finally {
      setIsDeleting(false);
      setCustomerToDelete(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Customer Management"
        description="Manage customers and their addresses"
      />

      {canManage && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Add Customer</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="grid flex-1 gap-2">
              <Label htmlFor="customer-name">Customer Name</Label>
              <Input
                id="customer-name"
                type="text"
                placeholder="Enter Customer Name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
              />
            </div>
            <div className="grid flex-1 gap-2">
              <Label htmlFor="customer-address">Address</Label>
              <Input
                id="customer-address"
                type="text"
                placeholder="Enter Address"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
              />
            </div>
            <Button onClick={handleAddCustomer}>
              <PlusIcon />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Customers</CardTitle>
        </CardHeader>
        <CardContent>
          {customers.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-2 pr-4 font-medium w-16">No.</th>
                  <th className="py-2 pr-4 font-medium">Customers</th>
                  <th className="py-2 pr-4 font-medium">Address</th>
                  {isSuperAdmin && (
                    <th className="py-2 text-right font-medium">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => (
                  <tr key={customer.id} className="border-b last:border-0">
                    <td className="py-3 pr-4 text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="py-3 pr-4 font-medium">{customer.name}</td>
                    <td className="py-3 pr-4 text-muted-foreground">
                      {customer.address}
                    </td>
                    {isSuperAdmin && (
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-success"
                            onClick={() => openEditPopup(customer)}
                            aria-label={`Edit ${customer.name}`}
                          >
                            <PencilIcon className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => setCustomerToDelete(customer)}
                            aria-label={`Delete ${customer.name}`}
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
              title="No customers yet"
              description="Add your first customer to start recording sales."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditPopupOpen} onOpenChange={setIsEditPopupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Customer</DialogTitle>
            <DialogDescription>
              Update the customer details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-customer-name">Customer Name</Label>
              <Input
                id="edit-customer-name"
                type="text"
                value={editCustomer.name}
                onChange={(e) =>
                  setEditCustomer({ ...editCustomer, name: e.target.value })
                }
                placeholder="Edit Customer Name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-customer-address">Address</Label>
              <Input
                id="edit-customer-address"
                type="text"
                value={editCustomer.address}
                onChange={(e) =>
                  setEditCustomer({ ...editCustomer, address: e.target.value })
                }
                placeholder="Edit Address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditPopupOpen(false)}>
              Discard
            </Button>
            <Button onClick={handleEditCustomer}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!customerToDelete}
        onOpenChange={(open) => !open && setCustomerToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the customer &quot;
              {customerToDelete?.name}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteCustomer}
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

export default CustomerManagement;