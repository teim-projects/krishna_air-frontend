import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const emptyForm = {
  material_issue: "",
  dispatch_date: new Date().toISOString().split("T")[0],
  destination_type: "",
  delivery_destination: "",
  delivery_partner_name: "",
  delivery_person_name: "",
  delivery_person_phone: "",
  delivery_remark: "",
  items: [],
};

const inputClass =
  "w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-800";
const labelClass = "block text-sm font-medium text-gray-700 mb-2";

export default function DeliveryChallanForm({
  open,
  onClose,
  onSuccess,
  base_api,
  dc = null,
}) {
  const BASE_API = base_api;

  const [formData, setFormData] = useState(emptyForm);
  const [materialIssues, setMaterialIssues] = useState([]);
  const [issueItems, setIssueItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const token = useMemo(
    () =>
      localStorage.getItem("access") ||
      localStorage.getItem("access_token") ||
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      "",
    []
  );

  const headers = useMemo(
    () => ({
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    }),
    [token]
  );

  const destinationOptions =
    formData.destination_type === "branch"
      ? branches
      : formData.destination_type === "site"
        ? sites
        : [];

  const destinationLabel =
    formData.destination_type === "branch"
      ? branches.find((b) => String(b.id) === String(formData.delivery_destination))?.name
      : formData.destination_type === "site"
        ? sites.find((s) => String(s.id) === String(formData.delivery_destination))?.name
        : "";

  useEffect(() => {
    if (!open) return;
    setStep(1);
    fetchMaterialIssues();
    fetchBranches();
    fetchSites();
    if (dc) {
      loadDcData();
    } else {
      setFormData({
        ...emptyForm,
        dispatch_date: new Date().toISOString().split("T")[0],
      });
      setIssueItems([]);
    }
  }, [open, dc]);

  const normalizeList = (data) => {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  };

  const fetchMaterialIssues = async () => {
    try {
      const res = await axios.get(`${BASE_API}/inventory/material-issue/?all=true`, { headers });
      setMaterialIssues(normalizeList(res.data));
    } catch (err) {
      setMaterialIssues([]);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${BASE_API}/auth/branch/?all=true`, { headers });
      setBranches(normalizeList(res.data));
    } catch (err) {
      setBranches([]);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await axios.get(`${BASE_API}/auth/site/?all=true`, { headers });
      setSites(normalizeList(res.data));
    } catch (err) {
      setSites([]);
    }
  };

  const mapIssueItems = (items, existingItems = []) =>
    items.map((item, index) => ({
      material_issue_item: item.id,
      quantity: existingItems[index]?.quantity || 0,
      item_name:
        item.display_name ||
        item.product_name ||
        item.item_name ||
        item.name ||
        "Unknown",
      unit: item.uom || item.unit || "Nos",
      max_quantity: item.quantity || item.issued_quantity || 0,
    }));

  const loadDcData = async () => {
    if (!dc) return;
    const destinationType = dc.destination_type || "";
    const deliveryDestination =
      destinationType === "branch"
        ? dc.branch || ""
        : destinationType === "site"
          ? dc.site || ""
          : "";

    setFormData({
      material_issue: dc.material_issue_details?.id || dc.material_issue || "",
      dispatch_date: dc.dispatch_date || new Date().toISOString().split("T")[0],
      destination_type: destinationType,
      delivery_destination: deliveryDestination ? String(deliveryDestination) : "",
      delivery_partner_name: dc.delivery_partner_name || "",
      delivery_person_name: dc.delivery_person_name || "",
      delivery_person_phone: dc.delivery_person_phone || "",
      delivery_remark: dc.delivery_remark || "",
      items: [],
    });

    const issueId = dc.material_issue_details?.id || dc.material_issue;
    if (issueId) await fetchIssueItems(issueId, dc.items || []);
  };

  const fetchIssueItems = async (issueId, existingItems = []) => {
    try {
      const res = await axios.get(`${BASE_API}/inventory/material-issue/${issueId}/`, {
        headers,
      });
      const items =
        res.data.items ||
        res.data.material_issue_items ||
        res.data.item_details ||
        [];
      setIssueItems(items);
      setFormData((prev) => ({
        ...prev,
        items: mapIssueItems(items, existingItems),
      }));
    } catch (err) {
      setIssueItems([]);
    }
  };

  const handleIssueChange = async (issueId) => {
    if (!issueId) {
      setFormData((prev) => ({ ...prev, material_issue: "", items: [] }));
      setIssueItems([]);
      return;
    }

    setFormData((prev) => ({
      ...prev,
      material_issue: issueId,
      items: [],
    }));
    await fetchIssueItems(issueId);
  };

  const handleQtyChange = (index, value) => {
    const updatedItems = [...formData.items];
    const maxQty =
      issueItems[index]?.quantity || issueItems[index]?.issued_quantity || 0;
    let newValue = parseFloat(value);
    if (isNaN(newValue)) newValue = 0;
    if (newValue < 0) newValue = 0;
    if (newValue > maxQty) newValue = maxQty;
    updatedItems[index].quantity = newValue;
    setFormData((prev) => ({ ...prev, items: updatedItems }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === "destination_type") {
      setFormData((prev) => ({
        ...prev,
        destination_type: value,
        delivery_destination: "",
      }));
      return;
    }
    if (name === "material_issue") {
      handleIssueChange(value);
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateStep1 = () => {
    if (!formData.material_issue) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select a material issue" });
      return false;
    }
    if (!formData.dispatch_date) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select dispatch date" });
      return false;
    }
    if (!formData.destination_type) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select destination type" });
      return false;
    }
    if (!formData.delivery_destination) {
      Swal.fire({ icon: "error", title: "Validation", text: "Please select delivery destination" });
      return false;
    }
    if (
      formData.delivery_person_phone &&
      !/^\d{10}$/.test(formData.delivery_person_phone)
    ) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Delivery person phone must be 10 digits",
      });
      return false;
    }
    const itemsToSubmit = formData.items.filter((item) => Number(item.quantity) > 0);
    if (itemsToSubmit.length === 0) {
      Swal.fire({
        icon: "error",
        title: "Validation",
        text: "Please enter dispatch quantity for at least one item",
      });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && !validateStep1()) return;
    setStep(2);
  };

  const handleBack = () => setStep(1);

  const handleSubmit = async () => {
    if (!validateStep1()) return;
    setLoading(true);

    try {
      const itemsToSubmit = formData.items.filter((item) => Number(item.quantity) > 0);
      const payload = {
        material_issue: parseInt(formData.material_issue, 10),
        dispatch_date: formData.dispatch_date,
        destination_type: formData.destination_type,
        branch:
          formData.destination_type === "branch"
            ? parseInt(formData.delivery_destination, 10)
            : null,
        site:
          formData.destination_type === "site"
            ? parseInt(formData.delivery_destination, 10)
            : null,
        delivery_partner_name: formData.delivery_partner_name || null,
        delivery_person_name: formData.delivery_person_name || null,
        delivery_person_phone: formData.delivery_person_phone || null,
        delivery_remark: formData.delivery_remark || null,
        items: itemsToSubmit.map((item) => ({
          material_issue_item: item.material_issue_item,
          quantity: parseFloat(item.quantity),
        })),
      };

      const url = dc
        ? `${BASE_API}/inventory/delivery-challan/${dc.id}/`
        : `${BASE_API}/inventory/delivery-challan/`;
      const method = dc ? "PUT" : "POST";

      await axios({ method, url, data: payload, headers });

      Swal.fire({
        icon: "success",
        title: dc ? "Delivery Challan Updated" : "Delivery Challan Created",
        text: `Delivery Challan ${dc ? "updated" : "created"} successfully`,
        timer: 2000,
      });

      onClose();
      onSuccess?.();
    } catch (err) {
      const data = err?.response?.data;
      const message =
        data?.detail ||
        data?.branch?.[0] ||
        data?.site?.[0] ||
        (typeof data === "object" ? JSON.stringify(data) : null) ||
        `Failed to ${dc ? "update" : "create"} Delivery Challan`;

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const totalDispatchQty = formData.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="sticky top-0 bg-white z-10 border-b px-6 py-4 rounded-t-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-800">
              {dc ? "Edit Delivery Challan" : "Create Delivery Challan"}
            </h2>
            <button
              onClick={onClose}
              className="text-2xl font-bold text-gray-500 hover:text-red-500 transition"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                1
              </div>
              <span className="ml-2 font-medium">Details & Items</span>
            </div>

            <div className={`w-12 h-1 ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />

            <div className={`flex items-center ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200"
                }`}
              >
                2
              </div>
              <span className="ml-2 font-medium">Review</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>
                    Material Issue <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="material_issue"
                    value={formData.material_issue}
                    onChange={handleInputChange}
                    className={inputClass}
                    disabled={!!dc}
                  >
                    <option value="">Select Material Issue</option>
                    {materialIssues.map((issue) => (
                      <option key={issue.id} value={issue.id}>
                        {issue.issue_number}
                        {issue.site_name
                          ? ` - ${issue.site_name}`
                          : issue.branch_name
                            ? ` - ${issue.branch_name}`
                            : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Dispatch Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="dispatch_date"
                    value={formData.dispatch_date}
                    onChange={handleInputChange}
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Destination Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="destination_type"
                    value={formData.destination_type}
                    onChange={handleInputChange}
                    className={inputClass}
                  >
                    <option value="">Select Destination Type</option>
                    <option value="branch">Branch</option>
                    <option value="site">Site</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Delivery Destination <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="delivery_destination"
                    value={formData.delivery_destination}
                    onChange={handleInputChange}
                    disabled={!formData.destination_type}
                    className={inputClass}
                  >
                    <option value="">
                      {!formData.destination_type
                        ? "Select Destination Type First"
                        : formData.destination_type === "branch"
                          ? "Select Branch"
                          : "Select Site"}
                    </option>
                    {destinationOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Delivery Partner Name</label>
                  <input
                    type="text"
                    name="delivery_partner_name"
                    value={formData.delivery_partner_name}
                    onChange={handleInputChange}
                    placeholder="Enter delivery partner name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Delivery Person Name</label>
                  <input
                    type="text"
                    name="delivery_person_name"
                    value={formData.delivery_person_name}
                    onChange={handleInputChange}
                    placeholder="Enter delivery person name"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Delivery Person Phone</label>
                  <input
                    type="text"
                    name="delivery_person_phone"
                    value={formData.delivery_person_phone}
                    onChange={handleInputChange}
                    maxLength={10}
                    placeholder="10 digit phone number"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>Delivery Remark</label>
                  <input
                    type="text"
                    name="delivery_remark"
                    value={formData.delivery_remark}
                    onChange={handleInputChange}
                    placeholder="Enter delivery remark"
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Items table - auto loads when MIN is selected */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-lg font-semibold text-gray-800">Items</h3>
                  <span className="text-sm text-gray-600">
                    Total Qty: <b className="text-blue-600">{totalDispatchQty}</b>
                  </span>
                </div>

                {!formData.material_issue ? (
                  <div className="text-center py-10 text-gray-500 border border-gray-300 rounded-md">
                    Select a Material Issue to load items automatically
                  </div>
                ) : issueItems.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 border border-gray-300 rounded-md">
                    No items found for selected Material Issue
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-gray-300 rounded-md">
                    <table className="w-full text-sm text-gray-800">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">#</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">Item</th>
                          <th className="border border-gray-300 px-3 py-2 text-center font-medium">Issued Qty</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">Dispatch Qty</th>
                          <th className="border border-gray-300 px-3 py-2 text-left font-medium">Unit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {issueItems.map((item, index) => (
                          <tr key={item.id}>
                            <td className="border border-gray-300 px-3 py-2">{index + 1}</td>
                            <td className="border border-gray-300 px-3 py-2">
                              {item.display_name ||
                                item.product_name ||
                                item.item_name ||
                                item.name ||
                                "Unknown"}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              <span className="bg-sky-100 text-sky-800 px-2 py-1 rounded text-xs font-medium">
                                {item.quantity || item.issued_quantity || 0}
                              </span>
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              <input
                                type="number"
                                min="0"
                                max={item.quantity || item.issued_quantity || 0}
                                value={formData.items[index]?.quantity || ""}
                                onChange={(e) => handleQtyChange(index, e.target.value)}
                                className="w-28 px-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                              />
                            </td>
                            <td className="border border-gray-300 px-3 py-2">
                              {item.uom || item.unit || "Nos"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3">Delivery Challan Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-800">
                  <div>
                    <span className="text-gray-600">Material Issue:</span>
                    <span className="ml-2 font-medium">
                      {materialIssues.find(
                        (i) => String(i.id) === String(formData.material_issue)
                      )?.issue_number || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Dispatch Date:</span>
                    <span className="ml-2 font-medium">{formData.dispatch_date || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Destination Type:</span>
                    <span className="ml-2 font-medium capitalize">
                      {formData.destination_type || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Destination:</span>
                    <span className="ml-2 font-medium">{destinationLabel || "-"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Partner:</span>
                    <span className="ml-2 font-medium">
                      {formData.delivery_partner_name || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Delivery Person:</span>
                    <span className="ml-2 font-medium">
                      {formData.delivery_person_name || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Phone:</span>
                    <span className="ml-2 font-medium">
                      {formData.delivery_person_phone || "-"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Remark:</span>
                    <span className="ml-2 font-medium">
                      {formData.delivery_remark || "-"}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">
                  Items ({formData.items.filter((i) => Number(i.quantity) > 0).length})
                </h3>
                <div className="overflow-x-auto border border-gray-300 rounded-md">
                  <table className="w-full text-sm text-gray-800">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-3 py-2 text-left font-medium">Item</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium">Dispatch Qty</th>
                        <th className="border border-gray-300 px-3 py-2 text-center font-medium">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items
                        .filter((item) => Number(item.quantity) > 0)
                        .map((item, index) => (
                          <tr key={index}>
                            <td className="border border-gray-300 px-3 py-2">{item.item_name}</td>
                            <td className="border border-gray-300 px-3 py-2 text-center font-semibold text-blue-700">
                              {item.quantity}
                            </td>
                            <td className="border border-gray-300 px-3 py-2 text-center">
                              {item.unit}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 text-sm">
                  ✓ <strong>Note:</strong> After creating this Delivery Challan, selected quantities will be marked as dispatched.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex justify-between rounded-b-lg">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
          >
            Cancel
          </button>

          <div className="flex gap-3">
            {step > 1 && (
              <button
                onClick={handleBack}
                className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 transition text-sm"
              >
                ← Back
              </button>
            )}

            {step < 2 ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition text-sm"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {loading
                  ? dc
                    ? "Updating..."
                    : "Creating..."
                  : dc
                    ? "✓ Update Delivery Challan"
                    : "✓ Create Delivery Challan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
