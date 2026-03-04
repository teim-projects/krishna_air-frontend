import React, { useState } from 'react';
import Base from '../components/Base';
import Vendor from '../components/inventory/Vendor';
import Site from '../components/inventory/Site';
import Branch from '../components/inventory/Branch';
import PurchaseOrder from '../components/inventory/PurchaseOrder';

const Inventory = () => {
  const BASE_API = import.meta.env.VITE_BASE_API_URL;
  const [activeTab, setActiveTab] = useState('vendor'); // 'vendor' | 'purchase' | 'stock'
  
  return (
    <Base title="Inventory Management">
      <div className="p-4">
        {/* Tab Buttons */}
        <div className="flex gap-4 mb-4">
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'site' ? 'bg-blue-600 text-white' : 'bg-blue-100'
            }`}
            onClick={() => setActiveTab('site')}
          >
            Site
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'branch' ? 'bg-blue-600 text-white' : 'bg-blue-100'
            }`}
            onClick={() => setActiveTab('branch')}
          >
            Branch
          </button>
          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'vendor' ? 'bg-blue-600 text-white' : 'bg-blue-100'
            }`}
            onClick={() => setActiveTab('vendor')}
          >
            Vendor
          </button>

          <button
            className={`px-4 py-2 rounded ${
              activeTab === 'purchase' ? 'bg-blue-600 text-white' : 'bg-blue-100'
            }`}
            onClick={() => setActiveTab('purchase')}
          >
            Purchase Order
          </button>
        </div>

        {/* Render based on active tab */}
        {activeTab === 'site' && <Site base_api={BASE_API}/>}
        {activeTab === 'branch' && <Branch base_api={BASE_API}/>}
        
        {activeTab === 'vendor' && <Vendor base_api={BASE_API} />}
        
        {activeTab === 'purchase' && <PurchaseOrder base_api={BASE_API} />}
      </div>
    </Base>
  );
};

export default Inventory;
