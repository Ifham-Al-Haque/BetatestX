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
        const { error: signupError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signupError) {
          setErrorMsg("Signup failed: " + signupError.message);
          return;
        }

        const { data: loginData, error: loginError } =
          await supabase.auth.signInWithPassword({
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
        const { error } = await supabase.auth.signInWithPassword({
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-500 via-blue-600 to-green-400 p-4">
      <form
        onSubmit={handleAuth}
        className="bg-white dark:bg-gray-900 p-8 rounded-xl shadow-2xl w-full max-w-md text-center"
      >
        <img
          src="/Udrivehub.png"
          alt="Uhub Logo"
          className="mx-auto w-24 h-24 mb-4"
        />
        <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white italic">
          {isSignup ? "Sign Up" : "Login"} to Uhub
        </h2>

        {errorMsg && (
          <p className="text-red-600 text-sm mb-2 transition duration-300">{errorMsg}</p>
        )}
        {infoMsg && (
          <p className="text-green-600 text-sm mb-2 transition duration-300">{infoMsg}</p>
        )}

        <input
          type="email"
          required
          placeholder="Email"
          className="w-full p-3 rounded-lg border mb-3 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          required
          placeholder="Password"
          className="w-full p-3 rounded-lg border mb-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="w-full py-3 rounded-lg font-semibold bg-gradient-to-r from-pink-500 via-blue-600 to-green-400 text-white shadow-md hover:opacity-90 transition"
        >
          {isSignup ? "Sign Up" : "Login"}
        </button>

        {!isSignup && (
          <>
            <p
              onClick={resendConfirmationEmail}
              className="text-sm text-blue-600 mt-3 cursor-pointer hover:underline"
            >
              Resend confirmation email
            </p>

            <p
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-blue-600 mt-2 cursor-pointer hover:underline"
            >
              Forgot Password?
            </p>
          </>
        )}

        <p
          className="text-sm text-blue-500 mt-4 cursor-pointer hover:underline"
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

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-sm">
            <h3 className="text-lg font-semibold mb-4 text-center text-gray-800 dark:text-white">
              Reset Password
            </h3>
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full p-3 rounded border bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
            />
            <div className="flex justify-between gap-4">
              <button
                onClick={handleForgotPassword}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Send Link
              </button>
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotEmail("");
                }}
                className="w-full bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white"
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

