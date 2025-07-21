import React from "react";
import { motion, AnimatePresence } from "framer-motion";

export function DepartmentBreakdown({ show, toggle, data }) {
  return (
    <>
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-full font-medium transition ${
          show
            ? "bg-blue-600 text-white hover:bg-blue-700"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
        }`}
      >
        {show ? "Hide" : "Show"} Department Breakdown
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            key="department-breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border mb-6 mt-2">
              <h3 className="text-lg font-semibold mb-2">Department-wise Expense</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.map((dept) => (
                  <li key={dept.department} className="text-sm">
                    <strong>{dept.department}:</strong> AED {dept.total}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export function YearlyBreakdown({ show, toggle, data }) {
  return (
    <>
      <button
        onClick={toggle}
        className={`px-4 py-2 rounded-full font-medium transition ${
          show
            ? "bg-green-600 text-white hover:bg-green-700"
            : "bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-white"
        }`}
      >
        {show ? "Hide" : "Show"} Yearly Breakdown
      </button>

      <AnimatePresence>
        {show && (
          <motion.div
            key="yearly-breakdown"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border mt-2">
              <h3 className="text-lg font-semibold mb-2">Year-wise Expense</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {data.map((yr) => (
                  <li key={yr.year} className="text-sm">
                    <strong>{yr.year}:</strong> AED {yr.total}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
