import React from "react";

export default function EditAcTypeModal({ open, onClose, type, onSave }) {
  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(type);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-md p-6 rounded shadow-lg">
        <h2 className="text-lg font-semibold mb-4">Edit AC Type</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={type.name}
              onChange={(e) => onSave({ ...type, name: e.target.value }, false)}
              className="w-full border px-3 py-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={type.desc}
              onChange={(e) => onSave({ ...type, desc: e.target.value }, false)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
