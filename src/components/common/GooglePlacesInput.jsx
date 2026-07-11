import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { MdLocationOn, MdClose } from "react-icons/md";

/**
 * GooglePlacesInput
 * Drop-in replacement for a plain <input> for address fields.
 * Loads Google Maps JS API on first render (only once per page).
 * Falls back to plain text input if API key is not provided.
 *
 * Props:
 *   value        – current address string (controlled)
 *   onChange     – called with (newAddressString, placeObject|null)
 *   placeholder  – input placeholder
 *   className    – Tailwind classes for the <input>
 *   name         – HTML name attr
 *   apiKey       – Google Maps JS API Key (VITE_GOOGLE_MAPS_KEY)
 */
const DEFAULT_QUERY = "Pune";

const buildEmbedUrl = (query) =>
  `https://www.google.com/maps?q=${encodeURIComponent(query || DEFAULT_QUERY)}&output=embed`;

const buildSearchUrl = (query) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || DEFAULT_QUERY)}`;

const GooglePlacesInput = forwardRef(function GooglePlacesInput(
{
  value = "",
  onChange,
  placeholder = "Type to search address...",
  className = "",
  name = "address",
  apiKey = import.meta.env.VITE_GOOGLE_MAPS_KEY || "",
}, ref) {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapQuery, setMapQuery] = useState("");
  const [mapStatus, setMapStatus] = useState("");
  const [embedUrl, setEmbedUrl] = useState(buildEmbedUrl(DEFAULT_QUERY));
  const [selectedLocationLink, setSelectedLocationLink] = useState("");

  useImperativeHandle(ref, () => ({
    openMapPicker: () => setShowMapPicker(true),
    closeMapPicker: () => setShowMapPicker(false),
  }));

  // Load script once
  useEffect(() => {
    if (!apiKey) return; // graceful fallback: plain input
    if (window.google?.maps?.places) { setLoaded(true); return; }

    const scriptId = "gmap-places-script";
    if (document.getElementById(scriptId)) {
      // Script already injected, wait for it
      const poll = setInterval(() => {
        if (window.google?.maps?.places) { setLoaded(true); clearInterval(poll); }
      }, 100);
      return () => clearInterval(poll);
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError(true);
    document.head.appendChild(script);
  }, [apiKey]);

  // Attach Autocomplete once script is loaded
  useEffect(() => {
    if (!loaded || !inputRef.current) return;
    if (autocompleteRef.current) return; // already attached

    try {
      const ac = new window.google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "IN" },
        fields: ["formatted_address", "geometry", "name", "address_components"],
        types: ["geocode", "establishment"],
      });

      ac.addListener("place_changed", () => {
        const place = ac.getPlace();
        const address = place.formatted_address || place.name || "";
        onChange && onChange(address, place);
      });

      autocompleteRef.current = ac;
    } catch (e) {
      console.error("Google Places Autocomplete init failed:", e);
    }
  }, [loaded]);

  const handleOpenMapPicker = () => {
    const initialQuery = value || DEFAULT_QUERY;
    setMapQuery(initialQuery);
    setEmbedUrl(buildEmbedUrl(initialQuery));
    setSelectedLocationLink(buildSearchUrl(initialQuery));
    setMapStatus("Search for a location, then use the location");
    setShowMapPicker(true);
  };

  const handleSearchLocation = () => {
    const query = mapQuery.trim() || DEFAULT_QUERY;
    setMapQuery(query);
    setEmbedUrl(buildEmbedUrl(query));
    setSelectedLocationLink(buildSearchUrl(query));
    setMapStatus("Showing map for searched location");
  };

  const handleUseLocation = () => {
    const query = mapQuery.trim() || DEFAULT_QUERY;
    const locationLink = buildSearchUrl(query);
    setSelectedLocationLink(locationLink);
    onChange && onChange(locationLink, null);
    setShowMapPicker(false);
  };

  // Sync external value → input (user typed manually or form reset)
  // Don't override when autocomplete is choosing
  const handleManualChange = (e) => {
    onChange && onChange(e.target.value, null);
  };

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
        <MdLocationOn size={16} />
      </div>
      <input
        ref={inputRef}
        name={name}
        value={value}
        onChange={handleManualChange}
        placeholder={placeholder}
        className={`pl-9 pr-8 ${className}`}
        autoComplete="off"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange && onChange("", null)}
          className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
          tabIndex={-1}
        >
          <MdClose size={14} />
        </button>
      )}
      {error && (
        <p className="text-xs text-amber-500 mt-0.5">
          Maps API unavailable — type address manually
        </p>
      )}
      {apiKey && !loaded && !error && (
        <p className="text-xs text-slate-400 mt-0.5 animate-pulse">
          Loading address suggestions...
        </p>
      )}
      <button
        type="button"
        onClick={handleOpenMapPicker}
        className="mt-1 text-xs font-medium text-blue-600 hover:text-blue-700"
      >
        Open Google Maps
      </button>

      {showMapPicker && (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-800">Pick a location</p>
                <p className="text-xs text-slate-500">Search above or click on the map to set the address</p>
              </div>
              <button
                type="button"
                onClick={() => setShowMapPicker(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                <MdClose size={18} />
              </button>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex gap-2">
                <input
                  value={mapQuery}
                  onChange={(e) => setMapQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearchLocation();
                    }
                  }}
                  placeholder="Search a location..."
                  className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={handleSearchLocation}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Search
                </button>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <iframe
                  title="Google Maps preview"
                  src={embedUrl}
                  className="h-64 w-full bg-slate-100"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                />
              </div>

              <div className="flex items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{mapStatus || "Select a location"}</p>
                  {selectedLocationLink && (
                    <a
                      href={selectedLocationLink}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 hover:text-blue-700 break-all"
                    >
                      {selectedLocationLink}
                    </a>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowMapPicker(false)}
                    className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleUseLocation}
                    className="rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Use Location
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default GooglePlacesInput;
