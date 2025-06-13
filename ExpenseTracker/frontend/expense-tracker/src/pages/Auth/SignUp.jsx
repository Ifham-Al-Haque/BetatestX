import React, { useState, useEffect } from "react";
import { gapi } from "gapi-script";
import { useNavigate } from "react-router-dom";
import { validateEmail } from "../../utils/helper"; // Assumes you have this

const SignUp = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  useEffect(() => {
    function start() {
      gapi.client.init({
        clientId: "YOUR_GOOGLE_CLIENT_ID", // Replace with your real Google OAuth Client ID
        scope: "",
      });
    }
    gapi.load("client:auth2", start);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    console.log("Form submitted:", { name, email, password });


    // Validate email format
    if (!validateEmail(email)) {
      setError("Invalid email format.");
      return;
    }

    // Restrict to @udrive.ae domain
    if (!email.endsWith("@udrive.ae")) {
      setError("Only @udrive.ae emails are allowed for registration.");
      return;
    }

    // Password match check
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setError(""); // Clear errors
    console.log("Form submitted:", formData);

    // TODO: Send data to backend or sign up API

    // Redirect on success
    navigate("/dashboard");
  };

  return (
    <AuthLayout>
    <div>
      <h2>Sign Up</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        /><br />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        /><br />
        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        /><br />
        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={formData.confirmPassword}
          onChange={handleChange}
          required
        /><br />
        <button type="submit">Sign Up</button>
      </form>
    </div>
    </AuthLayout>
  );
};

export default SignUp;
