// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();

    let result;
    if (isSignup) {
      result = await supabase.auth.signUp({
        email,
        password,
      });
    } else {
      result = await supabase.auth.signInWithPassword({
        email,
        password,
      });
    }

    if (result.error) {
      alert(result.error.message);
    } else {
      navigate("/dashboard");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleAuth}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4">
          {isSignup ? "Sign Up" : "Login"} to Uhub
        </h2>
        <input
          type="email"
          required
          placeholder="Email"
          className="w-full border px-3 py-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          required
          placeholder="Password"
          className="w-full border px-3 py-2 mb-4"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 w-full"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>
        <p
          className="text-sm text-blue-500 mt-4 text-center cursor-pointer"
          onClick={() => setIsSignup(!isSignup)}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign up"}
        </p>
      </form>
    </div>
  );
}
