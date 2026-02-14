import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/supabaseClient";
import Auth from "./Auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  FaMoon,
  FaBook,
  FaPray,
  FaStar,
  FaSignOutAlt,
  FaCheckCircle,
  FaCalendarAlt,
  FaChartBar,
  FaHome,
  FaUsers,
  FaQuran,
  FaMosque,
  FaSun,
  FaUserCircle,
  FaPrayingHands,
  FaStarAndCrescent,
} from "react-icons/fa";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Define the shape of our data
interface DayData {
  tarawih: boolean;
  sunan: boolean;
  witr: boolean;
  mudarasa: number;
  azkar: boolean;
  reading: number;
}

interface UserProfile {
  id: string;
  email: string;
  name?: string;
}

// Define types for user comparison data
interface UserComparisonData {
  userId: string;
  userName: string;
  tarawih: number;
  sunan: number;
  witr: number;
  azkar: number;
  reading: number;
  mudarasa: number;
  totalDays: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"tracker" | "stats">("tracker");
  const [selectedCategory, setSelectedCategory] = useState<string>("tarawih");
  const [formData, setFormData] = useState<DayData>({
    tarawih: false,
    sunan: false,
    witr: false,
    mudarasa: 0,
    azkar: false,
    reading: 0,
  });
  const [userComparisonData, setUserComparisonData] = useState<
    UserComparisonData[]
  >([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [totalUniqueUsers, setTotalUniqueUsers] = useState<number>(0);
  const [userStats, setUserStats] = useState({
    totalDays: 0,
    tarawihCount: 0,
    sunanCount: 0,
    witrCount: 0,
    azkarCount: 0,
    totalReading: 0,
    totalMudarasa: 0,
    completionRate: 0,
  });

  // Colors for bars
  const COLORS = [
    "#059669",
    "#10b981",
    "#34d399",
    "#6ee7b7",
    "#0369a1",
    "#0ea5e9",
  ];

  // Category options for dropdown
  const categories = [
    {
      id: "tarawih",
      name: "صلاة التراويح",
      icon: <FaPray />,
      color: "#059669",
    },
    { id: "sunan", name: "السنن الرواتب", icon: <FaStar />, color: "#10b981" },
    { id: "witr", name: "صلاة الوتر", icon: <FaMoon />, color: "#34d399" },
    { id: "azkar", name: "الأذكار", icon: <FaSun />, color: "#6ee7b7" },
    {
      id: "reading",
      name: "القراءة (صفحات)",
      icon: <FaQuran />,
      color: "#0369a1",
    },
    {
      id: "mudarasa",
      name: "المدارسة (مرات)",
      icon: <FaBook />,
      color: "#0ea5e9",
    },
  ];

  // Check if user is logged in and get profile
  // In the useEffect for user profile
  useEffect(() => {
    const initializeUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) {
        // Fetch user profile from profiles table
        const { data: profile } = await supabase
          .from("profiles")
          .select("username, display_name")
          .eq("id", session.user.id)
          .single();

        setUserProfile({
          id: session.user.id,
          email: session.user.email || "",
          name:
            profile?.display_name ||
            profile?.username ||
            session.user.email?.split("@")[0] ||
            "مستخدم",
        });
      }

      setLoading(false);

      if (!session) {
        navigate("/auth");
      }
    };

    initializeUser();
  }, [navigate]);

  // Load data when the day changes
  useEffect(() => {
    if (session) {
      fetchData();
    }
  }, [selectedDay, session]);

  // Load user stats
  useEffect(() => {
    if (session) {
      fetchUserStats();
      fetchUserComparisonData();
    }
  }, [session]);

  const fetchData = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("daily_tracker")
      .select("*")
      .eq("user_id", user.id)
      .eq("day_number", selectedDay)
      .single();

