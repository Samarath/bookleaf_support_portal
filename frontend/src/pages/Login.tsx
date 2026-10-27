import { useForm } from "react-hook-form";
import { useNavigate } from "@tanstack/react-router";
import { api } from "../api/axios";
import { useState } from "react";

type LoginForm = {
  email: string;
};

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    try {
      setIsLoading(true);
      setApiError("");
      const response = await api.post("/login", { email: data.email, password: "" });
      const { role, user } = response.data;
      
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", role);

      if (role === "ADMIN") {
        navigate({ to: "/admin" });
      } else {
        navigate({ to: "/author" });
      }
    } catch (error: any) {
      setApiError(error.response?.data?.detail || "Failed to login. Check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-md border border-gray-100">
        
        <div className="text-center mb-10">
          <div className="flex justify-center items-center gap-2 mb-4">
            {/* BookLeaf Logo Mark Simulation */}
            <div className="w-8 h-8 bg-[#E95C6A] rounded-sm transform -rotate-12"></div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              BookLeaf <span className="font-light">Publishing</span>
            </h1>
          </div>
          <p className="text-gray-500 font-medium">Sign in to the Support Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              {...register("email", { required: "Email is required" })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E95C6A] focus:border-transparent transition-all"
              placeholder="e.g., admin@bookleafpub.in"
              disabled={isLoading}
            />
            {errors.email && <p className="text-red-500 text-sm mt-2">{errors.email.message}</p>}
          </div>

          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-600 text-sm text-center font-medium">{apiError}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#E95C6A] text-white font-semibold py-3 rounded-lg hover:bg-[#d64d5a] transition-colors disabled:opacity-70 shadow-md hover:shadow-lg"
          >
            {isLoading ? "Signing in..." : "Continue to Portal"}
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 text-center">Test Credentials</p>
          <div className="text-sm text-gray-500 space-y-1 text-center">
            <p><span className="font-medium text-gray-700">Admin:</span> admin@bookleafpub.in</p>
            <p><span className="font-medium text-gray-700">Author:</span> priya.sharma@email.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}