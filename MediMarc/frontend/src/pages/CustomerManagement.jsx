import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/CustomerManagement.css";
import { toast } from "sonner";
import { confirmDialog } from "primereact/confirmdialog";
import api from "../services/api";

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

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  console.log(loggedInUserType);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/"); // Redirect to login if no token found
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

      toast.success("✅ Customer added successfully!", { duration: 2000 });
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

  const handleDeleteCustomer = (id) => {
    confirmDialog({
      message: "Are you sure you want to delete this customer?",
      header: "Confirm Deletion",
      icon: "pi pi-exclamation-triangle",
      acceptClassName: "custom-delete-accept-btn",
      rejectClassName: "custom-delete-cancel-btn",
      className: "custom-delete-dialog",
      closable: false,
      acceptLabel: "Yes, Delete",
      rejectLabel: "Cancel",
      accept: async () => {
        try {
          await api.delete(`/customers/${id}/`);

          setCustomers((prevCustomers) =>
            prevCustomers.filter((cust) => cust.id !== id)
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
        }
      },
      reject: () => {
        toast.info("Deletion cancelled.");
      },
    });
  };

  return (
    <div className="customer-management-page">
      <main className="dashboard-content">
        {loggedInUserType &&
          (loggedInUserType === "SUPER ADMIN" ||
            loggedInUserType === "Admin") && (
            <div className="add-customer">
              <h2>Add Customer</h2>

              <input
                type="text"
                placeholder="Enter Customer Name"
                value={newCustomer.name}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Enter Address Name"
                value={newCustomer.address}
                onChange={(e) =>
                  setNewCustomer({ ...newCustomer, address: e.target.value })
                }
              />
              <button className="confirm-btn" onClick={handleAddCustomer}>
                Confirm
              </button>
            </div>
          )}
        <div className="customer-list">
          <h2>Customers</h2>
          <table>
            <thead>
              <tr>
                <th>No.</th>
                <th>Customers</th>
                <th>Address</th>
                {loggedInUserType === "SUPER ADMIN" && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer.id}>
                  <td>{index + 1}</td>
                  <td>{customer.name}</td>
                  <td>{customer.address}</td>
                  {loggedInUserType === "SUPER ADMIN" && (
                    <td>
                      <button
                        className="customer-management-page edit-btn"
                        onClick={() => openEditPopup(customer)}
                      >
                        ✏
                      </button>
                      <button
                        className="customer-management-page delete-btn"
                        onClick={() => handleDeleteCustomer(customer.id)}
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
      </main>

      {isEditPopupOpen && (
        <div
          className="edit-popup-overlay"
          onClick={() => setIsEditPopupOpen(false)}
        >
          <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Customer</h2>
            <input
              type="text"
              value={editCustomer.name}
              onChange={(e) =>
                setEditCustomer({ ...editCustomer, name: e.target.value })
              }
              placeholder="Edit Customer Name"
            />
            <input
              type="text"
              value={editCustomer.address}
              onChange={(e) =>
                setEditCustomer({ ...editCustomer, address: e.target.value })
              }
              placeholder="Edit Address"
            />
            <div className="popup-buttons">
              <button
                className="discard-btn"
                onClick={() => setIsEditPopupOpen(false)}
              >
                Discard
              </button>
              <button className="confirm-btn" onClick={handleEditCustomer}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
