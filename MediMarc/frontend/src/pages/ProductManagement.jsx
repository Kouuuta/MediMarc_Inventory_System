import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProductManagement.css";
import "../pages/Categories";
import Select from "react-select";
import { toast } from "sonner";
import { confirmDialog } from "primereact/confirmdialog";
import api from "../services/api";

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

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  console.log(loggedInUserType);

  const [newProduct, setNewProduct] = useState({
    itemCode: "",
    productName: "",
    categories: "",
    inStock: "",
    buyingPrice: "",
    sellingPrice: "",
  });

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/"); // Redirect to login if no token found
    }
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

        console.log("Total Products Fetched:", response.data);
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

  useEffect(() => {
    fetchProducts(); // Fetch products when the component is mounted
  }, []);

  const [stockDetails, setStockDetails] = useState({ category: "", stock: "" });

  const openAddProduct = () => setIsAddProductOpen(true);
  const closeAddProduct = () => setIsAddProductOpen(false);

  const openAddStock = () => setIsAddStockOpen(true);
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
      setIsProductDetailsOpen(true); // Open product details modal
    } else {
      toast.error("Selected product has invalid stock data.");
    }
  };

  const handleAddProduct = async () => {
    // Ensure fields are filled
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
      const response = await api.post("/products/add/", {
        item_code: newProduct.itemCode,
        product_name: newProduct.productName,
        category: newProduct.category,
        buying_price: newProduct.buyingPrice || 0,
        selling_price: newProduct.sellingPrice || 0,
        stock: newProduct.inStock, // stock to the input value (sales stock)
        original_stock: newProduct.inStock, // set original stock to the same value
        lot_number: newProduct.lotNumber,
        expiration_date: newProduct.expirationDate,
        shipment_date: newProduct.shipmentDate,
      });

      // Get updated product data to reflect changes in the UI
      const updatedProductsResponse = await api.get("/products/");
      console.log(response.data);
      setProducts(updatedProductsResponse.data); // Update state with new data
      toast.success("Product added successfully!", { duration: 2000 });

      fetchProducts(); // Refresh product list after adding a new product
      toast.success("Product added successfully!", { duration: 2000 });

      // Reset form
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

      closeAddProduct(); // Close popup/modal
    } catch (error) {
      console.error(
        "Error adding product:",
        error.response?.data || error.message
      );
      toast.error("Failed to add product.", { duration: 2000 });
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!productId || productId === "N/A") {
      toast.error("❌ Invalid product ID.");
      return;
    }

    confirmDialog({
      message: "Are you sure you want to delete this product?",
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      className: "custom-delete-dialog",
      acceptClassName: "custom-delete-accept-btn",
      rejectClassName: "custom-delete-cancel-btn",
      closable: false,
      acceptLabel: "Yes, Delete",
      rejectLabel: "Cancel",
      accept: async () => {
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
        }
      },
      reject: () => {
        toast.info("Deletion cancelled.");
      },
    });
  };

  const handleAddStock = async () => {
    if (
      !stockDetails.productId ||
      !stockDetails.stock ||
      !stockDetails.shipmentDate
    ) {
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
        setProducts((prevProducts) => {
          const updatedProducts = prevProducts.map((product) =>
            product.product_id === updatedProduct.product_id
              ? {
                  ...product,
                  stock: updatedProduct.stock,
                  original_stock: updatedProduct.original_stock,
                }
              : product
          );

          return updatedProducts;
        });

        toast.error("Stock added successfully!", { duration: 2000 });
      } else {
        toast.success("Stock added successfully!", { duration: 2000 });
      }

      // Reset form and close modal
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

  const formatNumber = (number) => {
    return new Intl.NumberFormat().format(number);
  };
  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") {
      return "₱0.00";
    }

    // Convert to number if it's a string
    const numValue = typeof value === "string" ? parseFloat(value) : value;

    // Check if it's a valid number
    if (isNaN(numValue)) {
      return "₱0.00";
    }

    // Format with 2 decimal places and thousands separators
    return numValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  console.log(products[0]);

  const handleGenerateCSV = async () => {
    try {
      const response = await api.get(
        `/products/generate-csv/?item_code=${itemCodeFilter}`
      );
      // Trigger download
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

      // Refresh the product list
      fetchProducts();
    } catch (error) {
      console.error("Error updating critical stock:", error);
      toast.error("Failed to update critical stock. Please try again.", {
        duration: 2000,
      });
    }
  };

  return (
    <div className="product-management-page">
      <main className="dashboard-content">
        <div className="quantity-display">
          <div className="total-products">
            <h2>Total Quantity of Products:</h2>
            <p></p>
            <h2>{totalProducts} Products</h2>
          </div>
          <div className="filter-section">
            <h2>Shipment Report</h2>
            <input
              type="text"
              value={itemCodeFilter}
              onChange={(e) => setItemCodeFilter(e.target.value.toUpperCase())}
              placeholder="Filter by Item Code"
              className="search-bar-filter"
            />
            <button className="csv-product-btn" onClick={handleGenerateCSV}>
              Generate CSV
            </button>
          </div>

          <div className="search-bar-container">
            <input
              type="text"
              placeholder="Search Item Code"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
              className="search-bar"
            />
            <h3
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                fontWeight: "bold",
              }}
            >
              Total Stock for{" "}
              <span style={{ color: "#6a5acd" }}>
                {searchTerm.toUpperCase()}
              </span>
              <p
                style={{
                  margin: "5px 0",
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "red",
                }}
              >
                {formatNumber(totalStock)} Stocks
              </p>
            </h3>
          </div>
        </div>
        <div className="product-container">
          {loggedInUserType &&
            (loggedInUserType === "SUPER ADMIN" ||
              loggedInUserType === "Admin") && (
              <div className="product-actions">
                <button
                  className="action-btn add-stock-btn"
                  onClick={openAddStock}
                >
                  Add Stock
                </button>

                <button
                  className="action-btn add-product-btn"
                  onClick={openAddProduct}
                >
                  Add Product
                </button>
              </div>
            )}
          <div className="product-table-container">
            <table className="product-table">
              <thead>
                <tr>
                  <th>Shipment Date</th>
                  <th>Item Code</th>
                  <th>Product Name</th>
                  <th>Categories</th>
                  <th>Original Stock</th>
                  <th>Sales Stock</th>
                  <th>Selling Price</th>
                  <th>Critical Stock</th>{" "}
                  {/* Add this header for critical stock */}
                  {loggedInUserType === "SUPER ADMIN" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {[...products]
                  .sort((a, b) => b.product_id - a.product_id)
                  .map((product, key) => (
                    <tr key={key}>
                      <td>
                        {product.shipment_date
                          ? new Date(product.shipment_date).toLocaleDateString()
                          : "N/A"}
                      </td>
                      <td
                        style={{
                          color: "red",
                          cursor: "pointer",
                          fontWeight: "bold",
                          fontFamily: "sans-serif",
                        }}
                        onClick={() => handleItemCodeClick(product.product_id)}
                      >
                        {product.item_code}
                      </td>
                      <td>{product.product_name || "N/A"}</td>
                      <td>
                        {product.category ? product.category : "Uncategorized"}
                      </td>
                      <td style={{ fontWeight: "bold", color: "black" }}>
                        {formatNumber(product.original_stock || 0)}
                      </td>
                      <td>{formatNumber(product.stock || 0)}</td>
                      <td>
                        {product.selling_price
                          ? `₱${formatCurrency(product.selling_price)}`
                          : "N/A"}
                      </td>
                      <td>
                        {/* Input field for updating the critical stock */}
                        <input
                          type="number"
                          value={product.critical_stock}
                          onChange={(e) =>
                            handleUpdateCriticalStock(
                              product.product_id,
                              e.target.value
                            )
                          }
                        />
                      </td>
                      {loggedInUserType === "SUPER ADMIN" && (
                        <td>
                          <button
                            className="product-management-page edit-btn"
                            onClick={() => openEditProduct(product)}
                          >
                            ✏
                          </button>
                          <button
                            className="product-management-page delete-btn"
                            onClick={() =>
                              handleDeleteProduct(product.product_id)
                            }
                          >
                            🗑
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {isProductDetailsOpen && selectedProduct && (
        <div
          className="modal-overlay"
          onClick={() => setIsProductDetailsOpen(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Product Details</h2>
            <p>
              <strong>Item Code:</strong> {selectedProduct.item_code}
            </p>
            <p>
              <strong>Lot Number:</strong>{" "}
              {selectedProduct.lot_number
                ? selectedProduct.lot_number
                : "Not Available"}
            </p>
            <p>
              <strong>Expiration Date:</strong>{" "}
              {selectedProduct.expiration_date
                ? new Date(selectedProduct.expiration_date).toLocaleDateString()
                : "Not Available"}
            </p>

            <button
              className="close-btn"
              onClick={() => setIsProductDetailsOpen(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {isAddProductOpen && (
        <div className="product-popup-overlay" onClick={closeAddProduct}>
          <div className="product-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Add Product</h2>
            <form>
              <div className="date-input-group">
                <label htmlFor="shipmentDate">Shipment Date</label>
                <input
                  id="shipmentDate"
                  type="date"
                  value={newProduct.shipmentDate}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      shipmentDate: e.target.value,
                    })
                  }
                />
              </div>
              <input
                type="text"
                placeholder="Enter Item Code"
                value={newProduct.itemCode}
                onChange={(e) => {
                  const inputCode = e.target.value.toUpperCase();
                  const matchedProduct = products.find(
                    (product) => product.item_code.toUpperCase() === inputCode
                  );

                  if (matchedProduct) {
                    setNewProduct({
                      ...newProduct,
                      itemCode: inputCode,
                      productName: matchedProduct.product_name,
                      category: matchedProduct.category,
                      sellingPrice: matchedProduct.selling_price,
                      originalStock: matchedProduct.original_stock, // Ensure matching the original stock
                    });
                  } else {
                    setNewProduct({
                      ...newProduct,
                      itemCode: inputCode,
                      productName: "",
                      category: "",
                      sellingPrice: "",
                      originalStock: "", // Clear original stock when no match
                    });
                  }
                }}
              />
              <input
                type="text"
                placeholder="Enter Product Name"
                value={newProduct.productName}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, productName: e.target.value })
                }
              />
              <select
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

              <input
                type="text"
                placeholder="Enter Stock Quantity"
                value={newProduct.inStock}
                onChange={(e) => {
                  const stockValue = e.target.value;
                  setNewProduct({
                    ...newProduct,
                    inStock: stockValue,
                    originalStock: stockValue,
                  });
                }}
              />
              <input
                type="text"
                placeholder="Enter Lot Number"
                value={newProduct.lotNumber}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, lotNumber: e.target.value })
                }
              />

              <div className="date-input-group">
                <label htmlFor="expirationDate">Expiration Date</label>
                <input
                  id="expirationDate"
                  type="date"
                  placeholder="Expiration Date"
                  value={newProduct.expirationDate}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      expirationDate: e.target.value,
                    })
                  }
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>

              <input
                type="text"
                placeholder="Selling Price 0.00"
                value={newProduct.sellingPrice}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, sellingPrice: e.target.value })
                }
              />
              <div className="popup-buttons">
                <button
                  type="button"
                  className="discard-btn"
                  onClick={closeAddProduct}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={handleAddProduct}
                >
                  Add Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isAddStockOpen && (
        <div className="product-popup-overlay" onClick={closeAddStock}>
          <div className="product-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Add Stock</h2>
            <form>
              <Select
                options={uniqueProducts.map((product) => ({
                  value: product.product_id,
                  label: `${product.item_code} - ${product.lot_number}`, // Adjust label as needed
                }))}
                className="custom-react-stock-select"
                classNamePrefix="react-select"
                placeholder="Select Item Code"
                isSearchable={true}
                onChange={(selectedOption) => {
                  const selectedProduct = uniqueProducts.find(
                    (product) => product.product_id === selectedOption.value
                  );
                  setStockDetails({
                    ...stockDetails,
                    productId: selectedProduct?.product_id || "",
                    itemCode: selectedProduct?.item_code || "",
                  });
                }}
              />

              <input
                type="number"
                placeholder="Enter Stock Quantity"
                value={stockDetails.stock}
                onChange={(e) =>
                  setStockDetails({ ...stockDetails, stock: e.target.value })
                }
              />
              <input
                type="date"
                placeholder="Enter Shipment Date"
                value={stockDetails.shipmentDate}
                onChange={(e) =>
                  setStockDetails({
                    ...stockDetails,
                    shipmentDate: e.target.value,
                  })
                }
              />

              <div className="popup-buttons">
                <button
                  type="button"
                  className="discard-btn"
                  onClick={closeAddStock}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={handleAddStock}
                >
                  Add Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {isEditProductOpen && editProduct && (
        <div className="product-popup-overlay" onClick={closeEditProduct}>
          <div className="product-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Product</h2>
            <form>
              <input type="text" value={editProduct.product_id} disabled />
              <input
                type="text"
                value={editProduct.item_code}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, item_code: e.target.value })
                }
              />
              <input
                type="text"
                value={editProduct.product_name}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    product_name: e.target.value,
                  })
                }
              />
              <select
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
              <input
                type="text"
                placeholder="Lot Number"
                value={editProduct.lot_number || ""}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, lot_number: e.target.value })
                }
              />
              <input
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

              <input
                type="number"
                value={editProduct.stock}
                onChange={(e) =>
                  setEditProduct({ ...editProduct, stock: e.target.value })
                }
              />
              <input
                type="text"
                value={editProduct.selling_price}
                onChange={(e) =>
                  setEditProduct({
                    ...editProduct,
                    selling_price: e.target.value,
                  })
                }
              />
              <div className="popup-buttons">
                <button
                  type="button"
                  className="discard-btn"
                  onClick={closeEditProduct}
                >
                  Discard
                </button>
                <button
                  type="button"
                  className="add-btn"
                  onClick={handleEditProduct}
                >
                  Edit Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}{" "}
    </div>
  );
};

export default ProductManagement;
