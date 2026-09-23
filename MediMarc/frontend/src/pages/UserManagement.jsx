import "primeicons/primeicons.css";
import { ConfirmDialog, confirmDialog } from "primereact/confirmdialog";
import "primereact/resources/primereact.min.css";
import "primereact/resources/themes/saga-blue/theme.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import "../styles/UserManagement.css";
import api from "../services/api";

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isAddUserPopupOpen, setIsAddUserPopupOpen] = useState(false);
  const [isEditUserPopupOpen, setIsEditUserPopupOpen] = useState(false);
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "USER",
  });

  const [editUser, setEditUser] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    userType: "USER",
  });

  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserId = loggedInUser?.id || "";
  const loggedInUserType = loggedInUser?.user_type_display;
  console.log(loggedInUserType);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users/");

      console.log("✅ Users fetched from API:", response.data);
      setUsers(response.data);
    } catch (error) {
      console.error(
        "❌ Error fetching users:",
        error.response?.data || error.message
      );
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewUser({ ...newUser, [name]: value });
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditUser({ ...editUser, [name]: value });
  };

  const [, setError] = useState("");
  const handleEditUser = async (e) => {
    e.preventDefault();

    if (!editUser.id) {
      toast.error("Invalid user ID.");
      return;
    }

    try {
      const response = await api.put(`/users/${editUser.id}/edit/`, {
        username: editUser.username,
        email: editUser.email,
        first_name: editUser.name.split(" ")[0] || "",
        last_name: editUser.name.split(" ")[1] || "",
        user_type: editUser.userType,
      });

      if (response.status === 200) {
        toast.success("User updated successfully!");

        // ✅ Get the updated user data from the response
        const updatedUser = response.data;

        // ✅ Update users state dynamically **without needing refresh**
        setUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === editUser.id ? { ...user, ...updatedUser } : user
          )
        );

        setIsEditUserPopupOpen(false); // ✅ Close the edit modal
      } else {
        toast.error("Failed to update user.");
      }
    } catch (error) {
      console.error(
        "Error updating user:",
        error.response?.data || error.message
      );
      toast.error("Failed to update user. Please try again.");
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError("");

    if (newUser.password !== newUser.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      const userData = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        first_name: newUser.name.split(" ")[0] || "",
        last_name: newUser.name.split(" ")[1] || "",
        user_type: newUser.userType,
      };

      const response = await api.post("/register/", userData);

      if (response.status === 201) {
        toast.success("✅ User created successfully!", {
          duration: 2000, // Auto-close after 2 seconds
        });
        setIsAddUserPopupOpen(false);

        // ✅ Update frontend immediately
        setUsers((prevUsers) => [...prevUsers, response.data.data]);

        setNewUser({
          name: "",
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
          userType: "USER",
        });
      } else {
        toast.error("Failed to add user.");
      }
    } catch (error) {
      console.error(
        "Error adding user:",
        error.response?.data || error.message
      );

      toast.error("Failed to add user. Please try again.", {
        duration: 1000, // Auto-close after 3 seconds
      });

      setError("Failed to add user.");
    }
  };

  const handleDeleteUser = async (userId, userType) => {
    console.log("Attempting to delete user:", userId);

    if (!userId) {
      toast.error("Error: Cannot delete user. User ID is missing.");
      return;
    }

    if (userId.toString() === loggedInUserId) {
      toast.error("You cannot delete your own account!");
      return;
    }

    if (loggedInUserType === "USER") {
      toast.error("You do not have permission to delete users.");
      return;
    }

    if (loggedInUserType === "ADMIN" && userType === "ADMIN") {
      toast.error("You cannot delete another admin.");
      return;
    }

    confirmDialog({
      message: "Are you sure you want to delete this user?",
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
          await api.delete(`/users/${userId}/delete/`);

          setUsers((prevUsers) =>
            prevUsers.filter((user) => user.id !== userId)
          );

          toast.success("User deleted successfully!", {
            duration: 2000,
          });
        } catch (error) {
          console.error(
            "Error deleting user:",
            error.response?.data || error.message
          );

          toast.error("Failed to delete user. Please try again.", {
            duration: 1000,
          });
        }
      },
      reject: () => {
        toast.info("Deletion cancelled.");
      },
    });
  };

  const openEditPopup = (user) => {
    if (loggedInUserType === "USER" && user.id !== loggedInUserId) {
      toast.error("You can only edit your own account.");
      return;
    }

    if (
      loggedInUserType === "ADMIN" &&
      user.user_type === "ADMIN" &&
      user.id !== loggedInUserId
    ) {
      toast.error("You cannot edit another admin.");
      return;
    }

    // ✅ Set user details in state before opening the modal
    setEditUser({
      id: user.id,
      name: `${user.first_name} ${user.last_name}`,
      username: user.username,
      email: user.email,
      userType: user.user_type,
    });

    setIsEditUserPopupOpen(true);
  };

  <ConfirmDialog />;

  return (
    <div className="user-management-container">
      <div className="user-management-content">
        {loggedInUserType &&
          (loggedInUserType === "SUPER ADMIN" ||
            loggedInUserType === "Admin") && (
            <div>
              <button
                className="user-management-add-btn"
                onClick={() => setIsAddUserPopupOpen(true)}
              >
                Add User
              </button>
            </div>
          )}

        <table className="user-management-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              {loggedInUserType === "SUPER ADMIN" && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => {
                const isCurrentUser = user.id === loggedInUserId;
                const isAdmin = user.user_type === "ADMIN";
                const isLoggedInAdmin = loggedInUserType === "ADMIN";

                return (
                  <tr key={user.id}>
                    <td>
                      {user.first_name} {user.last_name}
                    </td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td style={{ color: isAdmin ? "red" : "green" }}>
                      {user.user_type_display}
                    </td>
                    {loggedInUserType === "SUPER ADMIN" && (
                      <td style={{ width: 300 }}>
                        {/* ✏ Edit Button */}
                        <button
                          className="user-management-action-btn edit"
                          onClick={() => openEditPopup(user)}
                          disabled={
                            (!isCurrentUser && loggedInUserType === "USER") ||
                            (isLoggedInAdmin && isAdmin && !isCurrentUser)
                          }
                          style={{
                            cursor:
                              (!isCurrentUser && loggedInUserType === "USER") ||
                              (isLoggedInAdmin && isAdmin && !isCurrentUser)
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              (!isCurrentUser && loggedInUserType === "USER") ||
                              (isLoggedInAdmin && isAdmin && !isCurrentUser)
                                ? 0.5
                                : 1,
                          }}
                        >
                          ✏
                        </button>

                        {/* 🗑 Delete Button */}
                        <button
                          className="user-management-action-btn delete"
                          onClick={() =>
                            handleDeleteUser(user.id, user.user_type)
                          }
                          disabled={
                            (!isCurrentUser && loggedInUserType === "USER") ||
                            (isLoggedInAdmin && isAdmin && !isCurrentUser)
                          }
                          style={{
                            cursor:
                              (!isCurrentUser && loggedInUserType === "USER") ||
                              (isLoggedInAdmin && isAdmin && !isCurrentUser)
                                ? "not-allowed"
                                : "pointer",
                            opacity:
                              (!isCurrentUser && loggedInUserType === "USER") ||
                              (isLoggedInAdmin && isAdmin && !isCurrentUser)
                                ? 0.5
                                : 1,
                          }}
                        >
                          🗑
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="5">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Add User Popup */}
      {isAddUserPopupOpen && (
        <div
          className="user-management-popup-overlay"
          onClick={() => setIsAddUserPopupOpen(false)}
        >
          <div
            className="user-management-popup"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="popup-inner">
              <h2>New User</h2>
              <form onSubmit={handleAddUser}>
                <div className="user-management-form-group">
                  <input
                    type="text"
                    placeholder="Enter Full Name"
                    name="name"
                    value={newUser.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="user-management-form-group">
                  <input
                    type="text"
                    placeholder="Enter Username"
                    name="username"
                    value={newUser.username}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="user-management-form-group">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    name="email"
                    value={newUser.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="user-management-form-group">
                  <input
                    type="password"
                    placeholder="Enter Password"
                    name="password"
                    value={newUser.password}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="user-management-form-group">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    value={newUser.confirmPassword}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="user-management-form-group">
                  <select
                    name="userType"
                    value={newUser.userType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="USER">USER</option>
                  </select>
                </div>
                <div className="user-management-popup-buttons">
                  <button
                    type="button"
                    className="discard-btn"
                    onClick={() => setIsAddUserPopupOpen(false)}
                  >
                    Discard
                  </button>
                  <button type="submit" className="add-btn">
                    Add User
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ✅ Edit User Popup */}
      {isEditUserPopupOpen && (
        <div
          className="user-management-popup-overlay"
          onClick={() => setIsEditUserPopupOpen(false)}
        >
          <div
            className="user-management-popup"
            onClick={(e) => e.stopPropagation()} // ✅ Prevents click propagation
          >
            <div className="popup-inner">
              <h2>Edit User</h2>
              <form onSubmit={handleEditUser}>
                <input
                  type="text"
                  placeholder="Enter Full Name"
                  name="name"
                  value={editUser.name}
                  onChange={handleEditInputChange}
                  required
                />
                <input
                  type="text"
                  placeholder="Enter Username"
                  name="username"
                  value={editUser.username}
                  onChange={handleEditInputChange}
                  required
                />
                <input
                  type="email"
                  placeholder="Enter Email"
                  name="email"
                  value={editUser.email}
                  onChange={handleEditInputChange}
                  required
                />
                <select
                  name="userType"
                  value={editUser.userType}
                  onChange={handleEditInputChange}
                  required
                >
                  <option value="ADMIN">ADMIN</option>
                  <option value="USER">USER</option>
                </select>
                <div className="user-management-popup-buttons">
                  <button
                    type="button"
                    className="discard-btn"
                    onClick={() => setIsEditUserPopupOpen(false)}
                  >
                    Discard
                  </button>
                  <button type="submit" className="add-btn">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;
