import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layouts/AuthLayout";
import Input from "../../components/Inputs/Inputs";
import logo from "../../assets/images/logo.png";
import carImage from "../../assets/images/MG2024.png";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    if (email && password) {
      navigate("/dashboard");
    } else {
      setError("Please enter valid credentials.");
    }
  };

  return (
    <AuthLayout>
      <div className="login-page-container night-mode">
        <div className="animation-section">
          <div className="stars"></div>
          <div className="car-container hover-glow">
            <img src={carImage} alt="Animated Car" className="animated-car" />
            <div className="headlights"></div>
            <div className="smoke"></div>
            <div className="smoke smoke-delay"></div>
          </div>
        </div>

        <div className="login-form-container">
          <img src={logo} alt="Udrive Logo" className="udrive-logo" />
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
            <button type="submit" className="login-button">Login</button>
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

