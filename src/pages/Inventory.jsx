import React, { useState } from 'react';
import Base from '../components/Base';
import Vendor from '../components/inventory/Vendor';
import Site from '../components/inventory/Site';
import Branch from '../components/inventory/Branch';
import PurchaseOrder from '../components/inventory/PurchaseOrder';
import AddGrnForm from '../components/inventory/AddGrnForm';
import GRN from '../components/inventory/GRN';
import MaterialIssue from '../components/inventory/MaterialIssue';
import MaterialReturn from '../components/inventory/MaterialReturn';
import StockDashboard from '../components/inventory/StockDashboard';
import DeliveryChallan from '../components/inventory/DeliveryChallan';
import { useUserRole } from '../hooks/useAuth';

const Inventory = () => {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState('vendor');
  const [filters, setFilters] = useState({});

  const { isAdmin, hasPermission, hasAnyPermission } = useUserRole(BASE_API);

  const {
    canAccessInventory,
    canAccessPO,
    canAccessGRN,
    canAccessMatIssue,
    canAccessMatReturn,
    canAccessDelChallan,
    canAccessSite,
    canAccessBranch,
  } = React.useMemo(() => {
    const inv = isAdmin || hasAnyPermission('Inventory');
    return {
      canAccessInventory:  inv,
      canAccessPO:         isAdmin || inv || hasAnyPermission('Purchase Order (PO)'),
      canAccessGRN:        isAdmin || inv || hasAnyPermission('GRN'),
      canAccessMatIssue:   isAdmin || inv || hasAnyPermission('Material Issue'),
      canAccessMatReturn:  isAdmin || inv || hasAnyPermission('Material Return'),
      canAccessDelChallan: isAdmin || inv || hasAnyPermission('Delivery Challan'),
      canAccessSite:       isAdmin || hasAnyPermission('Site'),
      canAccessBranch:     isAdmin || hasAnyPermission('Branch'),
    };
  }, [isAdmin, hasAnyPermission]);

  // Filter configurations
  const vendorFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by name, email, mobile, GST, PAN, POC..." }
  ];

  const siteFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by name, city, state, pincode, owner..." }
  ];

  const branchFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by name, email, contact, city, state..." }
  ];

  const purchaseFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by PO number, vendor, site..." }
  ];
  
  const grnFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by GRN number, PO number, vendor..." }
  ];

  const materialIssueFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by issue number, site, technician..." }
  ];

  const materialReturnFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by return number, issue number..." }
  ];

  const stockDashboardFiltersConfig = [
    { key: "search", label: "Search", type: "search", placeholder: "Search by item code, SKU..." }
  ];

  const deliveryChallanFiltersConfig = [
      { key: "search", label: "Search", type: "search", placeholder: "Search by DC number, partner, destination..." },
    { key: "status", label: "Status", type: "select", options: ["All", "draft", "confirmed", "dispatched", "delivered", "cancelled"], placeholder: "Filter by status" }
  ];

  const handleFilterChange = (vals) => {
    setFilters(vals);
  };

  return (
    <Base
      title="Inventory Management"
      filterTitle={
        activeTab === 'vendor' ? 'Vendor Filters' :
          activeTab === 'site' ? 'Site Filters' :
            activeTab === 'branch' ? 'Branch Filters' :
              activeTab === 'purchase' ? 'Purchase Order Filters' :
                activeTab === 'grn' ? 'GRN Filters' :
                  activeTab === 'materialIssue' ? 'Material Issue Filters' :
                    activeTab === 'materialReturn' ? 'Material Return Filters' :
                      activeTab === 'stockDashboard' ? 'Stock Filters' :
                        activeTab === 'deliveryChallan' ? 'Delivery Challan Filters' :
                          'Filters'
      }
      filtersConfig={
        activeTab === 'vendor' ? vendorFiltersConfig :
          activeTab === 'site' ? siteFiltersConfig :
            activeTab === 'branch' ? branchFiltersConfig :
              activeTab === 'purchase' ? purchaseFiltersConfig :
                activeTab === 'grn' ? grnFiltersConfig :
                  activeTab === 'materialIssue' ? materialIssueFiltersConfig :
                    activeTab === 'materialReturn' ? materialReturnFiltersConfig :
                      activeTab === 'stockDashboard' ? stockDashboardFiltersConfig :
                        activeTab === 'deliveryChallan' ? deliveryChallanFiltersConfig :
                          null
      }
      initialFilterValues={filters}
      onFiltersChange={handleFilterChange}
    >
      <div className="p-4">
        {/* Tab Buttons — only show tabs the user has permission for */}
        <div className="flex gap-2 sm:gap-4 mb-4 overflow-x-auto pb-2 scrollbar-none whitespace-nowrap flex-nowrap sm:flex-wrap">
          {canAccessSite && (
            <button
              className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'site' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              onClick={() => setActiveTab('site')}
            >
              Site
            </button>
          )}
          {canAccessBranch && (
            <button
              className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'branch' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
              onClick={() => setActiveTab('branch')}
            >
              Branch
            </button>
          )}
          {canAccessInventory && (
            <>
              <button
                className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'vendor' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                onClick={() => setActiveTab('vendor')}
              >
                Vendor
              </button>
              {canAccessPO && (
                <button
                  className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'purchase' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setActiveTab('purchase')}
                >
                  Purchase Order
                </button>
              )}
              {canAccessGRN && (
                <button
                  className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'grn' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setActiveTab('grn')}
                >
                  GRN
                </button>
              )}
              {canAccessMatIssue && (
                <button
                  className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'materialIssue' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setActiveTab('materialIssue')}
                >
                  Material Issue
                </button>
              )}
              {canAccessMatReturn && (
                <button
                  className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'materialReturn' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                  onClick={() => setActiveTab('materialReturn')}
                >
                  MRN
                </button>
              )}
              <button
                className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'stockDashboard' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                onClick={() => setActiveTab('stockDashboard')}
              >
                Stock
              </button>
              {canAccessDelChallan && (
                <button
                  className={`flex-shrink-0 px-4 py-2 rounded transition-colors ${activeTab === 'deliveryChallan' ? 'bg-green-600 text-white' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  onClick={() => setActiveTab('deliveryChallan')}
                >
                  Delivery Challan
                </button>
              )}
            </>
          )}
        </div>

        {/* Render based on active tab — also guard content */}
        {activeTab === 'site'           && canAccessSite       && <Site base_api={BASE_API} filters={filters} />}
        {activeTab === 'branch'         && canAccessBranch     && <Branch base_api={BASE_API} filters={filters} />}
        {activeTab === 'vendor'         && canAccessInventory  && <Vendor base_api={BASE_API} filters={filters} />}
        {activeTab === 'purchase'       && canAccessPO         && <PurchaseOrder base_api={BASE_API} filters={filters} />}
        {activeTab === 'grn'            && canAccessGRN        && <GRN base_api={BASE_API} filters={filters} />}
        {activeTab === 'materialIssue'  && canAccessMatIssue   && <MaterialIssue base_api={BASE_API} filters={filters} />}
        {activeTab === 'materialReturn' && canAccessMatReturn  && <MaterialReturn base_api={BASE_API} filters={filters} />}
        {activeTab === 'stockDashboard' && canAccessInventory  && <StockDashboard base_api={BASE_API} filters={filters} />}
        {activeTab === 'deliveryChallan'&& canAccessDelChallan && <DeliveryChallan base_api={BASE_API} filters={filters} />}
      </div>
    </Base>
  );
};

export default Inventory;