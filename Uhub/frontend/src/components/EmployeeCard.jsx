import React, { useState } from "react";

export default function EmployeeCard({ employee }) {
  const { full_name, profile_pic_url, position, email } = employee;
  const [imgFailed, setImgFailed] = useState(false);

  const initial = full_name?.charAt(0)?.toUpperCase() || "?";

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow">
      {profile_pic_url && !imgFailed ? (
        <img
          key={`${employee.id}-${profile_pic_url}`}
          src={profile_pic_url}
          alt={full_name}
          className="w-12 h-12 rounded-full object-cover"
          data-employee-id={employee.id}
          onError={() => {
            console.log(`Failed to load image for ${full_name}: ${profile_pic_url}`);
            setImgFailed(true);
          }}
          onLoad={() => {
            console.log(`Successfully loaded image for ${full_name}: ${profile_pic_url}`);
          }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">{initial}</span>
        </div>
      )}
      <div>
        <h2 className="text-lg font-semibold">{full_name}</h2>
        <p className="text-sm text-gray-600">{position}</p>
        <p className="text-sm text-gray-500">{email}</p>
      </div>
    </div>
  );
}
