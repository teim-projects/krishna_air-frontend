import React from "react";

/**
 * Enhanced ReusableForm Component
 * 
 * Supported field types:
 * - text, email, url, number, password, date, phone
 * - textarea, select, checkbox, radio
 * - button (custom action button)
 * - component (custom component)
 */
export default function ReusableForm({
  fields = [],
  formData = {},
  onChange,
  onSubmit,
  loading = false,
  submitText = "Save",
  cancelText = "Cancel",
  resetText = "Reset",
  onCancel,
  onReset,
  title = null,
  showCancel = true,
  showReset = false,
  submitButtonClass = "px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50",
  cancelButtonClass = "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300",
  resetButtonClass = "px-4 py-2 bg-gray-200 rounded hover:bg-gray-300",
}) {

  const handleFieldChange = (fieldName, value) => {
    onChange && onChange({ ...formData, [fieldName]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(formData);
  };

  const handleReset = () => {
    onReset && onReset();
  };

  const renderField = (field) => {
    const {
      name,
      label,
      type = "text",
      placeholder = "",
      required = false,
      options = [], // for select and radio
      rows = 3,
      maxLength,
      minLength,
      min,
      max,
      disabled = false,
      className = "",
      gridCols = 1, // 1 or 2 for grid layout
      component = null, // Custom component
      onClick = null, // for button type
      buttonText = "Click", // for button type
      buttonClass = "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700",
    } = field;

    const value = formData[name] || "";
    const inputClass = `w-full px-3 py-2 rounded-md border border-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 ${className}`;

    // If custom component provided, render it
    if (component) {
      return (
        <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
          <label className="text-sm text-slate-700 mb-1 block">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {component({
            value,
            onChange: (val) => handleFieldChange(name, val),
            disabled,
          })}
        </div>
      );
    }

    // Render based on field type
    switch (type) {
      case "text":
      case "email":
      case "url":
      case "number":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type={type}
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              minLength={minLength}
              min={min}
              max={max}
              disabled={disabled}
              required={required}
            />
          </div>
        );

      case "password":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="password"
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              maxLength={maxLength}
              minLength={minLength}
              disabled={disabled}
              required={required}
            />
          </div>
        );

      case "date":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="date"
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              min={min}
              max={max}
              disabled={disabled}
              required={required}
            />
          </div>
        );

      case "phone":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
              type="text"
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value.replace(/\D/g, ""))}
              placeholder={placeholder}
              maxLength={maxLength || 10}
              disabled={disabled}
              required={required}
            />
          </div>
        );

      case "textarea":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              placeholder={placeholder}
              rows={rows}
              maxLength={maxLength}
              disabled={disabled}
              required={required}
            />
          </div>
        );

      case "select":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <select
              className={inputClass}
              value={value}
              onChange={(e) => handleFieldChange(name, e.target.value)}
              disabled={disabled}
              required={required}
            >
              <option value="">{placeholder || "Select..."}</option>
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        );

      case "checkbox":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleFieldChange(name, e.target.checked)}
                disabled={disabled}
              />
              {label} {required && <span className="text-red-500">*</span>}
            </label>
          </div>
        );

      case "radio":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            <label className="text-sm text-slate-700 mb-1 block">
              {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex flex-wrap gap-4">
              {options.map((opt) => (
                <label key={opt.value} className="inline-flex items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={name}
                    value={opt.value}
                    checked={value === opt.value}
                    onChange={(e) => handleFieldChange(name, e.target.value)}
                    disabled={disabled}
                    required={required}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>
        );

      case "button":
        return (
          <div key={name} className={gridCols === 2 ? "col-span-2" : ""}>
            {label && <label className="text-sm text-slate-700 mb-1 block">{label}</label>}
            <button
              type="button"
              onClick={() => onClick && onClick(formData)}
              className={buttonClass}
              disabled={disabled}
            >
              {buttonText}
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && (
        <div className="border-b pb-3 mb-4">
          <h3 className="text-md font-semibold">{title}</h3>
        </div>
      )}

      {/* Render fields in grid */}
      <div className="grid grid-cols-2 gap-4">
        {fields.map((field) => renderField(field))}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        {showReset && onReset && (
          <button
            type="button"
            onClick={handleReset}
            className={resetButtonClass}
            disabled={loading}
          >
            {resetText}
          </button>
        )}
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className={cancelButtonClass}
            disabled={loading}
          >
            {cancelText}
          </button>
        )}
        <button
          type="submit"
          className={submitButtonClass}
          disabled={loading}
        >
          {loading ? "Saving..." : submitText}
        </button>
      </div>
    </form>
  );
}