    if (data) {
      setFormData({
        tarawih: data.tarawih,
        sunan: data.sunan,
        witr: data.witr,
        mudarasa: data.mudarasa,
        azkar: data.azkar,
        reading: data.reading,
      });
    } else {
      setFormData({
        tarawih: false,
        sunan: false,
        witr: false,
        mudarasa: 0,
        azkar: false,
        reading: 0,
      });
    }
  };

  const fetchUserStats = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("daily_tracker")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      const totalDays = data.length;
      const tarawihCount = data.filter((d) => d.tarawih).length;
      const sunanCount = data.filter((d) => d.sunan).length;
      const witrCount = data.filter((d) => d.witr).length;
      const azkarCount = data.filter((d) => d.azkar).length;
      const totalReading = data.reduce((sum, d) => sum + (d.reading || 0), 0);
      const totalMudarasa = data.reduce((sum, d) => sum + (d.mudarasa || 0), 0);

      const completedDays = data.filter(
        (d) => d.tarawih && d.sunan && d.witr && d.azkar,
      ).length;
      const completionRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      setUserStats({
        totalDays,
        tarawihCount,
        sunanCount,
        witrCount,
        azkarCount,
        totalReading,
        totalMudarasa,
        completionRate,
      });
    }
  };

  const fetchUserComparisonData = async () => {
    setStatsLoading(true);

    // Get all profiles with their stats
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, username, display_name");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      toast.error("خطأ في تحميل بيانات المستخدمين");
      setStatsLoading(false);
      return;
    }

    // Get all daily tracker data
    const { data: trackerData, error: trackerError } = await supabase
      .from("daily_tracker")
      .select("*");

    if (trackerError) {
      console.error("Error fetching tracker data:", trackerError);
      toast.error("خطأ في تحميل بيانات المتابعة");
      setStatsLoading(false);
      return;
    }

    // Create a map to aggregate data by user
    const userMap = new Map<string, UserComparisonData>();

    // Initialize with all profiles
    profiles.forEach((profile: any) => {
      userMap.set(profile.id, {
        userId: profile.id,
        userName: profile.display_name || profile.username || "مستخدم",
        tarawih: 0,
        sunan: 0,
        witr: 0,
        azkar: 0,
        reading: 0,
        mudarasa: 0,
        totalDays: 0,
      });
    });

    // Aggregate tracker data
    trackerData.forEach((entry: any) => {
      const userData = userMap.get(entry.user_id);
      if (userData) {
        userData.totalDays++;
        if (entry.tarawih) userData.tarawih++;
        if (entry.sunan) userData.sunan++;
        if (entry.witr) userData.witr++;
        if (entry.azkar) userData.azkar++;
        userData.reading += entry.reading || 0;
        userData.mudarasa += entry.mudarasa || 0;
      }
    });

    // Convert map to array and filter out users with no data
    const comparisonArray = Array.from(userMap.values())
      .filter((user) => user.totalDays > 0)
      .sort((a, b) => {
        const category = selectedCategory as keyof UserComparisonData;
        return (b[category] as number) - (a[category] as number);
      });

    setUserComparisonData(comparisonArray);
    setTotalUniqueUsers(comparisonArray.length);
    setStatsLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("الرجاء تسجيل الدخول أولاً");
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("daily_tracker").upsert({
      user_id: user.id,
      day_number: selectedDay,
      ...formData,
    });

    if (error) {
      toast.error("حدث خطأ في الحفظ");
    } else {
      toast.success("تم الحفظ بنجاح! 🎉");
      fetchUserStats();
      fetchUserComparisonData();
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("تم تسجيل الخروج بنجاح");
  };

  // Get data for the selected category
  const getCategoryData = () => {
    return userComparisonData.map((user) => ({
      name:
        user.userName.length > 10
          ? user.userName.substring(0, 10) + "..."
          : user.userName,
      value: user[selectedCategory as keyof UserComparisonData] as number,
      fullName: user.userName,
    }));
  };

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-700 mx-auto mb-4"></div>
          <div className="text-emerald-700 text-xl font-semibold">
            جاري التحميل...
          </div>
        </div>
      </div>
    );
  }

  // If no session (should be redirected, but just in case)
  if (!session) {
    return <Auth />;
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-gradient-to-br from-gray-50 to-emerald-50 font-sans"
    >
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={true}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      {/* Header */}
      <header className="bg-gradient-to-l from-emerald-800 to-emerald-600 text-white shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3 space-x-reverse">
              <FaMoon className="text-3xl" />
              <h1 className="text-2xl md:text-3xl font-bold">مُتابع رمضان</h1>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-4 space-x-reverse">
              <div className="text-left">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <FaUserCircle className="text-2xl" />
                  <span className="font-semibold">
                    {userProfile?.name || "مستخدم"}
                  </span>
                </div>
                <div className="text-xs text-emerald-100">
                  {userProfile?.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 space-x-reverse bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <FaSignOutAlt />
                <span>تسجيل خروج</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 mt-6">
        <div className="flex justify-center space-x-4 space-x-reverse">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === "tracker"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-emerald-50"
            }`}
          >
            <FaHome />
            <span>المتابعة اليومية</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center space-x-2 space-x-reverse px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === "stats"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-emerald-50"
            }`}
          >
            <FaChartBar />
            <span>الإحصائيات</span>
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8">
        {activeTab === "tracker" ? (
          <>
            {/* User Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<FaCalendarAlt />}
                label="الأيام المسجلة"
                value={userStats.totalDays}
                color="emerald"
              />
              <StatCard
                icon={<FaPray />}
                label="التراويح"
                value={userStats.tarawihCount}
                color="green"
              />
              <StatCard
                icon={<FaStar />}
                label="السنن"
                value={userStats.sunanCount}
                color="teal"
              />
              <StatCard
                icon={<FaMoon />}
                label="الوتر"
                value={userStats.witrCount}
                color="cyan"
              />
              <StatCard
                icon={<FaSun />}
                label="الأذكار"
                value={userStats.azkarCount}
                color="amber"
              />
              <StatCard
                icon={<FaQuran />}
                label="صفحات القرآن"
                value={userStats.totalReading}
                color="blue"
              />
              <StatCard
                icon={<FaBook />}
                label="مرات المدارسة"
                value={userStats.totalMudarasa}
                color="indigo"
              />
              <StatCard
                icon={<FaCheckCircle />}
                label="نسبة الإنجاز"
                value={`${userStats.completionRate}%`}
                color="purple"
              />
            </div>

            {/* Daily Tracker Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-emerald-700 text-white px-6 py-4">
                <h2 className="text-xl font-bold flex items-center">
                  <FaMosque className="ml-2" />
                  متابعة اليوم {selectedDay} من رمضان
                </h2>
              </div>

              <div className="p-6">
                {/* Day Selection Buttons */}
                <div className="mb-6">
                  <label className="block mb-3 font-semibold text-gray-700">
                    اختر اليوم:
                  </label>
                  <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`
                          p-2 rounded-lg font-semibold transition-all duration-300
                          ${
                            selectedDay === day
                              ? "bg-emerald-600 text-white shadow-lg scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
                          }
                        `}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <CheckRow
                      icon={<FaPray />}
                      label="صلاة التراويح"
                      checked={formData.tarawih}
                      onChange={(v) => setFormData({ ...formData, tarawih: v })}
                    />
                    <CheckRow
                      icon={<FaStar />}
                      label="السنن الرواتب"
                      checked={formData.sunan}
                      onChange={(v) => setFormData({ ...formData, sunan: v })}
                    />
                    <CheckRow
                      icon={<FaMoon />}
                      label="صلاة الوتر"
                      checked={formData.witr}
                      onChange={(v) => setFormData({ ...formData, witr: v })}
                    />
                    <CheckRow
                      icon={<FaSun />}
                      label="أذكار الصباح والمساء"
                      checked={formData.azkar}
                      onChange={(v) => setFormData({ ...formData, azkar: v })}
                    />
                  </div>
                  <div className="space-y-3">
                    <NumberRow
                      icon={<FaBook />}
                      label="المدارسة (عدد المرات)"
                      value={formData.mudarasa}
                      onChange={(v) =>
                        setFormData({ ...formData, mudarasa: v })
                      }
                    />
                    <NumberRow
                      icon={<FaQuran />}
                      label="القراءة اليومية (عدد الصفحات)"
                      value={formData.reading}
                      onChange={(v) => setFormData({ ...formData, reading: v })}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-8 bg-gradient-to-l from-emerald-600 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
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
                      جاري الحفظ...
                    </span>
                  ) : (
                    "حفظ الإنجاز"
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Stats Tab */
          <div className="space-y-8">
            {/* Global Stats Header */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                <FaUsers className="ml-3 text-emerald-600" />
                مقارنة بين المستخدمين
              </h2>
              <p className="text-gray-600">
                عرض أداء كل مستخدم في الفئات المختلفة
              </p>
            </div>

            {/* Category Selector */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <label className="block mb-2 font-semibold text-gray-700">
                اختر الفئة للمقارنة:
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`
                      flex items-center justify-center space-x-2 space-x-reverse p-3 rounded-lg transition-all duration-300
                      ${
                        selectedCategory === cat.id
                          ? "bg-emerald-600 text-white shadow-lg scale-105"
                          : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
                      }
                    `}
                    style={{
                      borderRight:
                        selectedCategory === cat.id
                          ? "none"
                          : `4px solid ${cat.color}`,
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span className="text-sm">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {statsLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-700"></div>
              </div>
            ) : (
              <>
                {/* User Comparison Chart */}
                {userComparisonData.length > 0 && (
                  <div className="bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2 flex items-center">
                      <span
                        className="ml-2"
                        style={{
                          color: categories.find(
                            (c) => c.id === selectedCategory,
                          )?.color,
                        }}
                      >
                        {
                          categories.find((c) => c.id === selectedCategory)
                            ?.icon
                        }
                      </span>
                      {categories.find((c) => c.id === selectedCategory)?.name}{" "}
                      - مقارنة بين المستخدمين
                    </h2>
                    <div className="h-96 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={getCategoryData()}
                          layout="vertical"
                          margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis
                            type="category"
                            dataKey="name"
                            width={100}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip
                            formatter={(value: any) => [value, "القيمة"]}
                            labelFormatter={(label: any) =>
                              `المستخدم: ${label}`
                            }
                          />
                          <Bar
                            dataKey="value"
                            fill={
                              categories.find((c) => c.id === selectedCategory)
                                ?.color || "#059669"
                            }
                            radius={[0, 4, 4, 0]}
                          >
                            {getCategoryData().map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  categories.find(
                                    (c) => c.id === selectedCategory,
                                  )?.color || "#059669"
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  <SummaryCard
                    label="إجمالي المستخدمين"
                    value={totalUniqueUsers}
                  />
                  <SummaryCard
                    label={`إجمالي ${categories.find((c) => c.id === selectedCategory)?.name}`}
                    value={userComparisonData.reduce(
                      (sum, user) =>
                        sum +
                        (user[
                          selectedCategory as keyof UserComparisonData
                        ] as number),
                      0,
                    )}
                  />
                  <SummaryCard
                    label="أعلى مستخدم"
                    value={
                      userComparisonData.length > 0
                        ? userComparisonData[0].userName
                        : "لا يوجد"
                    }
                  />
                  <SummaryCard
                    label={`أعلى قيمة: ${userComparisonData.length > 0 ? userComparisonData[0][selectedCategory as keyof UserComparisonData] : 0}`}
                    value=""
                  />
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white mt-12 py-6 border-t">
        <div className="container mx-auto px-4 text-center text-gray-600">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} - مُتابع رمضان</p>
        </div>
      </footer>
    </div>
  );
};

// Stat Card Component
const StatCard = ({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) => (
  <div className="bg-white rounded-xl shadow-md p-6 transform hover:scale-105 transition duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold text-emerald-700">{value}</p>
      </div>
      <div className={`text-4xl text-${color}-300`}>{icon}</div>
    </div>
  </div>
);

// Summary Card Component
const SummaryCard = ({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) => (
  <div className="bg-emerald-50 rounded-xl p-6 text-center">
    <p className="text-3xl font-bold text-emerald-700">{value}</p>
    <p className="text-gray-600">{label}</p>
  </div>
);

// CheckRow Component
const CheckRow = ({
  icon,
  label,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div
    className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 cursor-pointer ${
      checked
        ? "bg-emerald-100 border-2 border-emerald-500 shadow-md"
        : "bg-gray-50 hover:bg-emerald-50 border-2 border-transparent"
    }`}
    onClick={() => onChange(!checked)}
  >
    <div className="flex items-center space-x-3 space-x-reverse">
      <span
        className={`text-xl ${checked ? "text-emerald-700" : "text-gray-500"}`}
      >
        {icon}
      </span>
      <span
        className={`font-medium ${checked ? "text-emerald-800" : "text-gray-700"}`}
      >
        {label}
      </span>
    </div>
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-6 h-6 accent-emerald-600 cursor-pointer"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
);

// NumberRow Component
const NumberRow = ({
  icon,
  label,
  value,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  onChange: (v: number) => void;
}) => (
  <div className="p-4 bg-gray-50 rounded-lg border-2 border-transparent hover:border-emerald-200 transition-all duration-300">
    <div className="flex items-center space-x-3 space-x-reverse mb-2">
      <span className="text-xl text-emerald-600">{icon}</span>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full p-3 border-2 border-emerald-100 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none transition-all duration-300"
      min="0"
    />
  </div>
);

export default HomePage;
