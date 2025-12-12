// customerLookup.js

export async function fetchCustomerByPhone(baseApi, token, phone) {
  if (!phone || phone.trim() === "") return null;

  const url = `${baseApi.replace(/\/$/, "")}/api/lead/customer/?search=${encodeURIComponent(phone)}`;

  try {
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) return null;

    const json = await res.json();
    const results = json.results ?? json;

    if (Array.isArray(results) && results.length > 0) {
      return results[0]; // first match
    }

    return null;
  } catch (err) {
    console.error("Customer lookup error:", err);
    return null;
  }
}
