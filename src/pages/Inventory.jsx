import React, { useState } from 'react';
import Base from '../components/Base';
import Vendor from '../components/inventory/Vendor';
import Site from '../components/inventory/Site';
import Branch from '../components/inventory/Branch';
import PurchaseOrder from '../components/inventory/PurchaseOrder';
import AddGrnForm from '../components/inventory/AddGrnForm';
import GRN from '../components/inventory/GRN';

const Inventory = () => {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'purchase' | 'stock' | 'GRN'

  const [filters, setFilters] = useState({});

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
  
  const grnFiltersConfig=[
    { key: "search" , label: "Search" , type: "search" , placeholder :"Seach by  GRN number , PO number , vendor ..."}
  ]

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
                activeTab === 'grn'  ? 'GRN Filters':
                'Filters'
      }
      filtersConfig={
        activeTab === 'vendor' ? vendorFiltersConfig :
          activeTab === 'site' ? siteFiltersConfig :
            activeTab === 'branch' ? branchFiltersConfig :
              activeTab === 'purchase' ? purchaseFiltersConfig :
                activeTab === 'grn'  ? grnFiltersConfig :
                null
      }
      initialFilterValues={filters}
      onFiltersChange={handleFilterChange}
    >
      <div className="p-4">
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${activeTab === 'site' ? 'bg-blue-600 text-white' : 'bg-blue-100'
              }`}
            onClick={() => setActiveTab('site')}
          >
            Site
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'branch' ? 'bg-blue-600 text-white' : 'bg-blue-100'
              }`}
            onClick={() => setActiveTab('branch')}
          >
            Branch
          </button>
          <button
            className={`px-4 py-2 rounded ${activeTab === 'vendor' ? 'bg-blue-600 text-white' : 'bg-blue-100'
              }`}
            onClick={() => setActiveTab('vendor')}
          >
            Vendor
          </button>

          <button
            className={`px-4 py-2 rounded ${activeTab === 'purchase' ? 'bg-blue-600 text-white' : 'bg-blue-100'
              }`}
            onClick={() => setActiveTab('purchase')}
          >
            Purchase Order
          </button>
          <button className={`px-4 py-2 rounded ${activeTab==='grn'? 'bg-blue-600 text-white' :'bg-blue-100' }`}
          onClick={()=>setActiveTab('grn')}
          >
            GRN
          </button>
        </div>

        {/* Render based on active tab */}
        {activeTab === 'site' && <Site base_api={BASE_API} filters={filters} />}
        {activeTab === 'branch' && <Branch base_api={BASE_API} filters={filters} />}
        {activeTab === 'vendor' && <Vendor base_api={BASE_API} filters={filters} />}
        {activeTab === 'purchase' && <PurchaseOrder base_api={BASE_API} filters={filters} />}
        {activeTab === 'grn' && <GRN base_api={BASE_API} filters ={filters}/>}

      </div>
    </Base>
  );
};

export default Inventory;
