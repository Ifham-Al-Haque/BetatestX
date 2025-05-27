import React from "react";

const Login = () => {
  return (
    <AuthLayout>
      <div className="lg:w-[70%] h-3/4 md:h-full flex flex-col justify-center items-center mx-auto">
      <h3 className="text-xl font-semibold text-black"> Welcome Back To Udrive Expense </h3>
      <p className="text-sm text-gray-500">s
        Please enter your credentials to access your account. If you don't have an account, please sign up.
      </p>
      </div>
    </AuthLayout>
  );
}
export default Login;