import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUsers,
  FaBox,
  FaTags,
  FaShoppingCart,
  FaUserFriends,
} from "react-icons/fa";
import "../styles/HomePage.css";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import api from "../services/api";

const HomePage = () => {
  const navigate = useNavigate();
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [totalSales, setTotalSales] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);
  const [latestSales, setLatestSales] = useState([]);
  const [recentProducts, setRecentProducts] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [rangeData, setRangeData] = useState([]);
  const [selectedRange, setSelectedRange] = useState("30");

  useEffect(() => {
    // Inside HomePage.jsx or wherever you need to refresh low stock products:
    const fetchLowStockProducts = async () => {
      try {
        const response = await api.get("/products/low-stock/");

        setLowStockProducts(response.data); // Update the low stock products state
      } catch (error) {
        console.error(
          "Error fetching low stock products:",
          error.response?.data || error.message
        );
      }
    };

    fetchLowStockProducts();
  }, []);

  useEffect(() => {
    const fetchSalesData = async () => {
      try {
        const response = await api.post("/sales/total/", {
          days: selectedRange,
        });

        // ✅ Update rangeData with both sales & revenue
        const formattedData = response.data.map((entry) => ({
          date: entry.date,
          sales: entry.sales, // Number of sales
          revenue: entry.revenue, // Total revenue in pesos
        }));

        console.log("📊 Chart Data:", formattedData);
        setRangeData(formattedData);
      } catch (error) {
        console.error(
          "❌ Error fetching sales data:",
          error.response?.data || error.message
        );
      }
    };

    fetchSalesData();
  }, [selectedRange]);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const fetchTotals = async () => {
      try {
        const usersResponse = await api.get("/users/total/");
        const customersResponse = await api.get("/customers/total/");
        const categoriesResponse = await api.get("/categories/total/");
        const salesResponse = await api.get("/sales/total/count/");
        const productsResponse = await api
          .get("/products/total/")
          .catch((error) => {
            console.error(
              "❌ Error fetching total products:",
              error.response?.data || error.message
            );
          });

        setTotalUsers(usersResponse.data.count);
        setTotalCustomers(customersResponse.data.count);
        setTotalCategories(categoriesResponse.data.count);
        setTotalSales(salesResponse.data.count);
        setTotalProducts(productsResponse.data.count);
      } catch (error) {
        console.error(
          "❌ Error fetching totals:",
          error.response?.data || error.message
        );
      }
    };

    fetchTotals();
  }, []);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const salesRes = await api.get("/sales/latest/");
        const recentRes = await api.get("/products/recent/");
        const lowStockRes = await api.get("/products/low-stock/");

        setLatestSales(salesRes.data);
        setRecentProducts(recentRes.data); // Ensure this is correctly set
        setLowStockProducts(lowStockRes.data); // Ensure low-stock data is correctly set
      } catch (error) {
        console.error(
          "❌ Error fetching dashboard data:",
          error.response?.data || error.message
        );
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    // Handle undefined, null, or empty strings
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
    return (
      "₱" +
      numValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  return (
    <main className="dashboard-content">
      <div className="dashboard-cards">
        <div className="dashboard-card">
          <FaUsers className="dashboard-icon" color="blue" />
          <h3>Total Users</h3>
          <p>{totalUsers}</p>
        </div>
        <div className="dashboard-card">
          <FaBox className="dashboard-icon" color="blue" />
          <h3>Total Products</h3>
          <p>{totalProducts}</p>
        </div>
        <div className="dashboard-card">
          <FaTags className="dashboard-icon" color="blue" />
          <h3>Total Categories</h3>
          <p>{totalCategories}</p>
        </div>
        <div className="dashboard-card">
          <FaShoppingCart className="dashboard-icon" color="blue" />
          <h3>Total Entry Sales</h3>
          <p>{totalSales}</p>
        </div>
        <div className="dashboard-card">
          <FaUserFriends className="dashboard-icon" color="blue" />
          <h3>Total Customers</h3>
          <p>{totalCustomers}</p>
        </div>
      </div>

      <div className="dashboard-tables">
        <div className="dashboard-table">
          <h3>Latest Sales</h3>
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Item Code</th>
                <th>Date</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {latestSales.map((sale) => (
                <tr key={sale.id}>
                  <td>{sale.product_id}</td>
                  <td>{sale.item_code}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{formatCurrency(sale.total.toLocaleString())}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="dashboard-table">
          <h3>Recently Added Products</h3>
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {recentProducts.map((product) => (
                <tr key={product.product_id}>
                  <td>{product.item_code}</td>
                  <td>{product.category_name || "Uncategorized"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="low-stock-scroll">
          <h3>Low Stock Products</h3>
          <table>
            <thead>
              <tr>
                <th>Item Code</th>
                <th>Quantity</th>
              </tr>
            </thead>
            <tbody>
              {lowStockProducts.map((product) => (
                <tr key={product.item_code}>
                  <td>{product.item_code}</td>
                  <td
                    style={{
                      color: product.total_stock <= 500 ? "red" : "black",
                    }}
                  >
                    {product.total_stock}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-chart">
        <div className="chart-filters">
          <button
            onClick={() => setSelectedRange("7")}
            className={selectedRange === "7" ? "active" : ""}
          >
            This Week
          </button>
          <button
            onClick={() => setSelectedRange("30")}
            className={selectedRange === "30" ? "active" : ""}
          >
            This Month
          </button>
          <button
            onClick={() => setSelectedRange("365")}
            className={selectedRange === "365" ? "active" : ""}
          >
            This Year
          </button>
        </div>

        <h3>Sales Chart</h3>

        <ResponsiveContainer width="100%" height={290}>
          <BarChart
            data={rangeData}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <XAxis
              dataKey="date"
              tickFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
            />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip
              content={({ payload, label, active }) => {
                if (active && payload && payload.length) {
                  return (
                    <div
                      style={{
                        background: "white",
                        padding: "10px",
                        borderRadius: "5px",
                        border: "1px solid #ccc",
                        boxShadow: "2px 2px 10px rgba(0,0,0,0.1)",
                        fontSize: "14px",
                      }}
                    >
                      <p style={{ fontWeight: "bold", color: "#555" }}>
                        {format(new Date(label), "MMM dd, yyyy")}
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "#8884d8",
                          margin: "5px 0",
                        }}
                      >
                        Sales: <strong>{payload[0].value}</strong>
                      </p>
                      <p
                        style={{
                          fontWeight: "bold",
                          color: "green",
                          margin: "5px 0",
                        }}
                      >
                        Revenue (₱):{" "}
                        <strong>{payload[1].value.toLocaleString()}</strong>
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="sales"
              fill="#8884d8"
              name="  Sales"
              barSize={15}
            />
            <Bar
              yAxisId="right"
              dataKey="revenue"
              fill="#82ca9d"
              name="Revenue (₱)"
              barSize={15}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
};

export default HomePage;
