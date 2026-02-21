import { useState, useEffect } from "react";
import { FiEdit, FiTrash2 } from "react-icons/fi";
import AddItem from "./AddItem";
import axios from "axios";

const LowSide = ({ base_api }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch all items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${base_api}/api/product/item/`,
        authHeaders()
      );
      const rows = Array.isArray(response.data)
        ? response.data
        : response.data?.results ?? [];
      setItems(rows);
    } catch (err) {
      console.error("Error fetching items:", err);
      alert("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  // Delete item
  const handleDelete = async (itemId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item? This action cannot be undone."
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${base_api}/api/product/item/${itemId}/`,
        authHeaders()
      );
      alert("Item deleted successfully!");
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(`Failed to delete item: ${err.response?.data?.detail || err.message}`);
    }
  };


  // Fetch items on component mount
  useEffect(() => {
    fetchItems();
  }, [base_api]);


  return (
    <div className="bg-white rounded-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Items List</h2>
          <p className="text-sm text-gray-500">{items.length} item(s) in inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
        >
          <span className="text-xl">+</span>
          Add Item
        </button>

      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-md text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-sm">SR.NO</th>
              <th className="px-6 py-3 text-sm">ITEM CODE</th>
              <th className="px-6 py-3 text-sm">MATERIAL</th>
              <th className="px-6 py-3 text-sm">ITEM TYPE</th>
              <th className="px-6 py-3 text-sm">FEATURE</th>
              <th className="px-6 py-3 text-sm">SIZE</th>
              <th className="px-6 py-3 text-sm">BRAND</th>
              <th className="px-6 py-3 text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="11" className="text-center py-8 text-gray-500">
                  Loading items...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="11" className="text-center py-8 text-gray-500">
                  No items found. Click "+ Add Item" to create one.
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm">{item.item_code || "—"}</td>
                  <td className="px-4 py-3 text-sm">{item.material_type_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{item.item_type_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{item.feature_type_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.size ? `${item.size} ${item.size_unit}` : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.brand_name || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2 justify-center">
                      {/* Edit Icon */}
                      <button
                        onClick={() => {
                          setSelectedItem(item);  // Store the item to edit
                          setShowEditModal(true);  // Open the modal
                        }}
                        className="text-blue-600 hover:text-blue-800"
                        title="Edit Item"
                      >

                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      {/* Delete Icon */}
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete Item"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))

            )}
          </tbody>

        </table>
      </div>

      {/* Add Item Modal */}
      <AddItem
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          fetchItems(); // Refresh list after adding
        }}
        base_api={base_api}
      />

      {/* Edit Item Modal */}
      <AddItem
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setSelectedItem(null);  // Clear selected item
          fetchItems(); // Refresh list after editing
        }}
        base_api={base_api}
        editMode={true}  // Tell modal it's in edit mode
        itemData={selectedItem}  // Pass the item to edit
      />

    </div>
  );
};

export default LowSide;
