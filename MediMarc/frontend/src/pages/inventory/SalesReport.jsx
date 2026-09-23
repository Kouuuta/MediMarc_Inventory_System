import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FileDownIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Combobox } from "@/components/common/Combobox";
import { PageHeader } from "@/components/layout/PageHeader";
import api from "@/lib/api";

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

  const ready = dateRange.start && dateRange.end && customer && itemCode;

  return (
    <>
      <PageHeader
        title="Sales Report"
        description="Generate PDF or CSV reports for a date range"
      />

      <Card>
        <CardContent className="grid gap-6 pt-6 lg:grid-cols-2">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Date Range</Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, start: e.target.value })
                  }
                />
                <span className="text-muted-foreground text-center text-sm font-medium">
                  TO
                </span>
                <Input
                  type="date"
                  value={dateRange.end}
                  disabled={!dateRange.start}
                  onChange={(e) =>
                    setDateRange({ ...dateRange, end: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Customer</Label>
              <Combobox
                options={customerOptions}
                value={customer?.value || ""}
                onChange={(value) => {
                  setCustomer(
                    customerOptions.find((o) => String(o.value) === String(value))
                  );
                  setItemCode(null);
                }}
                placeholder="Select Customer"
                searchPlaceholder="Search customer..."
                disabled={!dateRange.start}
              />
            </div>

            <div className="grid gap-2">
              <Label>Item Code</Label>
              <Combobox
                options={itemOptions}
                value={itemCode?.value || ""}
                onChange={(value) => {
                  setItemCode(
                    itemOptions.find((o) => String(o.value) === String(value))
                  );
                }}
                placeholder="Select Item Code"
                searchPlaceholder="Search item code..."
                disabled={!customer || !dateRange.start}
              />
            </div>
          </div>

          <div className="flex flex-col justify-end gap-3 lg:items-end">
            <Button
              className="w-full lg:w-48"
              disabled={!ready}
              onClick={() => handleGenerateReport("pdf")}
            >
              <FileTextIcon />
              Generate PDF
            </Button>
            <Button
              variant="outline"
              className="w-full lg:w-48"
              disabled={!ready}
              onClick={() => handleGenerateReport("csv")}
            >
              <FileDownIcon />
              Generate CSV
            </Button>
            {!ready && (
              <p className="text-muted-foreground max-w-xs text-xs">
                Fill in the date range, customer, and item code to generate a
                report.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default SalesReport;