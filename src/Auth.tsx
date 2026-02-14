import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isRegistering) {
      // Register with username
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username,
            display_name: username,
          },
        },
      });

      if (error) {
        alert(error.message);
      } else {
        // Create profile in profiles table
        if (data.user) {
          const { error: profileError } = await supabase
            .from("profiles")
            .insert([
              {
                id: data.user.id,
                username: username,
                display_name: username,
                email: email,
              },
            ]);

          if (profileError) {
            console.error("Error creating profile:", profileError);
          }
        }

        alert("تم إنشاء الحساب بنجاح! يمكنك تسجيل الدخول الآن");
        setIsRegistering(false); // Switch to login mode
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        alert(error.message);
      } else {
        navigate("/");
      }
    }
    setLoading(false);
  };

  return (
    <div
      dir="rtl"
      className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 p-4"
    >
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-emerald-700 mb-2">
            {isRegistering ? "إنشاء حساب جديد" : "تسجيل الدخول"}
          </h2>
          <p className="text-gray-600">
            {isRegistering
              ? "أنشئ حسابك لمتابعة تقدمك في رمضان"
              : "سجل دخولك لمتابعة تقدمك"}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">
                اسم المستخدم
              </label>
              <input
                type="text"
                className="w-full p-3 border-2 border-emerald-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                placeholder="أدخل اسمك"
                dir="rtl"
              />
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className="w-full p-3 border-2 border-emerald-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="example@email.com"
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              كلمة المرور
            </label>
            <input
              type="password"
              className="w-full p-3 border-2 border-emerald-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="********"
              dir="ltr"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-3 rounded-lg font-bold hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                جاري التحميل...
              </span>
            ) : isRegistering ? (
              "تسجيل حساب"
            ) : (
              "دخول"
            )}
          </button>
        </form>

        <button
          onClick={() => {
            setIsRegistering(!isRegistering);
            setUsername(""); // Clear username when switching
          }}
          className="w-full mt-4 text-emerald-600 text-sm hover:underline py-2"
        >
          {isRegistering
            ? "لديك حساب بالفعل؟ سجل دخولك"
            : "ليس لديك حساب؟ أنشئ حساباً جديداً"}
        </button>
      </div>
    </div>
  );
}
