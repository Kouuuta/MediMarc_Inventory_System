import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Combobox } from "@/components/common/Combobox";
import { SaleStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

const STATUS_DOT = {
  Pending: "bg-amber-500",
  Delivered: "bg-emerald-500",
  Cancelled: "bg-rose-500",
};

const STATUS_TRIGGER = {
  Pending: "border-amber-200 bg-amber-50 text-amber-700",
  Delivered: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Cancelled: "border-rose-200 bg-rose-50 text-rose-700",
};

const saleSellingPrice = (sale) => sale?.selling_price ?? sale?.sellingPrice ?? 0;

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [page] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [isEditSaleOpen, setIsEditSaleOpen] = useState(false);
  const [editSale, setEditSale] = useState(null);
  const [saleToDelete, setSaleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  const canManage =
    loggedInUserType === "SUPER ADMIN" || loggedInUserType === "Admin";
  const isSuperAdmin = loggedInUserType === "SUPER ADMIN";

  const customerOptions = customers.map((customer) => ({
    value: String(customer.id),
    label: customer.name,
  }));

  const [isAddSaleOpen, setIsAddSaleOpen] = useState(false);
  const [newSale, setNewSale] = useState({
    invoiceNumber: "",
    itemCode: "",
    productName: "",
    productId: "",
    sellingPrice: "",
    quantity: "",
    total: "",
    date: "",
    lotNumber: "",
    expirationDate: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const response = await api.get("/sales/");
        setSales(response.data);
      } catch (error) {
        console.error(
          "Error fetching sales:",
          error.response?.data || error.message
        );
        setSales([]);
      }
    };

    fetchSales();
  }, []);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const customerResponse = await api.get("/sales/customers/");
        setCustomers(customerResponse.data);

        const productResponse = await api.get("/sales/products/");
        setProducts(productResponse.data);
      } catch (error) {
        console.error(
          "Error fetching dropdown data:",
          error.response?.data || error.message
        );
      }
    };

    fetchDropdownData();
  }, [page]);

  const openAddSale = () => setIsAddSaleOpen(true);
  const closeAddSale = () => setIsAddSaleOpen(false);

  const openEditSale = (sale) => {
    setEditSale({ ...sale });
    setIsEditSaleOpen(true);
  };

  const closeEditSale = () => {
    setEditSale(null);
    setIsEditSaleOpen(false);
  };

  const handleAddSale = async () => {
    if (!selectedCustomer) {
      toast.error("Please select a customer before adding a sale.", {
        duration: 2000,
      });
      return;
    }

    if (!newSale.productId || !newSale.quantity || !newSale.date) {
      toast.warning("All fields are required!", { duration: 2000 });
      return;
    }

    const customerObj = customers.find(
      (customer) => customer.id === parseInt(selectedCustomer, 10)
    );
    const productObj = products.find(
      (product) =>
        parseInt(product.product_id, 10) === parseInt(newSale.productId, 10)
    );

    if (!customerObj || !productObj) {
      toast.error("Invalid customer or product selection!", { duration: 2000 });
      return;
    }

    const combinedQuantity = newSale.quantity;

    const salePayload = {
      invoice_number: newSale.invoiceNumber,
      customer: parseInt(customerObj.id, 10),
      product: parseInt(productObj.product_id, 10),
      quantity: combinedQuantity,
      total: parseFloat(newSale.total),
      date: newSale.date,
      lotNumber: productObj.lot_number,
      expirationDate: productObj.expiration_date,
      status: "Pending",
    };

    try {
      const response = await api.post("/sales/add/", salePayload);

      setSales([...sales, response.data]);

      toast.success("Sale added successfully!", { duration: 2000 });

      setNewSale({
        invoiceNumber: "",
        itemCode: "",
        productName: "",
        productId: "",
        sellingPrice: "",
        quantity: "",
        total: "",
        date: "",
        lotNumber: "",
        expirationDate: "",
      });
    } catch (error) {
      console.error("Error adding sale:", error);
      toast.error("Failed to add sale.", { duration: 2000 });
    }
  };

  const handleEditSale = async () => {
    if (!editSale || !editSale.id) {
      toast.warning("Sale ID is missing.", { duration: 2000 });
      return;
    }

    if (editSale.status === "Delivered") {
      toast.error("Cannot edit a delivered sale.", { duration: 2000 });
      return;
    }

    try {
      const response = await api.put(`/sales/${editSale.id}/edit/`, {
        product: parseInt(editSale.product, 10),
        quantity: parseInt(editSale.quantity, 10),
        total: parseFloat(editSale.total),
        date: editSale.date,
      });

      setSales(
        sales.map((sale) => (sale.id === editSale.id ? response.data : sale))
      );

      toast.success("Sale updated successfully!", { duration: 2000 });
      setIsEditSaleOpen(false);
    } catch (error) {
      console.error(
        "Error updating sale:",
        error.response?.data || error.message
      );
      toast.error("Failed to update sale.", { duration: 2000 });
    }
  };

  const handleStatusChange = async (saleId, newStatus) => {
    try {
      const response = await api.put(`/sales/${saleId}/update-status/`, {
        status: newStatus,
      });

      toast.success(`Sale status updated to ${newStatus}`);

      setSales((prevSales) =>
        prevSales.map((sale) =>
          sale.id === saleId ? { ...sale, status: response.data.status } : sale
        )
      );
    } catch (error) {
      console.error("Error updating sale status:", error);
      toast.error("Failed to update sale status.", { duration: 2000 });
    }
  };

  const handleDeleteSale = async () => {
    if (!saleToDelete) return;
    const saleId = saleToDelete.id;
    setIsDeleting(true);
    try {
      await api.delete(`/sales/${saleId}/delete/`);
      setSales((prevSales) => prevSales.filter((sale) => sale.id !== saleId));
      toast.success("Sale deleted successfully!", { duration: 2000 });
    } catch (error) {
      console.error("Error deleting sale:", error.response?.data || error.message);

      if (error.response?.status === 403) {
        toast.error("Access denied. Please check your authentication.");
      } else if (error.response?.status === 404) {
        toast.error("Sale not found. It may have been deleted already.");
      } else {
        toast.error("Failed to delete sale.", { duration: 2000 });
      }
    } finally {
      setIsDeleting(false);
      setSaleToDelete(null);
    }
  };

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };
  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") {
      return "₱0.00";
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return "₱0.00";
    }

    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const productOptions = products.map((product) => ({
    value: String(product.product_id),
    label: `${product.item_code} - ${product.lot_number} - ${product.stock}`,
  }));

  const filteredSales = sales.filter(
    (sale) => sale.customer === parseInt(selectedCustomer, 10)
  );

  return (
    <>
      <PageHeader title="Sales" description="Record and manage sales">
        <Combobox
          options={customerOptions}
          value={selectedCustomer}
          onChange={setSelectedCustomer}
          placeholder="Select Customer"
          searchPlaceholder="Search customer..."
          className="w-full sm:w-56"
        />
        {canManage && (
          <Button onClick={openAddSale}>
            <PlusIcon />
            Add Sales
          </Button>
        )}
      </PageHeader>

      <Card>
        <CardContent className="pt-6">
          {filteredSales.length > 0 ? (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">SI No.</th>
                    <th className="py-2 pr-4 font-medium">Date Invoice</th>
                    <th className="py-2 pr-4 font-medium">Item Code</th>
                    <th className="py-2 pr-4 font-medium">Product Name</th>
                    <th className="py-2 pr-4 text-right font-medium">Quantity</th>
                    <th className="py-2 pr-4 text-right font-medium">Total</th>
                    <th className="py-2 pr-4 font-medium">Lot Number</th>
                    <th className="py-2 pr-4 font-medium">Expiration Date</th>
                    {isSuperAdmin && <th className="py-2 pr-4 font-medium">Status</th>}
                    {isSuperAdmin && <th className="py-2 text-right font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredSales
                    .sort((a, b) => b.id - a.id)
                    .map((sale, index) => (
                      <tr key={`${sale.id}-${index}`} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">
                          {sale.invoice_number || String(sale.id).padStart(4, "0")}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{sale.date}</td>
                        <td className="py-2.5 pr-4 font-medium">{sale.item_code}</td>
                        <td className="py-2.5 pr-4">{sale.product_name}</td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {formatNumber(sale.quantity)}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-medium tabular-nums">
                          ₱{formatCurrency(sale.total)}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">{sale.lot_number}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {sale.expiration_date}
                        </td>
                        {isSuperAdmin && (
                          <td className="py-2.5 pr-4">
                            {sale.status === "Delivered" ? (
                              <SaleStatusBadge status={sale.status} />
                            ) : (
                              <Select
                                value={String(sale.status)}
                                onValueChange={(value) =>
                                  handleStatusChange(sale.id, value)
                                }
                              >
                                <SelectTrigger
                                  className={`h-8 w-32 text-xs font-medium ${STATUS_TRIGGER[sale.status] ?? ""}`}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {["Pending", "Cancelled", "Delivered"].map(
                                    (status) => (
                                      <SelectItem key={status} value={status}>
                                        <span className="flex items-center gap-2">
                                          <span
                                            className={`size-2 rounded-full ${STATUS_DOT[status]}`}
                                          />
                                          {status}
                                        </span>
                                      </SelectItem>
                                    )
                                  )}
                                </SelectContent>
                              </Select>
                            )}
                          </td>
                        )}
                        {isSuperAdmin && (
                          <td className="py-2.5">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success"
                                onClick={() => openEditSale(sale)}
                                disabled={sale.status === "Delivered"}
                                title={
                                  sale.status === "Delivered"
                                    ? "Cannot edit a delivered sale"
                                    : "Edit sale"
                                }
                                aria-label="Edit sale"
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setSaleToDelete(sale)}
                                aria-label="Delete sale"
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
            </div>
          ) : (
            <EmptyState
              title={selectedCustomer ? "No sales found" : "Select a customer"}
              description={
                selectedCustomer
                  ? "No sales recorded for this customer yet."
                  : "Pick a customer above to view their sales."
              }
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditSaleOpen} onOpenChange={setIsEditSaleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Sale</DialogTitle>
            <DialogDescription>Update the sale details below</DialogDescription>
          </DialogHeader>
          {editSale && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="editSaleDate">Date</Label>
                <Input
                  id="editSaleDate"
                  type="date"
                  value={editSale.date}
                  onChange={(e) =>
                    setEditSale({ ...editSale, date: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Product ID</Label>
                <Input type="text" value={editSale.product_id} readOnly />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editSalePrice">Selling Price</Label>
                <Input
                  id="editSalePrice"
                  type="text"
                  value={saleSellingPrice(editSale)}
                  onChange={(e) =>
                    setEditSale({ ...editSale, sellingPrice: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editSaleQty">Quantity</Label>
                <Input
                  id="editSaleQty"
                  type="number"
                  value={editSale.quantity}
                  onChange={(e) => {
                    const quantity = e.target.value;
                    const total = saleSellingPrice(editSale)
                      ? parseFloat(saleSellingPrice(editSale)) *
                        parseInt(quantity || 0, 10)
                      : 0;
                    setEditSale({ ...editSale, quantity, total });
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editSaleTotal">Total</Label>
                <Input
                  id="editSaleTotal"
                  type="number"
                  value={editSale.total}
                  readOnly
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEditSale}>
              Cancel
            </Button>
            <Button onClick={handleEditSale}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddSaleOpen} onOpenChange={setIsAddSaleOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add Sales</DialogTitle>
            <DialogDescription>Record a new sale for a customer</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="invoiceNumber">Sales Invoice No.</Label>
              <Input
                id="invoiceNumber"
                type="text"
                placeholder="Enter Sales Invoice No."
                value={newSale.invoiceNumber}
                onChange={(e) =>
                  setNewSale({ ...newSale, invoiceNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="salesDate">Sales Date</Label>
              <Input
                id="salesDate"
                type="date"
                value={newSale.date}
                onChange={(e) =>
                  setNewSale({ ...newSale, date: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Product</Label>
              <Combobox
                options={productOptions}
                value={newSale.productId}
                onChange={(value) => {
                  const selectedProduct = products.find(
                    (product) => String(product.product_id) === String(value)
                  );
                  setNewSale({
                    ...newSale,
                    productId: selectedProduct?.product_id || "",
                    itemCode: selectedProduct?.item_code || "",
                    productName: selectedProduct?.product_name || "",
                    sellingPrice: selectedProduct?.selling_price || "",
                    lotNumber: selectedProduct?.lot_number || "N/A",
                    expirationDate: selectedProduct?.expiration_date || "N/A",
                  });
                }}
                placeholder="Select Product"
                searchPlaceholder="Search product..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                type="text"
                value={newSale.productName}
                readOnly
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input
                id="sellingPrice"
                type="text"
                placeholder="Enter Selling Price"
                value={newSale.sellingPrice}
                onChange={(e) =>
                  setNewSale({ ...newSale, sellingPrice: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Enter Quantity"
                value={newSale.quantity}
                onChange={(e) => {
                  const quantity = e.target.value;
                  const total = newSale.sellingPrice
                    ? parseFloat(newSale.sellingPrice) *
                      parseInt(quantity || 0, 10)
                    : 0;
                  setNewSale({ ...newSale, quantity, total });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="saleTotal">Total</Label>
              <Input id="saleTotal" type="text" value={newSale.total} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input id="lotNumber" type="text" value={newSale.lotNumber} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={newSale.expirationDate}
                readOnly
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddSale}>
              Discard
            </Button>
            <Button onClick={handleAddSale}>Add Sales</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!saleToDelete}
        onOpenChange={(open) => !open && setSaleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this sale? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteSale}
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

export default Sales;