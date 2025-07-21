// EmployeeList.jsx
import React from "react";
import EmployeeCard from "./EmployeeCard";

export default function EmployeeList({ employees }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {employees.map(emp => (
        <EmployeeCard key={emp.id} employee={emp} />
      ))}
    </div>
  );
}
