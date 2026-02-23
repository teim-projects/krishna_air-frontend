import React, { useState } from 'react'
import Base from '../components/Base'
// import HighSide from '../components/products/HighSide'
import LowSide, { lowSideFiltersConfig } from '../components/products/LowSide'
import HighSide, {
    highSideProductFiltersConfig,
    highSideModelFiltersConfig,
} from '../components/products/HighSide';



const ItemMaster = () => {
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    const [activeSide, setActiveSide] = useState('high') // 'high' | 'low'
    const [filters, setFilters] = useState({});
    const [activeHighTab, setActiveHighTab] = useState('product');
    const [brands, setBrands] = useState([]);
    const [acTypes, setAcTypes] = useState([]);
    const handleFilterChange = (vals) => {
        setFilters(vals);
    };

    const getFiltersConfig = () => {
        if (activeSide === 'high') {
            return activeHighTab === 'product'
                ? highSideProductFiltersConfig
                : highSideModelFiltersConfig(brands, acTypes);
        }
        if (activeSide === 'low') {
            return lowSideFiltersConfig;
        }
        return null;
    };

    return (
        <Base title="Item Master"

            filterTitle={
                activeSide === 'high'
                    ? activeHighTab === 'product'
                        ? 'High Side • Product Filters'
                        : 'High Side • Model Filters'
                    : 'Low Side • Item Filters'
            }
            filtersConfig={getFiltersConfig()}
            initialFilterValues={filters}
            onFiltersChange={handleFilterChange}
        >
            <div className="p-4">
                <div className="item-sections flex gap-4 mb-4">
                    <button
                        className={`px-4 py-2 rounded ${activeSide === 'high' ? 'bg-black text-white' : 'bg-gray-200'
                            }`}
                        onClick={() => setActiveSide('high')}
                    >
                        High Side
                    </button>

                    <button
                        className={`px-4 py-2 rounded ${activeSide === 'low' ? 'bg-black text-white' : 'bg-gray-200'
                            }`}
                        onClick={() => setActiveSide('low')}
                    >
                        Low Side
                    </button>
                </div>

                {/* Render based on selected button */}
                {activeSide === 'high' && (
                    <HighSide
                        base_api={BASE_API}
                        filters={filters}
                        activeTab={activeHighTab}
                        onTabChange={setActiveHighTab}
                        brands={brands}
                        setBrands={setBrands}
                        acTypes={acTypes}
                        setAcTypes={setAcTypes}
                    />
                )}

                {activeSide === 'low' && (
                    <LowSide
                        base_api={BASE_API}
                        filters={filters}
                    />
                )}
            </div>
        </Base>
    )
}

export default ItemMaster
