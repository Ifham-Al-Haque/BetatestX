// src/pages/Login.jsx
import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    try {
      if (isSignup) {
        // Sign up the user
        const { data: signupData, error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) {
          setErrorMsg("Signup failed: " + signupError.message);
          return;
        }

        // Auto-login after signup
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setErrorMsg("Auto-login failed: " + loginError.message);
          return;
        }

        // Insert employee record (optional)
        await supabase.from("employees").insert({
          id: loginData.user.id,
          name: email.split("@")[0],
          department: "Unassigned",
          role: "Employee",
        });

        setInfoMsg("Signed up and logged in!");
        navigate("/dashboard");

      } else {
        // Login user
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          setErrorMsg("Login failed: " + error.message);
          return;
        }

        setInfoMsg("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Auth error:", err.message);
      setErrorMsg(err.message || "Authentication failed.");
    }
  }

  async function resendConfirmationEmail() {
    setErrorMsg("");
    setInfoMsg("");

    if (!email) {
      setErrorMsg("Enter your email to resend confirmation.");
      return;
    }

    const { error } = await supabase.auth.resend({ type: "signup", email });

    if (error) {
      setErrorMsg("Failed to resend confirmation: " + error.message);
    } else {
      setInfoMsg("Confirmation email resent. Please check your inbox.");
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleAuth}
        className="bg-white p-8 rounded shadow-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">
          {isSignup ? "Sign Up" : "Login"} to Uhub
        </h2>

        {errorMsg && <p className="text-red-600 text-sm mb-2 text-center">{errorMsg}</p>}
        {infoMsg && <p className="text-green-600 text-sm mb-2 text-center">{infoMsg}</p>}

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full border px-3 py-2 mb-4 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Password"
          className="w-full border px-3 py-2 mb-4 rounded"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 w-full rounded hover:bg-blue-700"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        {!isSignup && (
          <p
            onClick={resendConfirmationEmail}
            className="text-sm text-blue-600 mt-3 text-center cursor-pointer hover:underline"
          >
            Resend confirmation email
          </p>
        )}

        <p
          className="text-sm text-blue-500 mt-4 text-center cursor-pointer hover:underline"
          onClick={() => {
            setIsSignup(!isSignup);
            setErrorMsg("");
            setInfoMsg("");
          }}
        >
          {isSignup
            ? "Already have an account? Login"
            : "Don't have an account? Sign up"}
        </p>
      </form>
    </div>
  );
}
