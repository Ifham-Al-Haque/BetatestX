// src/pages/EmployeeCard.jsx
import React from "react";

export default function EmployeeCard({ employee }) {
  return (
    <div className="border rounded-lg p-4 shadow-md">
      <h2 className="font-bold text-lg">{employee.name}</h2>
      <p>Email: {employee.email}</p>
      <p>Department: {employee.department}</p>
    </div>
  );
}
