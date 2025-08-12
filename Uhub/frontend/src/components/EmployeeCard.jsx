import React from "react";

export default function EmployeeCard({ employee }) {
  const { full_name, profile_pic_url, position, email } = employee;

  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg shadow">
      {profile_pic_url ? (
        <img
          key={`${employee.id}-${profile_pic_url}`}
          src={profile_pic_url}
          alt={full_name}
          className="w-12 h-12 rounded-full object-cover"
          data-employee-id={employee.id}
          onError={(e) => {
            console.log(`Failed to load image for ${full_name}: ${profile_pic_url}`);
            // Fallback to Avatar with initials
            e.target.style.display = 'none';
            const container = e.target.parentElement;
            if (container) {
              container.innerHTML = `
                <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <span class="text-sm font-medium text-blue-600">
                    ${full_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
              `;
            }
          }}
          onLoad={() => {
            console.log(`Successfully loaded image for ${full_name}: ${profile_pic_url}`);
          }}
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">
            {full_name?.charAt(0)?.toUpperCase() || "?"}
          </span>
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
