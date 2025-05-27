import React from "react";
import { useState } from "react";
import { gapi } from "gapi-script";
import { useEffect } from "react";
import { useSelector } from "react-redux";


const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  

  export default SignUp;