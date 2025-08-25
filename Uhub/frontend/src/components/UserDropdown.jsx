import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, LogOut, ChevronRight } from "lucide-react";

export default function UserDropdown() {
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <div className="relative text-right">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center space-x-3 p-3 bg-pink-100 hover:bg-pink-200 rounded-full transition-all duration-200 cursor-pointer"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] rounded-full flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">{userProfile?.full_name || user?.email || "User"}</p>
          <p className="text-xs text-gray-500 capitalize">{userProfile?.role || "User"}</p>
        </div>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDropdown ? 'rotate-90' : ''}`} />
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="px-4 py-3 text-sm text-gray-600 border-b border-gray-200">
            {userProfile?.full_name || user?.email || "User"}
          </div>
          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 flex items-center gap-2 transition-colors duration-200"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
