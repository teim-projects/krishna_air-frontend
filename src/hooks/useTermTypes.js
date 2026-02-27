import { useEffect, useState, useRef } from "react";
import axios from "axios";

const useTermTypes = ({ baseApi, token }) => {
  const [termTypes, setTermTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const isFetchedRef = useRef(false);

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  // ----------------------------------
  // Fetch Term Types (Only Once)
  // ----------------------------------
  const fetchTermTypes = async () => {
    if (isFetchedRef.current) return;

    try {
      setLoading(true);

      const res = await axios.get(
        `${baseApi}/inventory/terms-type/`,
        { headers }
      );

      setTermTypes(res.data.results || res.data);
      isFetchedRef.current = true;
    } catch (error) {
      console.error("Failed to fetch term types:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (baseApi && token) {
      fetchTermTypes();
    }
  }, [baseApi, token]);

  // ----------------------------------
  // Get Existing ID
  // ----------------------------------
  const getTermTypeId = (name) => {
    return termTypes.find(
      (t) => t.name.toLowerCase() === name.toLowerCase()
    )?.id || null;
  };

  // ----------------------------------
  // Get OR Create (Safe Version)
  // ----------------------------------
  const getOrCreateTermTypeId = async (name) => {
    // ensure types are loaded
    if (!isFetchedRef.current) {
      await fetchTermTypes();
    }

    const existing = getTermTypeId(name);
    if (existing) return existing;

    try {
      const res = await axios.post(
        `${baseApi}/inventory/terms-type/`,
        { name },
        { headers }
      );

      const newType = res.data;

      setTermTypes((prev) => [...prev, newType]);

      return newType.id;
    } catch (error) {
      console.error("Failed to create term type:", error);
      return null;
    }
  };

  return {
    termTypes,
    getTermTypeId,
    getOrCreateTermTypeId,
    loading,
  };
};

export default useTermTypes;