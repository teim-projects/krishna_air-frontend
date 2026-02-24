import { useState, useEffect } from "react";
import { RxCross2 } from "react-icons/rx";
import { FiEdit, FiTrash2, FiPlus, FiSearch } from "react-icons/fi";
import axios from "axios";

const ManageItemTypes = ({ open, onClose, base_api }) => {

  const [materialTypes, setMaterialTypes] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [featureTypes, setFeatureTypes] = useState([]);
  const [classes, setClasses] = useState([]);

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

  // Button mode states for smart add/search functionality
  const [materialButtonMode, setMaterialButtonMode] = useState('idle'); // 'idle', 'search', 'add'
  const [itemButtonMode, setItemButtonMode] = useState('idle');
  const [featureButtonMode, setFeatureButtonMode] = useState('idle');
  const [classButtonMode, setClassButtonMode] = useState('idle');

  // Search term states for filtering
  const [materialSearchTerm, setMaterialSearchTerm] = useState('');
  const [itemSearchTerm, setItemSearchTerm] = useState('');
  const [featureSearchTerm, setFeatureSearchTerm] = useState('');
  const [classSearchTerm, setClassSearchTerm] = useState('');


  const authHeaders = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
  });

  // Fetch Material Types
  const fetchMaterialTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/material-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setMaterialTypes(rows);
    } catch (err) {
      console.error("Error fetching Material Types:", err);
    }
  };

  // Fetch Item Types
  const fetchItemTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/item-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setItemTypes(rows);
    } catch (err) {
      console.error("Error fetching Item Types:", err);
    }
  };

  // Fetch Feature Types
  const fetchFeatureTypes = async () => {
    try {
      const res = await axios.get(`${base_api}/product/feature-type/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setFeatureTypes(rows);
    } catch (err) {
      console.error("Error fetching Feature Types:", err);
    }
  };

  // Fetch Classes
  const fetchClasses = async () => {
    try {
      const res = await axios.get(`${base_api}/product/item-class/`, authHeaders());
      const rows = Array.isArray(res.data) ? res.data : res.data?.results ?? [];
      setClasses(rows);
    } catch (err) {
      console.error("Error fetching Classes:", err);
    }
  };


  // Add or Update or Search Material Type
  const handleAddOrUpdateMaterial = async () => {
    if (!materialInput.trim()) return;

    // SEARCH MODE: If item exists, filter the table
    if (materialButtonMode === 'search') {
      setMaterialSearchTerm(materialInput.trim());
      return;
    }

    // ADD/UPDATE MODE: Create or update item
    try {
      if (editingMaterialId) {
        await axios.patch(
          `${base_api}/product/material-type/${editingMaterialId}/`,
          { name: materialInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/product/material-type/`,
          { name: materialInput },
          authHeaders()
        );
      }
      setMaterialInput("");
      setEditingMaterialId(null);
      setMaterialSearchTerm(''); // Clear search when adding
      fetchMaterialTypes(materialPage);
    } catch (err) {
      console.error("Error saving Material Type:", err);
    }
  };


  // Add or Update or Search Item Type
  const handleAddOrUpdateItem = async () => {
    if (!itemInput.trim()) return;

    // SEARCH MODE
    if (itemButtonMode === 'search') {
      setItemSearchTerm(itemInput.trim());
      return;
    }

    // ADD/UPDATE MODE
    try {
      if (editingItemId) {
        await axios.patch(
          `${base_api}/product/item-type/${editingItemId}/`,
          { name: itemInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/product/item-type/`,
          { name: itemInput },
          authHeaders()
        );
      }
      setItemInput("");
      setEditingItemId(null);
      setItemSearchTerm('');
      fetchItemTypes(itemPage);
    } catch (err) {
      console.error("Error saving Item Type:", err);
    }
  };


  // Add or Update or Search Feature Type
  const handleAddOrUpdateFeature = async () => {
    if (!featureInput.trim()) return;

    // SEARCH MODE
    if (featureButtonMode === 'search') {
      setFeatureSearchTerm(featureInput.trim());
      return;
    }

    // ADD/UPDATE MODE
    try {
      if (editingFeatureId) {
        await axios.patch(
          `${base_api}/product/feature-type/${editingFeatureId}/`,
          { name: featureInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/product/feature-type/`,
          { name: featureInput },
          authHeaders()
        );
      }
      setFeatureInput("");
      setEditingFeatureId(null);
      setFeatureSearchTerm('');
      fetchFeatureTypes(featurePage);
    } catch (err) {
      console.error("Error saving Feature Type:", err);
    }
  };


  // Add or Update or Search Class
  const handleAddOrUpdateClass = async () => {
    if (!classInput.trim()) return;

    // SEARCH MODE
    if (classButtonMode === 'search') {
      setClassSearchTerm(classInput.trim());
      return;
    }

    // ADD/UPDATE MODE
    try {
      if (editingClassId) {
        await axios.patch(
          `${base_api}/product/item-class/${editingClassId}/`,
          { name: classInput },
          authHeaders()
        );
      } else {
        await axios.post(
          `${base_api}/product/item-class/`,
          { name: classInput },
          authHeaders()
        );
      }
      setClassInput("");
      setEditingClassId(null);
      setClassSearchTerm('');
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
      await axios.delete(`${base_api}/product/material-type/${id}/`, authHeaders());
      fetchMaterialTypes();
    } catch (err) {
      console.error("Error deleting Material Type:", err);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm("Delete this Item Type?")) return;
    try {
      await axios.delete(`${base_api}/product/item-type/${id}/`, authHeaders());
      fetchItemTypes();
    } catch (err) {
      console.error("Error deleting Item Type:", err);
    }
  };

  const handleDeleteFeature = async (id) => {
    if (!window.confirm("Delete this Feature Type?")) return;
    try {
      await axios.delete(`${base_api}/product/feature-type/${id}/`, authHeaders());
      fetchFeatureTypes();
    } catch (err) {
      console.error("Error deleting Feature Type:", err);
    }
  };

  const handleDeleteClass = async (id) => {
    if (!window.confirm("Delete this Class?")) return;
    try {
      await axios.delete(`${base_api}/product/item-class/${id}/`, authHeaders());
      fetchClasses();
    } catch (err) {
      console.error("Error deleting Class:", err);
    }
  };

  // Filter tables based on search terms
  const filteredMaterialTypes = materialSearchTerm
    ? materialTypes.filter(m =>
      m.name.toLowerCase().includes(materialSearchTerm.toLowerCase())
    )
    : materialTypes;

  const filteredItemTypes = itemSearchTerm
    ? itemTypes.filter(i =>
      i.name.toLowerCase().includes(itemSearchTerm.toLowerCase())
    )
    : itemTypes;

  const filteredFeatureTypes = featureSearchTerm
    ? featureTypes.filter(f =>
      f.name.toLowerCase().includes(featureSearchTerm.toLowerCase())
    )
    : featureTypes;

  const filteredClasses = classSearchTerm
    ? classes.filter(c =>
      c.name.toLowerCase().includes(classSearchTerm.toLowerCase())
    )
    : classes;



  useEffect(() => {
    if (!open) return;

    fetchMaterialTypes();
    fetchItemTypes();
    fetchFeatureTypes();
    fetchClasses();
  }, [open, base_api]);


  // Detect if Material Type input matches existing item
  useEffect(() => {
    if (!materialInput.trim()) {
      setMaterialButtonMode('idle');
      setMaterialSearchTerm('');
      return;
    }

    const exactMatch = materialTypes.some(
      m => m.name.toLowerCase() === materialInput.trim().toLowerCase()
    );

    setMaterialButtonMode(exactMatch ? 'search' : 'add');
  }, [materialInput, materialTypes]);

  // Detect if Item Type input matches existing item
  useEffect(() => {
    if (!itemInput.trim()) {
      setItemButtonMode('idle');
      setItemSearchTerm('');
      return;
    }

    const exactMatch = itemTypes.some(
      i => i.name.toLowerCase() === itemInput.trim().toLowerCase()
    );

    setItemButtonMode(exactMatch ? 'search' : 'add');
  }, [itemInput, itemTypes]);

  // Detect if Feature Type input matches existing item
  useEffect(() => {
    if (!featureInput.trim()) {
      setFeatureButtonMode('idle');
      setFeatureSearchTerm('');
      return;
    }

    const exactMatch = featureTypes.some(
      f => f.name.toLowerCase() === featureInput.trim().toLowerCase()
    );

    setFeatureButtonMode(exactMatch ? 'search' : 'add');
  }, [featureInput, featureTypes]);

  // Detect if Class input matches existing item
  useEffect(() => {
    if (!classInput.trim()) {
      setClassButtonMode('idle');
      setClassSearchTerm('');
      return;
    }

    const exactMatch = classes.some(
      c => c.name.toLowerCase() === classInput.trim().toLowerCase()
    );

    setClassButtonMode(exactMatch ? 'search' : 'add');
  }, [classInput, classes]);


  // Pagination State
  const [materialPage, setMaterialPage] = useState(1);
  const [itemPage, setItemPage] = useState(1);
  const [featurePage, setFeaturePage] = useState(1);
  const [classPage, setClassPage] = useState(1);

  const itemsPerPage = 5;

  if (!open) return null;

  const paginate = (data, page) =>
    data.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  const PaginationControls = ({ page, setPage, total }) => (
    <div className="flex justify-end gap-2 mt-3">
      <button
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
        className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 flex items-center"
      >
        &lt;
      </button>
      <button
        disabled={page * itemsPerPage >= total}
        onClick={() => setPage(page + 1)}
        className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-100 flex items-center"
      >
        &gt;
      </button>
    </div>
  );

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
                  className={`flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-all ${materialButtonMode === 'search'
                    ? 'bg-blue-600 text-white'
                    : 'bg-black text-white'
                    }`}
                  title={
                    materialButtonMode === 'idle'
                      ? 'Type to add or search'
                      : materialButtonMode === 'search'
                        ? `Found! Click to filter "${materialInput}"`
                        : `Click to add "${materialInput}"`
                  }
                >
                  {materialButtonMode === 'search' ? (
                    <>
                      <FiSearch /> 
                    </>
                  ) : (
                    <>
                      <FiPlus /> {editingMaterialId ? 'Update' : materialButtonMode === 'idle' ? 'Add' : 'Add New'}
                    </>
                  )}
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
                    {paginate(filteredMaterialTypes, materialPage).map((item, index) => (
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
                total={materialTypes.length}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-all ${itemButtonMode === 'search' ? 'bg-blue-600 text-white' : 'bg-black text-white'
                    }`}
                  title={
                    itemButtonMode === 'idle' ? 'Type to add or search'
                      : itemButtonMode === 'search' ? `Found! Click to filter "${itemInput}"`
                        : `Click to add "${itemInput}"`
                  }
                >
                  {itemButtonMode === 'search' ? (
                    <>
                      <FiSearch /> 
                    </>
                  ) : (
                    <><FiPlus /> {editingItemId ? 'Update' : itemButtonMode === 'idle' ? 'Add' : 'Add New'}</>
                  )}
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
                    {paginate(filteredItemTypes, itemPage).map((item, index) => (
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
                total={itemTypes.length}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-all ${featureButtonMode === 'search' ? 'bg-blue-600 text-white' : 'bg-black text-white'
                    }`}
                  title={
                    featureButtonMode === 'idle' ? 'Type to add or search'
                      : featureButtonMode === 'search' ? `Found! Click to filter "${featureInput}"`
                        : `Click to add "${featureInput}"`
                  }
                >
                  {featureButtonMode === 'search' ? (
                    <>
                    <FiSearch />
                    </>
                  ) : (
                    <><FiPlus /> {editingFeatureId ? 'Update' : featureButtonMode === 'idle' ? 'Add' : 'Add New'}</>
                  )}
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
                    {paginate(filteredFeatureTypes, featurePage).map((item, index) => (
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
                total={featureTypes.length}
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
                  className={`flex items-center gap-2 px-4 py-2 rounded hover:opacity-90 transition-all ${classButtonMode === 'search' ? 'bg-blue-600 text-white' : 'bg-black text-white'
                    }`}
                  title={
                    classButtonMode === 'idle' ? 'Type to add or search'
                      : classButtonMode === 'search' ? `Found! Click to filter "${classInput}"`
                        : `Click to add "${classInput}"`
                  }
                >
                  {classButtonMode === 'search' ? (
                    <>
                    <FiSearch />
                    </>
                  ) : (
                    <><FiPlus /> {editingClassId ? 'Update' : classButtonMode === 'idle' ? 'Add' : 'Add New'}</>
                  )}
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
                    {paginate(filteredClasses, classPage).map((item, index) => (
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
                total={classes.length}
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
