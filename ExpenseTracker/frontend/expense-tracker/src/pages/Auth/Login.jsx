import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Inputs";
import logo from "../../assets/images/logo.png"; // ✅ Correct logo import
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (email && password) {
        navigate("/dashboard");
      } else {
        setError("Please enter valid credentials.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    }
  };

  return (
    <AuthLayout>
      <div className="login-page-container">
        <div className="spline-container">
          {/* Replace with your actual Spline scene URL */}
          <iframe
            src="https://my.spline.design/udriveloginvisual-XfVzn95KcIBHjIdlrnLQh1Ek/"
            frameBorder="0"
            width="100%"
            height="100%"
            title="Udrive Spline Visual"
          ></iframe>
        </div>

        <div className="login-form-container">
          <img src={logo} alt="Udrive Logo" className="udrive-logo" /> {/* ✅ Correct usage */}
          <h3 className="text-xl font-semibold text-black text-center">
            Welcome Back to Udrive Expense
          </h3>
          <p className="text-sm text-gray-500 text-center mb-4">
            Please enter your credentials to access your account.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            <Input
              value={email}
              onChange={({ target }) => setEmail(target.value)}
              label="Email Address"
              placeholder="Enter your email"
              type="email"
            />
            <Input
              value={password}
              onChange={({ target }) => setPassword(target.value)}
              label="Password"
              placeholder="Enter your password"
              type="password"
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="login-button">
              Login
            </button>

            <p className="signup-redirect">
              Don't have an account?{" "}
              <span onClick={() => navigate("/auth/signup")}>Sign Up</span>
            </p>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default Login;

