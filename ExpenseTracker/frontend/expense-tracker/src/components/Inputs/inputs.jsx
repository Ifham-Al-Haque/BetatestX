import React from "react";


const Input = ({ label, type = "text", placeholder, value, onChange }) => {
  return (
    <div className="flex flex-col mb-4">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}


export default Input;
