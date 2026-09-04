import { useState, useEffect, Fragment } from "react";
import { MdEdit, MdDelete, MdAutorenew, MdVisibility, MdBuild, MdHistory } from "react-icons/md";
import Swal from "sweetalert2";
import AddAmcForm from "./AddAmcForm";
import ContractDetailModal from "./ContractDetailModal";
import AmcSparePartsModal from "./AmcSparePartsModal";
import RenewAmcModal from "./RenewAmcModal";
import { useDocPermissions } from "../../hooks/useAuth";

export default function AmcList({ baseApi, token, filters = {} }) {
  const { canCreate, canEdit, canDelete } = useDocPermissions('AMC');
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedAmc, setSelectedAmc] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, active, expiring_soon
  const [detailContract, setDetailContract] = useState(null);
  const [sparePartsContract, setSparePartsContract] = useState(null);
  const [renewingContract, setRenewingContract] = useState(null);
  const [expandedContractNo, setExpandedContractNo] = useState(null);
  const [versionHistory, setVersionHistory] = useState({});
  const [loadingVersions, setLoadingVersions] = useState(false);

  const fetchContracts = async () => {
    setLoading(true);
    try {
      let url = `${baseApi}/amc/contracts/`;
      if (filterType === "expiring_soon") {
        url = `${baseApi}/amc/contracts/expiring_soon/`;
      } else if (filterType === "active") {
        url = `${baseApi}/amc/contracts/active_contracts/`;
      }
      // Append search filter from FiltersPanel
      if (filters?.search) {
        const separator = url.includes("?") ? "&" : "?";
        url += `${separator}search=${encodeURIComponent(filters.search)}`;
      }

      const res = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      if (res.ok) {
        const data = await res.json();
        setContracts(data.results || data);
      } else {
        throw new Error("Failed to load contracts");
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch contracts" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [filterType, baseApi, token, filters]);

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Deactivate AMC Contract?",
      text: "AMC contracts are not deleted. Status will be set to Inactive.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, deactivate",
      confirmButtonColor: "#d33"
    });

    if (!result.isConfirmed) return;

    try {
      const res = await fetch(`${baseApi}/amc/contracts/${id}/`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        Swal.fire({ icon: "success", text: "Contract set to Inactive", timer: 1200 });
        fetchContracts();
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to deactivate contract");
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: err.message });
    }
  };

  const handleToggleVersionHistory = async (contractNo) => {
    if (expandedContractNo === contractNo) {
      setExpandedContractNo(null);
      return;
    }

    setExpandedContractNo(contractNo);
    if (versionHistory[contractNo]) {
      return;
    }

    setLoadingVersions(true);
    try {
      const res = await fetch(
        `${baseApi}/amc/contracts/version-history/?contract_number=${encodeURIComponent(contractNo)}`,
        {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );
      if (res.ok) {
        const data = await res.json();
        const versions = data.results || data || [];
        setVersionHistory((prev) => ({
          ...prev,
          [contractNo]: versions,
        }));
      }
    } catch (err) {
      console.error("Failed to load version history:", err);
    } finally {
      setLoadingVersions(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "INACTIVE":
        return "bg-slate-100 text-slate-800";
      case "CLOSED":
        return "bg-blue-100 text-blue-800";
      case "EXPIRED":
        return "bg-red-100 text-red-800";
      case "CANCELLED":
        return "bg-amber-100 text-amber-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header card matching PurchaseOrder */}
      <div className="bg-white p-4 rounded-md shadow flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">AMC Contracts</h2>
          <div className="text-sm text-slate-600">
            {loading ? "Loading..." : `${contracts.length} AMC contract(s) found`}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => setFilterType("all")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md ${
                filterType === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterType("active")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md ${
                filterType === "active" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterType("expiring_soon")}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-md ${
                filterType === "expiring_soon" ? "bg-amber-600 text-white" : "bg-amber-100 text-amber-800 hover:bg-amber-200"
              }`}
            >
              Expiring Soon
            </button>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                setSelectedAmc(null);
                setShowAddForm(true);
              }}
              className="w-full sm:w-auto px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700 text-sm font-medium text-center"
            >
              + Add AMC
            </button>
          )}
        </div>
      </div>

      {/* Table Card matching PurchaseOrder */}
      <div className="bg-white rounded-md shadow overflow-x-auto">
        <table className="w-full min-w-[1000px]">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Sr.No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Contract No</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">AMC Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Visit Freq.</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">AC Variant</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Start Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">End Date</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Cost</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500">
                  Loading contracts...
                </td>
              </tr>
            ) : contracts.length === 0 ? (
              <tr>
                <td colSpan="11" className="px-4 py-8 text-center text-sm text-slate-500">
                  No contracts found. Click "+ Add AMC" to create one.
                </td>
              </tr>
            ) : (
              contracts.map((item, index) => (
                <Fragment key={item.id}>
                  <tr className="border-b hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-blue-600">
                    {item.contract_number}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.customer_name || `Customer ID: ${item.customer}`}</td>
                  <td className="px-4 py-3 text-sm">
                    {item.amc_type === "COMPREHENSIVE"
                      ? "Comprehensive"
                      : item.amc_type === "NON_COMPREHENSIVE"
                        ? "Non-Comprehensive"
                        : "—"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {{
                      MONTHLY: "Monthly",
                      QUARTERLY: "Quarterly",
                      HALF_YEARLY: "Half Yearly",
                      YEARLY: "Yearly",
                      CUSTOM: "Custom",
                    }[item.visit_frequency] || "—"}
                    {item.expected_visit_count != null && (
                      <span className="text-slate-500"> ({item.expected_visit_count} visits)</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.product_name || `Variant ID: ${item.product_variant}`}</td>
                  <td className="px-4 py-3 text-sm">{item.amc_start_date}</td>
                  <td className="px-4 py-3 text-sm">{item.amc_end_date}</td>
                  <td className="px-4 py-3 text-sm">₹{item.amc_cost}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleToggleVersionHistory(item.contract_number)}
                        className={`px-2 py-1 rounded hover:bg-purple-300 transition-colors ${
                          expandedContractNo === item.contract_number
                            ? "bg-purple-400 text-purple-900 shadow-xs"
                            : "bg-purple-200 text-purple-800"
                        }`}
                        title="Version History"
                      >
                        <MdHistory />
                      </button>
                      <button
                        onClick={() => setDetailContract(item)}
                        className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        title="View Details"
                      >
                        <MdVisibility />
                      </button>
                      {item.amc_type === "NON_COMPREHENSIVE" && (
                        <button
                          onClick={() => setSparePartsContract(item)}
                          className="px-2 py-1 bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
                          title="Spare Parts & Invoice"
                        >
                          <MdBuild />
                        </button>
                      )}
                      {canEdit && (
                        <button
                          onClick={() => {
                            setSelectedAmc(item);
                            setShowAddForm(true);
                          }}
                          className="px-2 py-1 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300"
                          title="Edit"
                        >
                          <MdEdit />
                        </button>
                      )}
                      {item.status === "ACTIVE" && canEdit && (
                        <button
                          onClick={() => setRenewingContract(item)}
                          className="px-2 py-1 bg-purple-200 text-purple-800 rounded hover:bg-purple-300"
                          title="Renew AMC"
                        >
                          <MdAutorenew />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300"
                          title="Delete"
                        >
                          <MdDelete />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Version History Sub-rows */}
                {expandedContractNo === item.contract_number && (
                  <>
                    {loadingVersions && !versionHistory[item.contract_number] ? (
                      <tr>
                        <td colSpan="11" className="px-4 py-3 text-center text-sm text-slate-500 bg-slate-50">
                          Loading version history...
                        </td>
                      </tr>
                    ) : versionHistory[item.contract_number]?.filter((v) => v.id !== item.id).length > 0 ? (
                      versionHistory[item.contract_number]
                        .filter((v) => v.id !== item.id)
                        .map((ver, vIndex) => (
                          <tr
                            key={ver.id}
                            className="bg-slate-50/95 border-b border-slate-200 hover:bg-slate-100/90 transition-colors"
                          >
                            <td className="px-4 py-2.5 text-xs text-slate-500 pl-8 font-medium">
                              {index + 1}.{vIndex + 1}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-semibold text-slate-700">
                              {ver.contract_number}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ver.customer_name || `Customer #${ver.customer}`}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ver.amc_type === "COMPREHENSIVE" ? "Comprehensive" : "Non-Comprehensive"}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {{
                                MONTHLY: "Monthly",
                                QUARTERLY: "Quarterly",
                                HALF_YEARLY: "Half Yearly",
                                YEARLY: "Yearly",
                                CUSTOM: "Custom",
                              }[ver.visit_frequency] || ver.visit_frequency || "—"}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ver.product_name || `Variant #${ver.product_variant}`}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ver.amc_start_date}
                            </td>
                            <td className="px-4 py-2.5 text-xs text-slate-600">
                              {ver.amc_end_date}
                            </td>
                            <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                              ₹{ver.amc_cost}
                            </td>
                            <td className="px-4 py-2.5 text-xs">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadgeClass(ver.status)}`}>
                                {ver.status}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-center">
                              <button
                                onClick={() => setDetailContract(ver)}
                                className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs"
                                title="View Version Details"
                              >
                                <MdVisibility />
                              </button>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="11" className="px-4 py-3 text-center text-xs text-slate-500 bg-slate-50">
                          No prior / expired versions found for this contract.
                        </td>
                      </tr>
                    )}
                  </>
                )}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showAddForm && (
        <AddAmcForm
          open={showAddForm}
          onClose={() => {
            setShowAddForm(false);
            setSelectedAmc(null);
          }}
          onSuccess={() => {
            fetchContracts();
          }}
          baseApi={baseApi}
          amc={selectedAmc}
          token={token}
        />
      )}

      {renewingContract && (
        <RenewAmcModal
          contract={renewingContract}
          baseApi={baseApi}
          token={token}
          onClose={() => setRenewingContract(null)}
          onSuccess={() => {
            setVersionHistory((prev) => {
              const next = { ...prev };
              delete next[renewingContract.contract_number];
              return next;
            });
            fetchContracts();
          }}
        />
      )}

      {detailContract && (
        <ContractDetailModal
          contract={detailContract}
          baseApi={baseApi}
          token={token}
          onClose={() => setDetailContract(null)}
        />
      )}

      {sparePartsContract && (
        <AmcSparePartsModal
          contract={sparePartsContract}
          baseApi={baseApi}
          token={token}
          onClose={() => setSparePartsContract(null)}
          onUpdated={fetchContracts}
        />
      )}
    </div>
  );
}
