import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabaseClient";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    email: "",
    password: "",
    username: "",
  });

  // Check for saved email on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  // Clear error message after 5 seconds
  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [errorMessage]);

  const validateInputs = () => {
    const errors = {
      email: "",
      password: "",
      username: "",
    };
    let isValid = true;

    // Email validation
    if (!email) {
      errors.email = "البريد الإلكتروني مطلوب";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errors.email = "البريد الإلكتروني غير صحيح";
      isValid = false;
    }

    // Password validation
    if (!password) {
      errors.password = "كلمة المرور مطلوبة";
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "كلمة المرور يجب أن تكون 6 أحرف على الأقل";
      isValid = false;
    }

    // Username validation for registration
    if (isRegistering && !username) {
      errors.username = "اسم المستخدم مطلوب";
      isValid = false;
    } else if (isRegistering && username.length < 3) {
      errors.username = "اسم المستخدم يجب أن يكون 3 أحرف على الأقل";
      isValid = false;
    }

    setFieldErrors(errors);
    return isValid;
  };

  const getArabicErrorMessage = (error: any): string => {
    const errorCode = error?.message || error?.error_description || "";

    // Authentication errors
    if (errorCode.includes("Invalid login credentials")) {
      return "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة";
    }
    if (errorCode.includes("Email not confirmed")) {
      return "📧 لم يتم تأكيد البريد الإلكتروني بعد. الرجاء التحقق من بريدك الإلكتروني";
    }
    if (errorCode.includes("User already registered")) {
      return "👤 هذا البريد الإلكتروني مسجل بالفعل";
    }
    if (errorCode.includes("Password should be at least 6 characters")) {
      return "🔑 كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    }
    if (errorCode.includes("Unable to validate email address")) {
      return "📧 البريد الإلكتروني غير صحيح";
    }
    if (errorCode.includes("Email rate limit exceeded")) {
      return "⏰ تم تجاوز الحد المسموح. الرجاء المحاولة لاحقاً";
    }
    if (errorCode.includes("Network request failed")) {
      return "🌐 خطأ في الاتصال بالإنترنت. الرجاء التحقق من اتصالك";
    }
    if (errorCode.includes("Invalid email")) {
      return "📧 البريد الإلكتروني غير صحيح";
    }
    if (errorCode.includes("Too many requests")) {
      return "⏰ تم تجاوز الحد المسموح. الرجاء المحاولة لاحقاً";
    }

    // Default error
    return `❌ حدث خطأ: ${errorCode}`;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validate inputs
    if (!validateInputs()) {
      return;
    }

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
        setErrorMessage(getArabicErrorMessage(error));
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

        // Show success message
        setErrorMessage(
          "✅ تم إنشاء الحساب بنجاح! الرجاء التحقق من بريدك الإلكتروني للتفعيل",
        );

        // Clear form and switch to login after 3 seconds
        setTimeout(() => {
          setIsRegistering(false);
          setUsername("");
          setErrorMessage(null);
        }, 3000);
      }
    } else {
      // Login
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMessage(getArabicErrorMessage(error));
      } else {
        // Save email if remember me is checked
        if (rememberMe) {
          localStorage.setItem("rememberedEmail", email);
        } else {
          localStorage.removeItem("rememberedEmail");
        }

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

        {/* Error/Success Message */}
        {errorMessage && (
          <div
            className={`mb-4 p-3 rounded-lg text-center ${
              errorMessage.includes("✅")
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
            }`}
          >
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-gray-700 mb-2 font-semibold">
                اسم المستخدم
              </label>
              <input
                type="text"
                className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300 ${
                  fieldErrors.username
                    ? "border-red-500 focus:border-red-500"
                    : "border-emerald-100 focus:border-emerald-500"
                }`}
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setFieldErrors({ ...fieldErrors, username: "" });
                }}
                required
                placeholder="أدخل اسمك"
                dir="rtl"
              />
              {fieldErrors.username && (
                <p className="text-red-500 text-sm mt-1">
                  {fieldErrors.username}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300 ${
                fieldErrors.email
                  ? "border-red-500 focus:border-red-500"
                  : "border-emerald-100 focus:border-emerald-500"
              }`}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors({ ...fieldErrors, email: "" });
              }}
              required
              placeholder="example@email.com"
              dir="ltr"
            />
            {fieldErrors.email && (
              <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
            )}
          </div>

          <div>
            <label className="block text-gray-700 mb-2 font-semibold">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className={`w-full p-3 border-2 rounded-lg focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300 pr-10 ${
                  fieldErrors.password
                    ? "border-red-500 focus:border-red-500"
                    : "border-emerald-100 focus:border-emerald-500"
                }`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors({ ...fieldErrors, password: "" });
                }}
                required
                placeholder="********"
                dir="ltr"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-emerald-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
            {fieldErrors.password && (
              <p className="text-red-500 text-sm mt-1">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {!isRegistering && (
            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 accent-emerald-600 cursor-pointer"
                />
                <span className="text-gray-700 text-sm mr-2">تذكرني</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  // Forgot password functionality can be added here
                  alert("سيتم إضافة خاصية إعادة تعيين كلمة المرور قريباً");
                }}
                className="text-sm text-emerald-600 hover:underline"
              >
                نسيت كلمة المرور؟
              </button>
            </div>
          )}

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
            setPassword(""); // Clear password
            setErrorMessage(null); // Clear error message
            setFieldErrors({ email: "", password: "", username: "" }); // Clear field errors
          }}
          className="w-full mt-4 text-emerald-600 text-sm hover:cursor-pointer hover:underline py-2"
        >
          {isRegistering
            ? "لديك حساب بالفعل؟ سجل دخولك"
            : "ليس لديك حساب؟ أنشئ حساباً جديداً"}
        </button>
      </div>
    </div>
  );
}
