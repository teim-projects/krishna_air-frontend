import React, { useEffect, useState } from "react";
import axios from "axios";

const TermsMultiSelect = ({
  value = [],
  onChange,
  termsType,          // required (id of terms_condition_type)
  baseApi,            // required
  disabled = false,
  token
}) => {
  const [terms, setTerms] = useState([]);
  const [newTerm, setNewTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // -----------------------------
  // Fetch Terms
  // -----------------------------
  useEffect(() => {
    if (termsType) {
      fetchTerms();
    }
  }, [termsType]);

  const fetchTerms = async () => {
    try {
      setFetching(true);

      const res = await axios.get(
        `${baseApi}/inventory/terms/?terms_condition_type=${termsType}`
        , {
            headers: {
                "Content-Type": "application/json",
                ...(token ? { Authorization: `Bearer ${token}` } : {})
            }
        }
      );

      // handle paginated & non-paginated response
      const data = res.data.results ? res.data.results : res.data;

      setTerms(data);
    } catch (error) {
      console.error("Error fetching terms:", error);
    } finally {
      setFetching(false);
    }
  };

  // -----------------------------
  // Handle Checkbox Change
  // -----------------------------
  const handleCheckboxChange = (id) => {
    if (!Array.isArray(value)) return;

    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  // -----------------------------
  // Add New Term
  // -----------------------------
  const handleAddTerm = async () => {
    if (!newTerm.trim()) return;

    try {
      setLoading(true);

      const res = await axios.post(`${baseApi}/inventory/terms/`, 
        {
        terms: newTerm,
        terms_condition_type: termsType,
      }, {
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      const createdTerm = res.data;

      setTerms((prev) => [...prev, createdTerm]);

      // auto select newly created term
      onChange([...(value || []), createdTerm.id]);

      setNewTerm("");
    } catch (error) {
      console.error("Error adding term:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Terms List */}
      <div className="border rounded-md p-3 max-h-48 overflow-y-auto bg-gray-50">
        {fetching ? (
          <p className="text-sm text-gray-500">Loading terms...</p>
        ) : terms.length === 0 ? (
          <p className="text-sm text-gray-500">No terms available</p>
        ) : (
          terms.map((term) => (
            <label
              key={term.id}
              className="flex items-center gap-2 text-sm mb-1"
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(term.id)}
                onChange={() => handleCheckboxChange(term.id)}
                disabled={disabled}
              />
              {term.terms}
            </label>
          ))
        )}
      </div>

      {/* Add New Term */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTerm}
          onChange={(e) => setNewTerm(e.target.value)}
          placeholder="Add new term"
          className="w-full px-3 py-2 border rounded-md"
          disabled={disabled}
        />
        <button
          type="button"
          onClick={handleAddTerm}
          disabled={loading || disabled}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add"}
        </button>
      </div>
    </div>
  );
};

export default TermsMultiSelect;