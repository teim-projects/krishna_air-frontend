import { useState, useEffect } from "react";
import AddItem from "./AddItem";
import axios from "axios";
import Pagination from "../Pagination";
import AcMaterials from "./AcMaterials";
import AddServiceModal from "./AddServiceModal";
import ServiceSelectionEngine from "./ServiceSelectionEngine";
import { useDocPermissions } from "../../hooks/useAuth";


// Filter configuration for Low Side (using dropdowns)
export const getLowSideFiltersConfig = (materialTypes = [], itemTypes = [], featureTypes = [], classes = []) => [
  {
    key: "material_type_id",
    type: "select",
    label: "Material Type",
    placeholder: "Select Material Type",
    options: materialTypes.map(m => ({ value: m.id, label: m.name }))
  },
  {
    key: "item_type_id",
    type: "select",
    label: "Item Type",
    placeholder: "Select Item Type",
    options: itemTypes.map(i => ({ value: i.id, label: i.name }))
  },
  {
    key: "feature_type_id",
    type: "select",
    label: "Feature Type",
    placeholder: "Select Feature Type",
    options: featureTypes.map(f => ({ value: f.id, label: f.name }))
  },
  {
    key: "item_class_id",
    type: "select",
    label: "Class",
    placeholder: "Select Class",
    options: classes.map(c => ({ value: c.id, label: c.name }))
  },
  { key: "search", label: "Item Code", type: "search", placeholder: "Search Item Code" },
];

const LowSide = ({ base_api, filters }) => {
  const { canCreate, canEdit, canDelete } = useDocPermissions('Low Side');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showAcMaterialModal, setShowAcMaterialModal] = useState(false);

  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [showSetServicesModal, setShowSetServicesModal] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  // ← ADD THESE PAGINATION STATES
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const PAGE_SIZE = 10;  // Items per page


  // Auth headers
  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch items with pagination
  const fetchItems = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${base_api}/product/item/?page=${page}`,
        authHeaders()
      );

      // Handle paginated response
      const data = response.data;
      const rows = data?.results ?? [];

      setItems(rows);

      // Calculate pagination
      const count = data?.count ?? rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Ensure current page doesn't exceed total pages
      if (page > calculatedPages && calculatedPages > 0) {
        setCurrentPage(calculatedPages);
      } else {
        setCurrentPage(page);
      }

    } catch (err) {
      console.error("Error fetching items:", err);
      alert("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  // Add these handlers
  const handleServiceAdd = (services) => {
    // Handle the added services
    console.log("Added services:", services);
    // You can add them to your quotation data here
  };

  const handleServiceSelection = (data) => {
    setSelectedServices(data.services || []);
  };

  // Filter items with pagination
  const filterItems = async (filters = {}, page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", page);

      // Add filter parameters
      if (filters.material_type_id) params.set("material_type_id", filters.material_type_id);
      if (filters.item_type_id) params.set("item_type_id", filters.item_type_id);
      if (filters.feature_type_id) params.set("feature_type_id", filters.feature_type_id);
      if (filters.item_class_id) params.set("item_class_id", filters.item_class_id);
      if (filters.search && filters.search.trim()) params.set("search", filters.search);

      const url = `${base_api}/product/item/?${params.toString()}`;
      console.log("🔎 Filter URL:", url);

      const response = await axios.get(url, authHeaders());

      const data = response.data;
      const rows = data?.results ?? [];

      setItems(rows);

      const count = data?.count ?? rows.length;
      const calculatedPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

      setTotalCount(count);
      setTotalPages(calculatedPages);

      // Ensure current page doesn't exceed total pages
      if (page > calculatedPages && calculatedPages > 0) {
        setCurrentPage(calculatedPages);
      } else {
        setCurrentPage(page);
      }

    } catch (err) {
      console.error("Error filtering items:", err);
      alert("Failed to filter items");
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
        `${base_api}/product/item/${itemId}/`,
        authHeaders()
      );
      alert("Item deleted successfully!");
      fetchItems(); // Refresh the list
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(`Failed to delete item: ${err.response?.data?.detail || err.message}`);
    }
  };


  // Fetch items on mount and when filters change
  useEffect(() => {
    const hasAnyFilter = filters && Object.values(filters).some(
      v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
    );

    if (hasAnyFilter) {
      filterItems(filters, 1);  // Reset to page 1 when filters change
    } else {
      fetchItems(1);  // Reset to page 1 when no filters
    }
  }, [base_api, filters]);



  return (
    <div className="bg-white rounded-lg p-4">
      {/* Header */}
      {/* <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Items List</h2>
          <p className="text-sm text-gray-500">{totalCount} item(s) in inventory</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          <span className="text-xl">+</span>
          Add Item
        </button>
      </div> */}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold">Items List</h2>
          <p className="text-sm text-gray-500">{totalCount} item(s) in inventory</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
          {canCreate && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full sm:w-auto text-center font-medium"
            >
              <span className="text-xl">+</span>
              Add Item
            </button>
          )}

          {/* NEW: Set AC Materials Button */}
          {canEdit && (
            <button
              onClick={() => setShowAcMaterialModal(true)}
              className="flex items-center justify-center gap-2 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 w-full sm:w-auto text-center font-medium"
            >
              ⚙️ Set AC Materials
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-x-auto">
        <table className="w-full min-w-[800px] text-md text-left">
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
                  <td className="px-4 py-3 text-sm">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
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
                      {canEdit && (
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
                      )}

                      {/* Delete Icon */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete Item"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))

            )}
          </tbody>

        </table>

        {/* ← ADD PAGINATION HERE */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          onPageChange={(newPage) => {
            // Safeguard: Don't allow navigation beyond total pages
            if (newPage < 1 || newPage > totalPages) {
              console.warn(`Invalid page ${newPage}. Total pages: ${totalPages}`);
              return;
            }

            // Check if filters are active
            const hasAnyFilter = filters && Object.values(filters).some(
              v => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0)
            );

            // Call appropriate function
            hasAnyFilter ? filterItems(filters, newPage) : fetchItems(newPage);
          }}
        />

      </div>

      <AcMaterials
        open={showAcMaterialModal}
        onClose={() => setShowAcMaterialModal(false)}
        base_api={base_api}
      />
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
