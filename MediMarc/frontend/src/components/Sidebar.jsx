import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Sidebar.css";
import {
  FaUsers,
  FaBox,
  FaTags,
  FaShoppingCart,
  FaUserFriends,
  FaFile,
} from "react-icons/fa";
import { MdSpaceDashboard } from "react-icons/md";
import { HiMenuAlt2 } from "react-icons/hi";

const Sidebar = () => {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setLoggedInUser(JSON.parse(userData));
    }

    const handleResize = () => {
      setCollapsed(window.innerWidth <= 768); // Collapse on small screens
    };

    handleResize(); // Initial check
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  const toggleSidebar = () => setCollapsed((prev) => !prev);

  return (
    <nav className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <div className="logo">
          <img src="/logo.png" alt="Company Logo" />
        </div>
        <button className="sidebar-toggle" onClick={toggleSidebar}>
          <HiMenuAlt2 />
        </button>
      </div>

      <ul className="sidebar-menu">
        <li>
          <Link to="/home" title="Dashboard">
            <MdSpaceDashboard />
            {!collapsed && "Dashboard"}
          </Link>
        </li>
        <li>
          <Link to="/user-management" title="User Management">
            <FaUsers />
            {!collapsed && "User Management"}
          </Link>
        </li>
        <li>
          <Link to="/products" title="Product Management">
            <FaBox />
            {!collapsed && "Product Management"}
          </Link>
        </li>
        <li>
          <Link to="/customers" title="Customer Management">
            <FaUserFriends />
            {!collapsed && "Customer Management"}
          </Link>
        </li>
        <li>
          <Link to="/categories" title="Categories">
            <FaTags />
            {!collapsed && "Categories"}
          </Link>
        </li>
        <li>
          <Link to="/sales" title="Sales">
            <FaShoppingCart />
            {!collapsed && "Sales"}
          </Link>
        </li>
        <li>
          <Link to="/reports" title="Sales Report">
            <FaFile />
            {!collapsed && "Sales Report"}
          </Link>
        </li>
        <li>
          <Link to="/activity-logs" title="Activity Logs">
            <FaFile />
            {!collapsed && "Activity Logs"}
          </Link>
        </li>
      </ul>

      <div className="sidebar-footer">
        {!collapsed && (
          <p className="logged-in-user">
            Account: <strong>{loggedInUser?.username}</strong>
          </p>
        )}
        <button className="logout-btn" onClick={handleLogout}>
          {collapsed ? "⏻" : "Log Out"}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
