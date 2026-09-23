import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  UsersIcon,
  BoxesIcon,
  TagsIcon,
  ShoppingCartIcon,
  UserRoundIcon,
  TrendingDownIcon,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";
import { ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/common/StatCard";
import api from "@/lib/api";

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
    const fetchLowStockProducts = async () => {
      try {
        const response = await api.get("/products/low-stock/");
        setLowStockProducts(response.data);
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

        const formattedData = response.data.map((entry) => ({
          date: entry.date,
          sales: entry.sales,
          revenue: entry.revenue,
        }));

        setRangeData(formattedData);
      } catch (error) {
        console.error(
          "Error fetching sales data:",
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
              "Error fetching total products:",
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
          "Error fetching totals:",
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
        setRecentProducts(recentRes.data);
        setLowStockProducts(lowStockRes.data);
      } catch (error) {
        console.error(
          "Error fetching dashboard data:",
          error.response?.data || error.message
        );
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value) => {
    if (value === undefined || value === null || value === "") {
      return "₱0.00";
    }

    const numValue = typeof value === "string" ? parseFloat(value) : value;

    if (isNaN(numValue)) {
      return "₱0.00";
    }

    return (
      "₱" +
      numValue.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const ranges = [
    { value: "7", label: "This Week" },
    { value: "30", label: "This Month" },
    { value: "365", label: "This Year" },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your inventory activity"
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard
          icon={UsersIcon}
          label="Total Users"
          value={totalUsers}
          iconClassName="bg-indigo-100 text-indigo-600"
        />
        <StatCard
          icon={BoxesIcon}
          label="Total Products"
          value={totalProducts}
          iconClassName="bg-violet-100 text-violet-600"
        />
        <StatCard
          icon={TagsIcon}
          label="Total Categories"
          value={totalCategories}
          iconClassName="bg-sky-100 text-sky-600"
        />
        <StatCard
          icon={ShoppingCartIcon}
          label="Total Entry Sales"
          value={totalSales}
          iconClassName="bg-emerald-100 text-emerald-600"
        />
        <StatCard
          icon={UserRoundIcon}
          label="Total Customers"
          value={totalCustomers}
          iconClassName="bg-amber-100 text-amber-600"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
            <CardTitle>Sales Chart</CardTitle>
            <div className="flex gap-1">
              {ranges.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => setSelectedRange(range.value)}
                  className={
                    "rounded-md px-3 py-1.5 text-sm font-medium transition " +
                    (selectedRange === range.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted")
                  }
                >
                  {range.label}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={rangeData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="date"
                  tickFormatter={(date) => format(new Date(date), "MMM dd, yyyy")}
                  tick={{ fontSize: 12 }}
                />
                <YAxis yAxisId="left" orientation="left" stroke="#6366f1" />
                <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                <Tooltip
                  content={({ payload, label, active }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-md border bg-white p-3 text-sm shadow-md">
                          <p className="font-semibold">
                            {format(new Date(label), "MMM dd, yyyy")}
                          </p>
                          <p className="text-primary mt-1 font-medium">
                            Sales: {payload[0]?.value}
                          </p>
                          <p className="text-success mt-1 font-medium">
                            Revenue (₱): {payload[1]?.value?.toLocaleString()}
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
                  fill="#6366f1"
                  name="Sales"
                  barSize={15}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  yAxisId="right"
                  dataKey="revenue"
                  fill="#10b981"
                  name="Revenue (₱)"
                  barSize={15}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center gap-2 space-y-0">
            <TrendingDownIcon className="text-destructive size-5" />
            <CardTitle>Low Stock Products</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length > 0 ? (
              <div className="max-h-[290px] space-y-0">
                <div className="grid grid-cols-[1fr_auto] gap-2 border-b pb-2 text-xs font-medium text-muted-foreground">
                  <span>Item Code</span>
                  <span>Quantity</span>
                </div>
                {lowStockProducts.map((product) => (
                  <div
                    key={product.item_code}
                    className="grid grid-cols-[1fr_auto] items-center gap-2 border-b py-3 last:border-0"
                  >
                    <span className="font-medium">{product.item_code}</span>
                    <Badge
                      variant={product.total_stock <= 500 ? "destructive" : "secondary"}
                      className="tabular-nums"
                    >
                      {product.total_stock}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No low stock products.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Latest Sales</CardTitle>
            <Badge variant="secondary">{latestSales.length} entries</Badge>
          </CardHeader>
          <CardContent>
            {latestSales.length > 0 ? (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Item Code</th>
                      <th className="py-2 pr-4 font-medium">Date</th>
                      <th className="py-2 text-right font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {latestSales.map((sale) => (
                      <tr key={sale.id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">
                          {sale.item_code}
                        </td>
                        <td className="py-2.5 pr-4 text-muted-foreground">
                          {new Date(sale.date).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 text-right font-medium tabular-nums">
                          {formatCurrency(sale.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No sales yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle>Recently Added Products</CardTitle>
            <Badge variant="secondary">{recentProducts.length} items</Badge>
          </CardHeader>
          <CardContent>
            {recentProducts.length > 0 ? (
              <div className="max-h-72 overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs text-muted-foreground">
                      <th className="py-2 pr-4 font-medium">Item Code</th>
                      <th className="py-2 font-medium">Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentProducts.map((product) => (
                      <tr key={product.product_id} className="border-b last:border-0">
                        <td className="py-2.5 pr-4 font-medium">
                          {product.item_code}
                        </td>
                        <td className="py-2.5 text-muted-foreground">
                          {product.category_name || "Uncategorized"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No products added yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default HomePage;