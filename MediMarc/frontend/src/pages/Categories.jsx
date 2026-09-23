import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Categories.css";
import { toast } from "sonner";
import api from "../services/api";

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState("");
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [editCategory, setEditCategory] = useState({ id: null, name: "" });
  const loggedInUser = JSON.parse(localStorage.getItem("user"));
  const loggedInUserType = loggedInUser?.user_type_display;
  console.log(loggedInUserType);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/");
    }
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

  const handleAddCategory = async () => {
    if (newCategory.trim() === "") {
      toast.warning("Category name cannot be empty.", { duration: 2000 });
      return;
    }

    try {
      const response = await api.post("/categories/", {
        name: newCategory.trim(),
      });

      setCategories([...categories, response.data]); // Add the new category
      setNewCategory("");

      toast.success("Category added successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error adding category:",
        error.response?.data || error.message
      );
      toast.error("Failed to add category.", { duration: 2000 });
    }
  };

  const handleEditCategory = async () => {
    if (editCategory.name.trim() === "") {
      toast.warning("Category name cannot be empty.", { duration: 2000 });
      return;
    }

    try {
      const response = await api.put(`/categories/${editCategory.id}/`, {
        name: editCategory.name.trim(),
      });

      setCategories(
        categories.map((cat) =>
          cat.id === editCategory.id ? response.data : cat
        )
      );

      setIsEditPopupOpen(false);

      toast.success("Category updated successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error editing category:",
        error.response?.data || error.message
      );
      toast.error("Failed to update category.", { duration: 2000 });
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await api.delete(`/categories/${id}/`);
      setCategories(categories.filter((cat) => cat.id !== id));
      toast.success("Category deleted successfully!", { duration: 2000 });
    } catch (error) {
      console.error(
        "Error deleting category:",
        error.response?.data || error.message
      );
      toast.error("Failed to delete category.", { duration: 2000 });
    }
  };

  return (
    <div className="categories-page ">
      <main className="dashboard-content">
        <div className="category-container">
          {loggedInUserType &&
            (loggedInUserType === "SUPER ADMIN" ||
              loggedInUserType === "Admin") && (
              <div className="add-category">
                <h2>Add Category</h2>
                <input
                  type="text"
                  placeholder="Enter Category Name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <button className="confirm-btn" onClick={handleAddCategory}>
                  Confirm
                </button>
              </div>
            )}
          <div className="category-list">
            <h2>Categories</h2>
            <table>
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Category</th>
                  {loggedInUserType === "SUPER ADMIN" && <th>Actions</th>}
                </tr>
              </thead>
              <tbody className="category-list">
                {categories.map((category, index) => (
                  <tr key={category.id}>
                    <td>{index + 1}</td>
                    <td>{category.name}</td>
                    {loggedInUserType === "SUPER ADMIN" && (
                      <td>
                        <button
                          className="categories-action-btn"
                          style={{ color: "green" }}
                          onClick={() => {
                            setEditCategory(category);
                            setIsEditPopupOpen(true);
                          }}
                        >
                          ✏
                        </button>
                        <button
                          className="categories-action-btn"
                          onClick={() => handleDeleteCategory(category.id)}
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

      {isEditPopupOpen && (
        <div
          className="edit-popup-overlay"
          onClick={() => setIsEditPopupOpen(false)}
        >
          <div className="edit-popup" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Category</h2>
            <input
              type="text"
              value={editCategory.name}
              onChange={(e) =>
                setEditCategory({ ...editCategory, name: e.target.value })
              }
            />
            <div className="edit-popup-buttons">
              <button
                className="discard-btn"
                onClick={() => setIsEditPopupOpen(false)}
              >
                Discard
              </button>
              <button
                className="categories-confirm-btn"
                onClick={handleEditCategory}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
