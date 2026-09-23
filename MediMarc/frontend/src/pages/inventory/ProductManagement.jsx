import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  BoxesIcon,
  FileDownIcon,
  PackagePlusIcon,
  PencilIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { Combobox } from "@/components/common/Combobox";
import { EmptyState } from "@/components/common/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

const CriticalStockInput = ({ productId, value, onCommit }) => {
  const [localValue, setLocalValue] = useState(value ?? "");

  useEffect(() => {
    setLocalValue(value ?? "");
  }, [value]);

  const commit = () => {
    const next = Number(localValue);
    if (next !== Number(value)) {
      onCommit(productId, next);
    }
  };

  return (
    <Input
      type="number"
      className="w-24"
      value={localValue}
      onChange={(e) => setLocalValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
    />
  );
};

const ProductManagement = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [isAddStockOpen, setIsAddStockOpen] = useState(false);
  const [isEditProductOpen, setIsEditProductOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [totalProducts, setTotalProducts] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isProductDetailsOpen, setIsProductDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [totalStock, setTotalStock] = useState(0);
  const [itemCodeFilter, setItemCodeFilter] = useState("");
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  const canManage =
    loggedInUserType === "SUPER ADMIN" || loggedInUserType === "Admin";
  const isSuperAdmin = loggedInUserType === "SUPER ADMIN";

  const [newProduct, setNewProduct] = useState({
    itemCode: "",
    productName: "",
    category: "",
    buyingPrice: "",
    sellingPrice: "",
    inStock: "",
    lotNumber: "",
    expirationDate: "",
    shipmentDate: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const total = products
        .filter((product) =>
          product.product_name.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .reduce((acc, product) => acc + product.stock, 0);

      setTotalStock(total);
    } else {
      setTotalStock(0);
    }
  }, [searchTerm, products]);

  const [categories, setCategories] = useState([]);

  useEffect(() => {
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

  useEffect(() => {
    const fetchTotalProducts = async () => {
      try {
        const response = await api.get("/products/total2/");
        setTotalProducts(response.data.total2_products);
      } catch (error) {
        console.error(
          "Error fetching total products:",
          error.response?.data || error.message
        );
      }
    };

    fetchTotalProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products/");
      setProducts(response.data);
    } catch (error) {
      console.error(
        "Error fetching products:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const [stockDetails, setStockDetails] = useState({
    productId: "",
    stock: "",
    shipmentDate: "",
  });

  const closeAddProduct = () => setIsAddProductOpen(false);
  const closeAddStock = () => setIsAddStockOpen(false);

  const openEditProduct = (product) => {
    setEditProduct(product);
    setIsEditProductOpen(true);
  };

  const closeEditProduct = () => {
    setEditProduct(null);
    setIsEditProductOpen(false);
  };

  const handleEditProduct = async () => {
    if (!editProduct || !editProduct.product_id) {
      toast.error("Product ID is missing.");
      return;
    }

    try {
      const response = await api.put(
        `/products/${editProduct.product_id}/edit/`,
        {
          item_code: editProduct.item_code,
          product_name: editProduct.product_name,
          category: editProduct.category,
          buying_price: parseFloat(editProduct.buying_price),
          lot_number: editProduct.lot_number,
          expiration_date: editProduct.expiration_date,
          selling_price: parseFloat(editProduct.selling_price),
          stock: parseInt(editProduct.stock, 10),
        }
      );

      setProducts(
        products.map((product) =>
          product.product_id === editProduct.product_id
            ? { ...product, ...response.data }
            : product
        )
      );

      toast.success("Product updated successfully!", {
        duration: 2000,
      });

      setIsEditProductOpen(false);
    } catch (error) {
      console.error(
        "Error editing product:",
        error.response?.data || error.message
      );

      toast.error("Failed to update product. Please try again.", {
        duration: 2000,
      });
    }
  };

  const handleItemCodeClick = (productId) => {
    const selectedProduct = products.find(
      (product) => product.product_id === productId
    );
    if (selectedProduct && selectedProduct.stock !== undefined) {
      setSelectedProduct(selectedProduct);
      setIsProductDetailsOpen(true);
    } else {
      toast.error("Selected product has invalid stock data.");
    }
  };

  const handleAddProduct = async () => {
    if (
      !newProduct.itemCode ||
      !newProduct.productName ||
      !newProduct.sellingPrice ||
      !newProduct.shipmentDate ||
      !newProduct.inStock ||
      !newProduct.category
    ) {
      toast.warning("All required fields must be filled.", { duration: 2000 });
      return;
    }

    try {
      await api.post("/products/add/", {
        item_code: newProduct.itemCode,
        product_name: newProduct.productName,
        category: newProduct.category,
        buying_price: newProduct.buyingPrice || 0,
        selling_price: newProduct.sellingPrice || 0,
        stock: newProduct.inStock,
        original_stock: newProduct.inStock,
        lot_number: newProduct.lotNumber,
        expiration_date: newProduct.expirationDate,
        shipment_date: newProduct.shipmentDate,
      });

      await fetchProducts();
      toast.success("Product added successfully!", { duration: 2000 });

      setNewProduct({
        itemCode: "",
        productName: "",
        category: "",
        buyingPrice: "",
        sellingPrice: "",
        inStock: "",
        lotNumber: "",
        expirationDate: "",
        shipmentDate: "",
      });

      closeAddProduct();
    } catch (error) {
      console.error(
        "Error adding product:",
        error.response?.data || error.message
      );
      toast.error("Failed to add product.", { duration: 2000 });
    }
  };

  const handleDeleteProduct = async () => {
    if (!productToDelete) return;
    const productId = productToDelete.product_id;
    if (!productId || productId === "N/A") {
      toast.error("Invalid product ID.");
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/products/${encodeURIComponent(productId)}/delete/`);

      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.product_id !== productId)
      );

      toast.success("Product deleted successfully!", {
        duration: 2000,
      });
    } catch (error) {
      console.error(
        "Error deleting product:",
        error.response?.data || error.message
      );

      toast.error("Failed to delete product. Please try again.", {
        duration: 2000,
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  const handleAddStock = async () => {
    if (!stockDetails.productId || !stockDetails.stock || !stockDetails.shipmentDate) {
      toast.error(
        "Please select a product, enter stock quantity, and shipment date."
      );
      return;
    }

    const stockValue = parseInt(stockDetails.stock, 10);
    if (isNaN(stockValue) || stockValue <= 0) {
      toast.error("Please enter a valid stock quantity.");
      return;
    }

    try {
      const response = await api.put(
        `/products/${encodeURIComponent(stockDetails.productId)}/update-stock/`,
        {
          stock: stockValue,
          shipment_date: stockDetails.shipmentDate,
        }
      );

      const updatedProduct = response.data.new_product;

      if (updatedProduct && updatedProduct.stock !== undefined) {
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product.product_id === updatedProduct.product_id
              ? {
                  ...product,
                  stock: updatedProduct.stock,
                  original_stock: updatedProduct.original_stock,
                }
              : product
          )
        );
      }

      toast.success("Stock added successfully!", { duration: 2000 });
      setStockDetails({ productId: "", stock: "", shipmentDate: "" });
      closeAddStock();
    } catch (error) {
      console.error(
        "Error updating stock:",
        error.response?.data || error.message
      );
      toast.error("Failed to update stock. Please try again.");
    }
  };

  const uniqueProducts = [
    ...new Map(
      products.map((product) => [
        product.item_code + product.lot_number,
        product,
      ])
    ).values(),
  ];

  const stockOptions = uniqueProducts.map((product) => ({
    value: product.product_id,
    label: `${product.item_code} - ${product.lot_number}`,
  }));

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

  const handleGenerateCSV = async () => {
    try {
      const response = await api.get(
        `/products/generate-csv/?item_code=${itemCodeFilter}`
      );
      const blob = new Blob([response.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "product_report.csv";
      link.click();
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV report");
    }
  };

  const handleUpdateCriticalStock = async (productId, newCriticalStock) => {
    try {
      await api.put(
        `/products/${productId}/update-critical-stock/`,
        { critical_stock: newCriticalStock }
      );

      toast.success("Critical stock updated successfully!", { duration: 2000 });
      fetchProducts();
    } catch (error) {
      console.error("Error updating critical stock:", error);
      toast.error("Failed to update critical stock. Please try again.", {
        duration: 2000,
      });
    }
  };

  return (
    <>
      <PageHeader title="Product Management" description="Manage products and stock">
        {canManage && (
          <Button onClick={() => setIsAddStockOpen(true)}>
            <PackagePlusIcon />
            Add Stock
          </Button>
        )}
      </PageHeader>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <Card className="gap-0 py-5">
          <CardContent className="flex items-center gap-4 px-5 py-0">
            <div className="bg-indigo-100 text-indigo-600 flex size-11 shrink-0 items-center justify-center rounded-lg">
              <BoxesIcon className="size-5" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Total Quantity of Products</p>
              <p className="text-2xl font-semibold">
                {totalProducts} Products
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="px-5 py-0">
            <p className="text-muted-foreground mb-3 text-sm">Search Product</p>
            <div className="relative">
              <SearchIcon className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder="Search Item Code"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
                className="pl-9"
              />
            </div>
            {searchTerm && (
              <p className="mt-3 text-sm">
                Total Stock for{" "}
                <span className="text-primary font-semibold">
                  {searchTerm.toUpperCase()}
                </span>
                :{" "}
                <span className="text-destructive font-bold tabular-nums">
                  {formatNumber(totalStock)} Stocks
                </span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="gap-0 py-5">
          <CardContent className="px-5 py-0">
            <p className="text-muted-foreground mb-3 text-sm">Shipment Report</p>
            <div className="flex gap-2">
              <Input
                type="text"
                value={itemCodeFilter}
                onChange={(e) => setItemCodeFilter(e.target.value.toUpperCase())}
                placeholder="Filter by Item Code"
              />
              <Button
                variant="outline"
                onClick={handleGenerateCSV}
                className="shrink-0"
              >
                <FileDownIcon />
                CSV
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {canManage && (
        <div className="mb-4 flex gap-2">
          <Button variant="outline" onClick={() => setIsAddStockOpen(true)}>
            <PackagePlusIcon />
            Add Stock
          </Button>
          <Button onClick={() => setIsAddProductOpen(true)}>
            <PlusIcon />
            Add Product
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="pt-6">
          {products.length > 0 ? (
            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="py-2 pr-4 font-medium">Shipment Date</th>
                    <th className="py-2 pr-4 font-medium">Item Code</th>
                    <th className="py-2 pr-4 font-medium">Product Name</th>
                    <th className="py-2 pr-4 font-medium">Categories</th>
                    <th className="py-2 pr-4 text-right font-medium">Original Stock</th>
                    <th className="py-2 pr-4 text-right font-medium">Sales Stock</th>
                    <th className="py-2 pr-4 text-right font-medium">Selling Price</th>
                    <th className="py-2 pr-4 font-medium">Critical Stock</th>
                    {isSuperAdmin && (
                      <th className="py-2 text-right font-medium">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {[...products]
                    .sort((a, b) => b.product_id - a.product_id)
                    .map((product, key) => (
                      <tr key={key} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {product.shipment_date
                            ? new Date(product.shipment_date).toLocaleDateString()
                            : "N/A"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <button
                            type="button"
                            className="text-destructive cursor-pointer font-semibold hover:underline"
                            onClick={() =>
                              handleItemCodeClick(product.product_id)
                            }
                          >
                            {product.item_code}
                          </button>
                        </td>
                        <td className="py-2.5 pr-4">{product.product_name || "N/A"}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {product.category ? product.category : "Uncategorized"}
                        </td>
                        <td className="py-2.5 pr-4 text-right font-semibold tabular-nums">
                          {formatNumber(product.original_stock || 0)}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {formatNumber(product.stock || 0)}
                        </td>
                        <td className="py-2.5 pr-4 text-right tabular-nums">
                          {product.selling_price
                            ? `₱${formatCurrency(product.selling_price)}`
                            : "N/A"}
                        </td>
                        <td className="py-2.5 pr-4">
                          <CriticalStockInput
                            productId={product.product_id}
                            value={product.critical_stock}
                            onCommit={handleUpdateCriticalStock}
                          />
                        </td>
                        {isSuperAdmin && (
                          <td className="py-2.5">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-success"
                                onClick={() => openEditProduct(product)}
                                aria-label={`Edit ${product.item_code}`}
                              >
                                <PencilIcon className="size-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={() => setProductToDelete(product)}
                                aria-label={`Delete ${product.item_code}`}
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
              title="No products yet"
              description="Add your first product to start managing stock."
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={isProductDetailsOpen} onOpenChange={setIsProductDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Product Details</DialogTitle>
            <DialogDescription>Details for the selected product</DialogDescription>
          </DialogHeader>
          {selectedProduct && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Item Code</span>
                <span className="font-semibold">{selectedProduct.item_code}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Lot Number</span>
                <span className="font-semibold">
                  {selectedProduct.lot_number
                    ? selectedProduct.lot_number
                    : "Not Available"}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-muted-foreground">Expiration Date</span>
                <span className="font-semibold">
                  {selectedProduct.expiration_date
                    ? new Date(
                        selectedProduct.expiration_date
                      ).toLocaleDateString()
                    : "Not Available"}
                </span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProductDetailsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>Enter the details for the new product</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="shipmentDate">Shipment Date</Label>
              <Input
                id="shipmentDate"
                type="date"
                value={newProduct.shipmentDate}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, shipmentDate: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                type="text"
                placeholder="Enter Item Code"
                value={newProduct.itemCode}
                onChange={(e) => {
                  const inputCode = e.target.value.toUpperCase();
                  const matchedProduct = products.find(
                    (product) => product.item_code.toUpperCase() === inputCode
                  );

                  setNewProduct({
                    ...newProduct,
                    itemCode: inputCode,
                    productName: matchedProduct?.product_name || "",
                    category: matchedProduct?.category || "",
                    sellingPrice: matchedProduct?.selling_price || "",
                    originalStock: matchedProduct?.original_stock || "",
                  });
                }}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productName">Product Name</Label>
              <Input
                id="productName"
                type="text"
                placeholder="Enter Product Name"
                value={newProduct.productName}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, productName: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="productCategory">Category</Label>
              <select
                id="productCategory"
                className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                value={newProduct.category}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, category: e.target.value })
                }
              >
                <option value="">Select Category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.name}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="inStock">Stock Quantity</Label>
              <Input
                id="inStock"
                type="text"
                placeholder="Enter Stock Quantity"
                value={newProduct.inStock}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    inStock: e.target.value,
                    originalStock: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lotNumber">Lot Number</Label>
              <Input
                id="lotNumber"
                type="text"
                placeholder="Enter Lot Number"
                value={newProduct.lotNumber}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, lotNumber: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expirationDate">Expiration Date</Label>
              <Input
                id="expirationDate"
                type="date"
                value={newProduct.expirationDate}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, expirationDate: e.target.value })
                }
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sellingPrice">Selling Price</Label>
              <Input
                id="sellingPrice"
                type="text"
                placeholder="Selling Price 0.00"
                value={newProduct.sellingPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sellingPrice: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddProduct}>
              Discard
            </Button>
            <Button onClick={handleAddProduct}>Add Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isAddStockOpen} onOpenChange={setIsAddStockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Stock</DialogTitle>
            <DialogDescription>Add stock for an existing product</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Item Code</Label>
              <Combobox
                options={stockOptions}
                value={stockDetails.productId}
                onChange={(value) =>
                  setStockDetails({ ...stockDetails, productId: value })
                }
                placeholder="Select Item Code"
                searchPlaceholder="Search item code..."
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockQty">Stock Quantity</Label>
              <Input
                id="stockQty"
                type="number"
                placeholder="Enter Stock Quantity"
                value={stockDetails.stock}
                onChange={(e) =>
                  setStockDetails({ ...stockDetails, stock: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stockShipmentDate">Shipment Date</Label>
              <Input
                id="stockShipmentDate"
                type="date"
                value={stockDetails.shipmentDate}
                onChange={(e) =>
                  setStockDetails({
                    ...stockDetails,
                    shipmentDate: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddStock}>
              Discard
            </Button>
            <Button onClick={handleAddStock}>Add Stock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditProductOpen} onOpenChange={setIsEditProductOpen}>
        <DialogContent className="max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details below</DialogDescription>
          </DialogHeader>
          {editProduct && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label>Product ID</Label>
                <Input type="text" value={editProduct.product_id} disabled />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editItemCode">Item Code</Label>
                <Input
                  id="editItemCode"
                  type="text"
                  value={editProduct.item_code}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, item_code: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editProductName">Product Name</Label>
                <Input
                  id="editProductName"
                  type="text"
                  value={editProduct.product_name}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, product_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editProductCategory">Category</Label>
                <select
                  id="editProductCategory"
                  className="border-input bg-background focus-visible:ring-ring h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs focus-visible:ring-1 focus-visible:outline-none"
                  value={editProduct.category}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, category: e.target.value })
                  }
                >
                  <option value="">Select Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editLotNumber">Lot Number</Label>
                <Input
                  id="editLotNumber"
                  type="text"
                  placeholder="Lot Number"
                  value={editProduct.lot_number || ""}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, lot_number: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editExpirationDate">Expiration Date</Label>
                <Input
                  id="editExpirationDate"
                  type="date"
                  value={editProduct.expiration_date || ""}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      expiration_date: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editStock">Stock</Label>
                <Input
                  id="editStock"
                  type="number"
                  value={editProduct.stock}
                  onChange={(e) =>
                    setEditProduct({ ...editProduct, stock: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="editSellingPrice">Selling Price</Label>
                <Input
                  id="editSellingPrice"
                  type="text"
                  value={editProduct.selling_price}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      selling_price: e.target.value,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={closeEditProduct}>
              Discard
            </Button>
            <Button onClick={handleEditProduct}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!productToDelete}
        onOpenChange={(open) => !open && setProductToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the product &quot;
              {productToDelete?.item_code}&quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-white hover:bg-destructive/90"
              onClick={handleDeleteProduct}
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

export default ProductManagement;