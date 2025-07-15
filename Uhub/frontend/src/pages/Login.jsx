import { useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");

  const navigate = useNavigate();

  async function handleAuth(e) {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    try {
      if (isSignup) {
        const { error: signupError } = await supabase.auth.signUp({ email, password });

        if (signupError) {
          setErrorMsg("Signup failed: " + signupError.message);
          return;
        }

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (loginError) {
          setErrorMsg("Auto-login failed: " + loginError.message);
          return;
        }

        await supabase.from("employees").insert({
          id: loginData.user.id,
          name: email.split("@")[0],
          department: "Unassigned",
          role: "Employee",
        });

        setInfoMsg("Signed up and logged in!");
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          setErrorMsg("Login failed: " + error.message);
          return;
        }

        setInfoMsg("Login successful!");
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err.message || "Authentication failed.");
    }
  }

  async function handleForgotPassword() {
    setErrorMsg("");
    setInfoMsg("");

    if (!forgotEmail) {
      setErrorMsg("Please enter an email to reset your password.");
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setErrorMsg("Password reset failed: " + error.message);
    } else {
      setInfoMsg("Password reset link sent. Check your email.");
      setShowForgotPassword(false);
      setForgotEmail("");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB] px-4">
      <form
        onSubmit={handleAuth}
        className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md text-center"
      >
        <img src="/Uhub.png" alt="Uhub Logo" className="mx-auto w-24 h-24 mb-4" />

        <h2 className="text-2xl font-bold italic mb-4 text-[#1E3A8A]">
          {isSignup ? "Sign Up" : "Login"} to Uhub
        </h2>

        {errorMsg && <p className="text-red-600 text-sm mb-2">{errorMsg}</p>}
        {infoMsg && <p className="text-green-600 text-sm mb-2">{infoMsg}</p>}

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full p-3 rounded-lg border border-gray-300 mb-3 bg-gray-100"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Password"
          className="w-full p-3 rounded-lg border border-gray-300 mb-4 bg-gray-100"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-[#10B981] to-[#2563EB] text-white hover:opacity-90 transition"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        {!isSignup && (
          <p
            onClick={() => setShowForgotPassword(true)}
            className="text-sm text-[#1E3A8A] mt-3 cursor-pointer hover:underline"
          >
            Forgot Password?
          </p>
        )}

        <p
          className="text-sm text-[#1E3A8A] mt-4 cursor-pointer hover:underline"
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

      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center text-[#1E3A8A]">
              Reset Password
            </h3>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded border bg-gray-100 mb-4"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <div className="flex justify-between gap-4">
              <button
                onClick={handleForgotPassword}
                className="w-full bg-[#2563EB] text-white py-2 rounded hover:bg-blue-700"
              >
                Send Link
              </button>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                }}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
