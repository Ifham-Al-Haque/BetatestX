import React, { useState } from "react";

const ITEMS_PER_PAGE = 10;

export default function PaginatedTable({ data }) {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const currentItems = data.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border mb-6 overflow-x-auto">
      <h3 className="text-lg font-semibold mb-4">Detailed Expenses</h3>
      <table className="min-w-full table-auto border-collapse border border-gray-300 dark:border-gray-700">
        <thead>
          <tr className="bg-gray-100 dark:bg-gray-700">
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Date Paid</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Department</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left">Service Name</th>
            <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-right">Amount (AED)</th>
          </tr>
        </thead>
        <tbody>
          {currentItems.map((item, idx) => (
            <tr
              key={item.id || idx}
              className={idx % 2 === 0 ? "bg-white dark:bg-gray-900" : "bg-gray-50 dark:bg-gray-800"}
            >
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                {item.date_paid ? new Date(item.date_paid).toLocaleDateString() : "Unknown"}
              </td>
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">{item.department || "Unassigned"}</td>
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">{item.service_name || "Unknown"}</td>
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 text-right">
                {(Number(item.amount_aed) || 0).toFixed(2)}
              </td>
            </tr>
          ))}
          {currentItems.length === 0 && (
            <tr>
              <td colSpan={4} className="text-center py-4 text-gray-500">
                No expenses found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className={`px-4 py-2 rounded ${
            page === 1 ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Previous
        </button>
        <span className="text-sm mt-2">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className={`px-4 py-2 rounded ${
            page === totalPages ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}
