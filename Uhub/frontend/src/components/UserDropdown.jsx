import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function UserDropdown() {
  const [email, setEmail] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setEmail(data?.user?.email || "");
    }

    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <div className="relative text-right">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-sm bg-gray-800 text-white px-4 py-2 rounded hover:bg-gray-700"
      >
        {email || "User"}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow-md z-10">
          <div className="px-4 py-2 text-sm text-gray-600 border-b">{email}</div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
