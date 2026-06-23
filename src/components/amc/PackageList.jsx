import { useState, useEffect } from "react";
import { MdEdit, MdDelete } from "react-icons/md";
import Swal from "sweetalert2";
import AddPackageForm from "./AddPackageForm";

export default function PackageList({ baseApi, token }) {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState(null);

  const fetchPackages = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseApi}/amc/packages/`, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setPackages(data.results || data);
      } else {
        throw new Error("Failed to load packages");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch packages" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, [baseApi, token]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete this package",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/packages/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Package deleted successfully", timer: 1200 });
        fetchPackages();
      } else {
        throw new Error("Failed to delete package");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const getTypeBadgeClass = (type) => {
    return type === "COMPREHENSIVE"
      ? "bg-green-100 text-green-800"
      : "bg-amber-100 text-amber-800";
  };

  return (
    <div className="space-y-6">
      {/* Header card matching PurchaseOrder */}
      <div className="bg-white p-4 rounded-md shadow flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">AMC Packages</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${packages.length} package(s) found`}
          </div>
        </div>
        <div>
          <button
            onClick={() => {
              setSelectedPkg(null);
              setShowAddForm(true);
            }}
            className="px-4 py-2 rounded-md bg-sky-600 text-white hover:bg-sky-700"
          >
            + Add Package
          </button>
        </div>
      </div>

      {/* Table Card matching PurchaseOrder */}
      <div className="bg-white rounded-md shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Package Name</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Annual Cost</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Visits/Year</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Response Time</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Emergency</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                  Loading packages...
                </td>
              </tr>
            ) : packages.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-8 text-center text-slate-500">
                  No packages found. Click "+ Add Package" to create one.
                </td>
              </tr>
            ) : (
              packages.map((item, index) => (
                <tr key={item.id} className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-medium">{item.name}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeClass(item.package_type)}`}>
                      {item.package_type === "COMPREHENSIVE" ? "Comprehensive" : "Non-Comprehensive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">₹{item.annual_cost}</td>
                  <td className="px-4 py-3 text-sm">{item.service_visits_per_year}</td>
                  <td className="px-4 py-3 text-sm">{item.response_time_hours} hrs</td>
                  <td className="px-4 py-3 text-sm">
                    {item.includes_emergency_calls ? (
                      <span className="text-green-600 font-medium">Included</span>
                    ) : (
                      <span className="text-slate-500">Not Included</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedPkg(item);
                          setShowAddForm(true);
                        }}
                        className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                        title="Edit"
                      >
                        <MdEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                        title="Delete"
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <AddPackageForm
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setSelectedPkg(null);
          }}
          onSuccess={() => {
            fetchPackages();
          }}
          baseApi={baseApi}
          pkg={selectedPkg}
          token={token}
        />
      )}
    </div>
  );
}
