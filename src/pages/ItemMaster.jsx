import React, { useState, useEffect } from 'react'
import Base from '../components/Base'
import LowSide, { getLowSideFiltersConfig } from '../components/products/LowSide'
import HighSide, {
    highSideProductFiltersConfig,
    highSideModelFiltersConfig,
} from '../components/products/HighSide';
import axios from 'axios';
import InstallationWork from "../components/products/InstallationWork";
import { useUserRole } from '../hooks/useAuth';


const ItemMaster = () => {
    const BASE_API = import.meta.env.VITE_BASE_API_URL;
    const [activeSide, setActiveSide] = useState('high')
    const [filters, setFilters] = useState({});
    const [activeHighTab, setActiveHighTab] = useState('product');
    const [brands, setBrands] = useState([]);
    const [acTypes, setAcTypes] = useState([]);

    const [materialTypes, setMaterialTypes] = useState([]);
    const [itemTypes, setItemTypes] = useState([]);
    const [featureTypes, setFeatureTypes] = useState([]);
    const [classes, setClasses] = useState([]);

    const { isAdmin, hasPermission, hasAnyPermission } = useUserRole(BASE_API);

    const { canAccessItemMaster, canAccessHighSide, canAccessLowSide, canAccessInstallation } = React.useMemo(() => {
      const itemMaster = isAdmin || hasAnyPermission('Item Master');
      return {
        canAccessItemMaster:   itemMaster,
        canAccessHighSide:     isAdmin || itemMaster || hasAnyPermission('High Side'),
        canAccessLowSide:      isAdmin || itemMaster || hasAnyPermission('Low Side'),
        canAccessInstallation: isAdmin || itemMaster || hasAnyPermission('Installation Work'),
      };
    }, [isAdmin, hasAnyPermission]);

    const authHeaders = () => ({
        headers: { Authorization: `Bearer ${localStorage.getItem("access")}` },
    });

    // Fetch Low Side dropdown options
    useEffect(() => {
        const fetchLowSideOptions = async () => {
            try {
                const [matRes, itemRes, featRes, classRes] = await Promise.all([
                    axios.get(`${BASE_API}/product/material-type/`, authHeaders()),
                    axios.get(`${BASE_API}/product/item-type/`, authHeaders()),
                    axios.get(`${BASE_API}/product/feature-type/`, authHeaders()),
                    axios.get(`${BASE_API}/product/item-class/`, authHeaders()),
                ]);

                setMaterialTypes(Array.isArray(matRes.data) ? matRes.data : matRes.data?.results ?? []);
                setItemTypes(Array.isArray(itemRes.data) ? itemRes.data : itemRes.data?.results ?? []);
                setFeatureTypes(Array.isArray(featRes.data) ? featRes.data : featRes.data?.results ?? []);
                setClasses(Array.isArray(classRes.data) ? classRes.data : classRes.data?.results ?? []);
            } catch (err) {
                console.error("Error fetching Low Side options:", err);
            }
        };

        fetchLowSideOptions();
    }, [BASE_API]);

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
            return getLowSideFiltersConfig(materialTypes, itemTypes, featureTypes, classes);
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
                <div className="item-sections flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4">
                    {canAccessHighSide && (
                        <button
                            className={`w-full sm:w-auto text-center px-4 py-2 rounded font-medium transition ${activeSide === 'high' ? 'bg-blue-600 text-white' : 'bg-blue-100'}`}
                            onClick={() => setActiveSide('high')}
                        >
                            High Side
                        </button>
                    )}
                    {canAccessLowSide && (
                        <button
                            className={`w-full sm:w-auto text-center px-4 py-2 rounded font-medium transition ${activeSide === 'low' ? 'bg-blue-600 text-white' : 'bg-blue-100'}`}
                            onClick={() => setActiveSide('low')}
                        >
                            Low Side
                        </button>
                    )}
                    {canAccessInstallation && (
                        <button
                            onClick={() => setActiveSide("installation")}
                            className={`w-full sm:w-auto text-center px-4 py-2 rounded font-medium transition ${activeSide === "installation" ? "bg-blue-600 text-white" : "bg-blue-100"}`}
                        >
                            Installation Work
                        </button>
                    )}
                    {!canAccessHighSide && !canAccessLowSide && !canAccessInstallation && (
                        <p className="text-sm text-slate-500">You don't have permission to access Item Master.</p>
                    )}
                </div>

                {canAccessHighSide && activeSide === 'high' && (
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
                {canAccessLowSide && activeSide === 'low' && (
                    <LowSide
                        base_api={BASE_API}
                        filters={filters}
                        materialTypes={materialTypes}
                        itemTypes={itemTypes}
                        featureTypes={featureTypes}
                        classes={classes}
                    />
                )}
                {canAccessInstallation && activeSide === "installation" && (
                    <InstallationWork
                        base_api={BASE_API}
                        filters={filters}
                    />
                )}
            </div>
        </Base>
    )
}

export default ItemMaster
