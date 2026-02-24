import React, { useState, useEffect } from "react";

export default function Filters({
  departments,
  years,
  departmentFilter,
  setDepartmentFilter,
  yearFilter,
  setYearFilter,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onResetFilters,
}) {
  // Simple date validation helper
  const [dateError, setDateError] = useState("");

  useEffect(() => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setDateError("Start date cannot be after end date.");
    } else {
      setDateError("");
    }
  }, [startDate, endDate]);

  return (
    <div className="flex flex-wrap gap-4 items-end mb-6">
      <div>
        <label className="mr-2 font-semibold">Filter by Department:</label>
        <select
          className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          {departments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mr-2 font-semibold">Filter by Year:</label>
        <select
          className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
        >
          {years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mr-2 font-semibold">Start Date:</label>
        <input
          type="date"
          className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </div>

      <div>
        <label className="mr-2 font-semibold">End Date:</label>
        <input
          type="date"
          className="p-2 rounded border dark:bg-gray-700 dark:text-white"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
      </div>

      <button
        onClick={onResetFilters}
        className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500"
      >
        Reset Filters
      </button>

      {dateError && (
        <p className="text-red-600 text-sm ml-4 font-semibold">{dateError}</p>
      )}
    </div>
  );
}
