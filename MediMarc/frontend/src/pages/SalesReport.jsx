import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import "../styles/SalesReport.css";
import "../styles/Sales.css";
import { toast } from "sonner";
import api from "../services/api";

const SalesReport = () => {
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [customer, setCustomer] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [sales, setSales] = useState([]);
  const [filteredSales, setFilteredSales] = useState([]);
  const [itemCode, setItemCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await api.get("/customers/");
        setCustomers(response.data);
      } catch (error) {
        console.error("Error fetching customers:", error);
      }
    };

    const fetchSales = async () => {
      try {
        const response = await api.get("/sales/");
        setSales(response.data);
      } catch (error) {
        console.error("Error fetching sales:", error);
      }
    };

    fetchCustomers();
    fetchSales();
  }, []);

  useEffect(() => {
    if (customer) {
      const filtered =
        customer.value === "all"
          ? sales
          : sales.filter((sale) => sale.customer_name === customer.label);
      setFilteredSales(filtered);
    } else {
      setFilteredSales([]);
    }
  }, [customer, sales]);

  const handleGenerateReport = async (format) => {
    try {
      const start = dateRange.start;
      const end = dateRange.end;

      // Check if there are sales in the selected range
      const filteredByDate = sales.filter((sale) => {
        const saleDate = new Date(sale.date);
        const startDate = new Date(start);
        const endDate = new Date(end);
        return saleDate >= startDate && saleDate <= endDate;
      });

      if (filteredByDate.length === 0) {
        toast.error("No sales found in the selected date range.");
        return;
      }

      const params = new URLSearchParams({
        start_date: start || "",
        end_date: end || "",
        customer_name:
          customer?.label === "All Customers" || !customer?.label
            ? ""
            : customer.label,
        item_code: itemCode?.value === "all" ? "" : itemCode?.value || "",
        format_type: format,
      });

      const url = `/sales-report/?${params.toString()}`;

      const response = await api.get(url, {
        responseType: "blob",
      });

      if (response.status !== 200) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv",
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = downloadUrl;
      link.setAttribute("download", `sales_report.${format}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error generating report:", error);
      toast.error("Something went wrong while generating the report.");
    }
  };

  const customerOptions = [
    { label: "All Customers", value: "all" },
    ...customers.map((c) => ({ label: c.name, value: c.id })),
  ];

  const itemOptions = customer
    ? customer.value === "all"
      ? [
          { label: "All Item Codes", value: "all" },
          ...Array.from(
            new Map(
              sales.map((s) => [
                s.item_code,
                { label: `${s.item_code}`, value: s.item_code },
              ])
            ).values()
          ),
        ]
      : [
          { label: "All Item Codes", value: "all" },
          ...Array.from(
            new Map(
              filteredSales.map((s) => [
                s.item_code,
                { label: `${s.item_code}`, value: s.item_code },
              ])
            ).values()
          ),
        ]
    : [];

  return (
    <div className="sales-report-page">
      <div className="sales-report-content">
        <div className="sales-report-form">
          <h2>Sales Report</h2>
          <label>Date Range</label>
          <div className="date-range">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, start: e.target.value })
              }
            />
            <span>TO</span>
            <input
              type="date"
              value={dateRange.end}
              disabled={!dateRange.start}
              onChange={(e) =>
                setDateRange({ ...dateRange, end: e.target.value })
              }
            />
          </div>

          <label>Customer</label>
          <div className="custom-react-select">
            <Select
              options={customerOptions}
              value={customer}
              onChange={setCustomer}
              placeholder="Select Customer"
              classNamePrefix="react-select"
              isDisabled={!dateRange.start}
            />
          </div>

          <label>Item Code</label>
          <div className="custom-react-select">
            <Select
              options={itemOptions}
              value={itemCode}
              isDisabled={!customer || !dateRange.start}
              onChange={setItemCode}
              placeholder="Select Item Code"
              classNamePrefix="react-select"
            />
          </div>

          <div className="report-buttons">
            <button
              className="pdf-btn"
              disabled={
                !dateRange.start || !dateRange.end || !customer || !itemCode
              }
              onClick={() => handleGenerateReport("pdf")}
            >
              Generate PDF
            </button>
            <button
              className="csv-btn"
              disabled={
                !dateRange.start || !dateRange.end || !customer || !itemCode
              }
              onClick={() => handleGenerateReport("csv")}
            >
              Generate CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
