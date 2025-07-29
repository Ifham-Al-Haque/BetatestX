import React from "react";
import Avatar from "react-avatar";

export default function EmployeeCard({ employee }) {
  const { full_name, profile_pic_url, position, email } = employee;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow">
      <Avatar
        src={profile_pic_url || null}
        name={full_name}
        size="50"
        round={true}
      />
      <div>
        <h2 className="text-lg font-semibold">{full_name}</h2>
        <p className="text-sm text-gray-600">{position}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}
