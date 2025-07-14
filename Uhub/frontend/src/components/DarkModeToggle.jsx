import { useEffect, useState } from "react";

export default function DarkModeToggle() {
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem("theme") === "dark"
  );

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  return (
    <button
      onClick={() => setDarkMode(!darkMode)}
      className="ml-4 px-3 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
      aria-label="Toggle Dark Mode"
    >
      {darkMode ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}
