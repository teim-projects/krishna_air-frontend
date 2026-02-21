import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { FiEdit, FiTrash2, FiPlus } from "react-icons/fi";
import axios from "axios";

const ManageItemTypes = ({ open, onClose, base_api }) => {

  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [classes, setClasses] = useState([]);

  // Pagination state for backend pagination
  const [materialPage, setMaterialPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const [featurePage, setFeaturePage] = useState(1);
  const [classPage, setClassPage] = useState(1);

  // Total counts from backend
  const [materialCount, setMaterialCount] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [featureCount, setFeatureCount] = useState(0);
  const [classCount, setClassCount] = useState(0);

  // Add input states for adding new items
  const [materialInput, setMaterialInput] = useState("");
  const [itemInput, setItemInput] = useState("");
  const [featureInput, setFeatureInput] = useState("");
  const [classInput, setClassInput] = useState("");

  // Add editing states
  const [editingMaterialId, setEditingMaterialId] = useState(null);
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingFeatureId, setEditingFeatureId] = useState(null);
  const [editingClassId, setEditingClassId] = useState(null);

  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch Material Types with pagination
  const fetchMaterialTypes = async (page = 1) => {
    try {
      const res = await axios.get(`${base_api}/api/product/material-type/?page=${page}`, authHeaders());
      setMaterialTypes(res.data.results || []);
      setMaterialCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching Material Types:", err);
    }
  };

  // Fetch Item Types with pagination
  const fetchItemTypes = async (page = 1) => {
    try {
      const res = await axios.get(`${base_api}/api/product/item-type/?page=${page}`, authHeaders());
      setItemTypes(res.data.results || []);
      setItemCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching Item Types:", err);
    }
  };

  // Fetch Feature Types with pagination
  const fetchFeatureTypes = async (page = 1) => {
    try {
      const res = await axios.get(`${base_api}/api/product/feature-type/?page=${page}`, authHeaders());
      setFeatureTypes(res.data.results || []);
      setFeatureCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching Feature Types:", err);
    }
  };

  // Fetch Classes with pagination
  const fetchClasses = async (page = 1) => {
    try {
      const res = await axios.get(`${base_api}/api/product/item-class/?page=${page}`, authHeaders());
      setClasses(res.data.results || []);
      setClassCount(res.data.count || 0);
    } catch (err) {
      console.error("Error fetching Classes:", err);
    }
  };


  // Add or Update Material Type
  const handleAddOrUpdateMaterial = async () => {
    if (!materialInput.trim()) return;

    try {
      if (editingMaterialId) {
        await axios.patch(
          `${base_api}/api/product/material-type/${editingMaterialId}/`,
          { name: materialInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/api/product/material-type/`,
          { name: materialInput },
          authHeaders()
        );
      }
      setMaterialInput("");
      setEditingMaterialId(null);
      fetchMaterialTypes(materialPage);
    } catch (err) {
      console.error("Error saving Material Type:", err);
    }
  };

  // Add or Update Item Type
  const handleAddOrUpdateItem = async () => {
    if (!itemInput.trim()) return;

    try {
      if (editingItemId) {
        await axios.patch(
          `${base_api}/api/product/item-type/${editingItemId}/`,
          { name: itemInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/api/product/item-type/`,
          { name: itemInput },
          authHeaders()
        );
      }
      setItemInput("");
      setEditingItemId(null);
      fetchItemTypes(itemPage);
    } catch (err) {
      console.error("Error saving Item Type:", err);
    }
  };

  // Add or Update Feature Type
  const handleAddOrUpdateFeature = async () => {
    if (!featureInput.trim()) return;

    try {
      if (editingFeatureId) {
        await axios.patch(
          `${base_api}/api/product/feature-type/${editingFeatureId}/`,
          { name: featureInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/api/product/feature-type/`,
          { name: featureInput },
          authHeaders()
        );
      }
      setFeatureInput("");
      setEditingFeatureId(null);
      fetchFeatureTypes(featurePage);
    } catch (err) {
      console.error("Error saving Feature Type:", err);
    }
  };

  // Add or Update Class
  const handleAddOrUpdateClass = async () => {
    if (!classInput.trim()) return;

    try {
      if (editingClassId) {
        await axios.patch(
          `${base_api}/api/product/item-class/${editingClassId}/`,
          { name: classInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/api/product/item-class/`,
          { name: classInput },
          authHeaders()
        );
      }
      setClassInput("");
      setEditingClassId(null);
      fetchClasses(classPage);
    } catch (err) {
      console.error("Error saving Class:", err);
    }
  };


  const handleEditMaterial = (item) => {
    setMaterialInput(item.name);
    setEditingMaterialId(item.id);
  };

  const handleEditItem = (item) => {
    setItemInput(item.name);
    setEditingItemId(item.id);
  };

  const handleEditFeature = (item) => {
    setFeatureInput(item.name);
    setEditingFeatureId(item.id);
  };

  const handleEditClass = (item) => {
    setClassInput(item.name);
    setEditingClassId(item.id);
  };


  const handleDeleteMaterial = async (id) => {
    if (!window.confirm("Delete this Material Type?")) return;
    try {
      await axios.delete(`${base_api}/api/product/material-type/${id}/`, authHeaders());
      fetchMaterialTypes(materialPage);
    } catch (err) {
      console.error("Error deleting Material Type:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this Item Type?")) return;
    try {
      await axios.delete(`${base_api}/api/product/item-type/${id}/`, authHeaders());
      fetchItemTypes(itemPage);
    } catch (err) {
      console.error("Error deleting Item Type:", err);
    }
  };

  const handleDeleteFeature = async (id) => {
    if (!window.confirm("Delete this Feature Type?")) return;
    try {
      await axios.delete(`${base_api}/api/product/feature-type/${id}/`, authHeaders());
      fetchFeatureTypes(featurePage);
    } catch (err) {
      console.error("Error deleting Feature Type:", err);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Delete this Class?")) return;
    try {
      await axios.delete(`${base_api}/api/product/item-class/${id}/`, authHeaders());
      fetchClasses(classPage);
    } catch (err) {
      console.error("Error deleting Class:", err);
    }
  };


  useEffect(() => {
    if (!open) return;

    fetchMaterialTypes(materialPage);
    fetchItemTypes(itemPage);
    fetchFeatureTypes(featurePage);
    fetchClasses(classPage);
  }, [open, base_api]);

  // Fetch data when page changes
  useEffect(() => {
    if (!open) return;
    fetchMaterialTypes(materialPage);
  }, [materialPage]);

  useEffect(() => {
    if (!open) return;
    fetchItemTypes(itemPage);
  }, [itemPage]);

  useEffect(() => {
    if (!open) return;
    fetchFeatureTypes(featurePage);
  }, [featurePage]);

  useEffect(() => {
    if (!open) return;
    fetchClasses(classPage);
  }, [classPage]);


  // Backend pagination - 10 items per page
  const itemsPerPage = 10;

  if (!open) return null;

  const PaginationControls = ({ page, setPage, total }) => {
    const totalPages = Math.ceil(total / itemsPerPage);
    
    return (
      <div className="flex justify-between items-center mt-3">
        <span className="text-sm text-gray-600">
          Page {page} of {totalPages} ({total} total items)
        </span>
        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 flex items-center"
          >
            &lt;
          </button>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 flex items-center"
          >
            &gt;
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-start sm:items-center p-6 z-[60] mt-15">
      <div className="relative w-full max-w-4xl bg-white rounded-md shadow-lg max-h-[90vh] flex flex-col">

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-xl text-gray-500 hover:text-black z-10"
        >
          <RxCross2 />
        </button>

        <h1 className="text-2xl font-bold pt-6 px-6 mb-1">
          Manage Item Types
        </h1>
        <p className="text-sm text-gray-500 pb-4 px-6">
          Add, Edit, and Delete Item Type Options
        </p>

        <div className="overflow-y-auto px-6 pb-6 space-y-8">

          {/* SECTION 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Material Types */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Material Types</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter material type"
                  value={materialInput}
                  onChange={(e) => setMaterialInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddOrUpdateMaterial}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  <FiPlus />
                </button>

              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">MATERIAL TYPE</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialTypes.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-x-4">
                            <FiEdit
                              onClick={() => handleEditMaterial(item)}
                              className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                            />
                            <FiTrash2
                              onClick={() => handleDeleteMaterial(item.id)}
                              className="text-red-600 cursor-pointer hover:text-red-700"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={materialPage}
                setPage={setMaterialPage}
                total={materialCount}
              />
            </div>

            {/* Item Types */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Item Types</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter item type"
                  value={itemInput}
                  onChange={(e) => setItemInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddOrUpdateItem}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  <FiPlus />
                </button>

              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">ITEM TYPE</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {itemTypes.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-x-4">
                            <FiEdit
                              onClick={() => handleEditItem(item)}
                              className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                            />
                            <FiTrash2
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-600 cursor-pointer hover:text-red-700"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={itemPage}
                setPage={setItemPage}
                total={itemCount}
              />
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* Feature Types */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Feature Types</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter feature type"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddOrUpdateFeature}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  <FiPlus />
                </button>

              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">FEATURE TYPE</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {featureTypes.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-x-4">
                            <FiEdit
                              onClick={() => handleEditFeature(item)}
                              className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                            />
                            <FiTrash2
                              onClick={() => handleDeleteFeature(item.id)}
                              className="text-red-600 cursor-pointer hover:text-red-700"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={featurePage}
                setPage={setFeaturePage}
                total={featureCount}
              />
            </div>

            {/* Classes */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-700">Classes</h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Enter class"
                  value={classInput}
                  onChange={(e) => setClassInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddOrUpdateClass}
                  className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                >
                  <FiPlus />
                </button>

              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left">CLASS</th>
                      <th className="px-4 py-3 text-right">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classes.map((item, index) => (
                      <tr key={item.id} className="border-b border-gray-200">
                        <td className="px-4 py-3">{item.name}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-x-4">
                            <FiEdit
                              onClick={() => handleEditClass(item)}
                              className="text-yellow-600 cursor-pointer hover:text-yellow-700"
                            />
                            <FiTrash2
                              onClick={() => handleDeleteClass(item.id)}
                              className="text-red-600 cursor-pointer hover:text-red-700"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}

                  </tbody>
                </table>
              </div>

              <PaginationControls
                page={classPage}
                setPage={setClassPage}
                total={classCount}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageItemTypes;
