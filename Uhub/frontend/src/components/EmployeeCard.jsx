import React from "react";
import Avatar from "react-avatar";

export default function EmployeeCard({ employee }) {
  const { name, image_url, position, email } = employee;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow">
      <Avatar
        src={image_url || null}
        name={name}
        size="50"
        round={true}
      />
      <div>
        <h2 className="text-lg font-semibold">{name}</h2>
        <p className="text-sm text-gray-600">{position}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}
