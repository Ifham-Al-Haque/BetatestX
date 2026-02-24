import React from "react";

export default function ChartSelector({ chartType, setChartType }) {
  return (
    <div className="ml-auto">
      <span className="mr-2">Chart Type:</span>
      {["bar", "line", "pie", "scatter"].map((type) => (
        <button
          key={type}
          className={`px-4 py-2 rounded-md text-sm mr-2 border ${
            chartType === type
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-white"
          }`}
          onClick={() => setChartType(type)}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </button>
      ))}
    </div>
  );
}
