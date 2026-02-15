import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../src/supabaseClient";
import Auth from "./Auth";
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
  FaBookOpen,
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
  alduhaa: boolean;
  group_reading: boolean;
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
  alduhaa: number;
  group_reading: number;
}

const HomePage = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"tracker" | "stats">("tracker");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [formData, setFormData] = useState<DayData>({
    tarawih: false,
    sunan: false,
    witr: false,
    mudarasa: 0,
    azkar: false,
    reading: 0,
    alduhaa: false,
    group_reading: false,
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
    alduhaaCount: 0,
    groupReadingCount: 0,
    completionRate: 0,
  });

  // Category options for dropdown
  const categories = [
    {
      id: "tarawih",
      name: "صلاة التراويح",
      icon: <FaMosque />,
      color: "#059669",
    },
    {
      id: "sunan",
      name: "السنن الرواتب",
      icon: <FaMosque />,
      color: "#10b981",
    },
    { id: "witr", name: "صلاة الوتر", icon: <FaMosque />, color: "#34d399" },
    { id: "azkar", name: "الأذكار", icon: <FaBookOpen />, color: "purple" },
    { id: "alduhaa", name: "صلاة الضحى", icon: <FaMosque />, color: "#eab308" },
    {
      id: "group_reading",
      name: "المدارسة الجماعية",
      icon: <FaUsers />,
      color: "#f97316",
    },
    {
      id: "reading",
      name: "القراءة (صفحات)",
      icon: <FaQuran />,
      color: "#0369a1",
    },
    {
      id: "mudarasa",
      name: "المدارسة (صفحات)",
      icon: <FaQuran />,
      color: "#0ea5e9",
    },
  ];

  // Check if user is logged in and get profile
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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
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

    const { data, error: _error } = await supabase
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
        alduhaa: data.alduhaa,
        group_reading: data.group_reading,
      });
    } else {
      setFormData({
        tarawih: false,
        sunan: false,
        witr: false,
        mudarasa: 0,
        azkar: false,
        reading: 0,
        alduhaa: false,
        group_reading: false,
      });
    }
  };

  const fetchUserStats = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error: _error } = await supabase
      .from("daily_tracker")
      .select("*")
      .eq("user_id", user.id);

    if (data) {
      const totalDays = data.length;
      const tarawihCount = data.filter((d) => d.tarawih).length;
      const sunanCount = data.filter((d) => d.sunan).length;
      const witrCount = data.filter((d) => d.witr).length;
      const azkarCount = data.filter((d) => d.azkar).length;
      const alduhaaCount = data.filter((d) => d.alduhaa).length;
      const groupReadingCount = data.filter((d) => d.group_reading).length;
      const totalReading = data.reduce((sum, d) => sum + (d.reading || 0), 0);
      const totalMudarasa = data.reduce((sum, d) => sum + (d.mudarasa || 0), 0);

      // Update completedDays to include new fields
      const completedDays = data.filter(
        (d) =>
          d.tarawih &&
          d.sunan &&
          d.witr &&
          d.azkar &&
          d.alduhaa &&
          d.group_reading,
      ).length;

      const completionRate =
        totalDays > 0 ? Math.round((completedDays / totalDays) * 100) : 0;

      setUserStats({
        totalDays,
        tarawihCount,
        sunanCount,
        witrCount,
        azkarCount,
        alduhaaCount,
        groupReadingCount,
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

    // Initialize with ALL profiles (even those with no data)
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
        alduhaa: 0,
        group_reading: 0,
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
        if (entry.alduhaa) userData.alduhaa++;
        if (entry.group_reading) userData.group_reading++;
        userData.reading += entry.reading || 0;
        userData.mudarasa += entry.mudarasa || 0;
      }
    });

    // Convert map to array
    let comparisonArray = Array.from(userMap.values());

    // Sort based on selected category
    if (selectedCategory === "all") {
      // For "all" view: sort by total days, then alphabetically
      comparisonArray.sort((a, b) => {
        if (b.totalDays !== a.totalDays) {
          return b.totalDays - a.totalDays;
        }
        return a.userName.localeCompare(b.userName);
      });
    } else {
      // For single category view: sort by that category value (highest to lowest)
      comparisonArray.sort((a, b) => {
        const aValue = a[
          selectedCategory as keyof UserComparisonData
        ] as number;
        const bValue = b[
          selectedCategory as keyof UserComparisonData
        ] as number;

        if (bValue !== aValue) {
          return bValue - aValue;
        }
        // If same value, sort by total days
        if (b.totalDays !== a.totalDays) {
          return b.totalDays - a.totalDays;
        }
        // Then alphabetically
        return a.userName.localeCompare(b.userName);
      });
    }

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

    try {
      // First, check if record exists
      const { data: existingRecord, error: fetchError } = await supabase
        .from("daily_tracker")
        .select("id")
        .eq("user_id", user.id)
        .eq("day_number", selectedDay)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing record:", fetchError);
        toast.error("حدث خطأ في التحقق من البيانات");
        setSaving(false);
        return;
      }

      let result;

      if (existingRecord) {
        // Update existing record
        result = await supabase
          .from("daily_tracker")
          .update({
            tarawih: formData.tarawih,
            sunan: formData.sunan,
            witr: formData.witr,
            mudarasa: formData.mudarasa,
            azkar: formData.azkar,
            reading: formData.reading,
            alduhaa: formData.alduhaa,
            group_reading: formData.group_reading,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .eq("day_number", selectedDay);
      } else {
        // Insert new record
        result = await supabase.from("daily_tracker").insert({
          user_id: user.id,
          day_number: selectedDay,
          tarawih: formData.tarawih,
          sunan: formData.sunan,
          witr: formData.witr,
          mudarasa: formData.mudarasa,
          azkar: formData.azkar,
          reading: formData.reading,
          alduhaa: formData.alduhaa,
          group_reading: formData.group_reading,
        });
      }

      if (result.error) {
        console.error("Save error:", result.error);
        toast.error("حدث خطأ في الحفظ");
      } else {
        toast.success("تم الحفظ بنجاح! 🎉");
        fetchUserStats();
        fetchUserComparisonData();
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("حدث خطأ غير متوقع");
    }

    setSaving(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.info("تم تسجيل الخروج بنجاح");
  };

  // Helper function to get the maximum value for the selected category
  const getMaxValue = () => {
    if (userComparisonData.length === 0 || selectedCategory === "all") return 0;

    return Math.max(
      ...userComparisonData.map(
        (user) => user[selectedCategory as keyof UserComparisonData] as number,
      ),
    );
  };

  const maxValue = getMaxValue();

  // Add this with your other helper functions (around line 300)
  const getMaxValues = () => {
    if (userComparisonData.length === 0) {
      return {
        alduhaa: 0,
        sunan: 0,
        tarawih: 0,
        witr: 0,
        azkar: 0,
        group_reading: 0,
        reading: 0,
        mudarasa: 0,
      };
    }

    return {
      alduhaa: Math.max(...userComparisonData.map((u) => u.alduhaa)),
      sunan: Math.max(...userComparisonData.map((u) => u.sunan)),
      tarawih: Math.max(...userComparisonData.map((u) => u.tarawih)),
      witr: Math.max(...userComparisonData.map((u) => u.witr)),
      azkar: Math.max(...userComparisonData.map((u) => u.azkar)),
      group_reading: Math.max(
        ...userComparisonData.map((u) => u.group_reading),
      ),
      reading: Math.max(...userComparisonData.map((u) => u.reading)),
      mudarasa: Math.max(...userComparisonData.map((u) => u.mudarasa)),
    };
  };

  const maxValues = getMaxValues();

  // Resort data when category changes
  useEffect(() => {
    if (userComparisonData.length > 0) {
      // Create a new sorted array based on selected category
      const sortedData = [...userComparisonData];

      if (selectedCategory === "all") {
        sortedData.sort((a, b) => {
          if (b.totalDays !== a.totalDays) {
            return b.totalDays - a.totalDays;
          }
          return a.userName.localeCompare(b.userName);
        });
      } else {
        sortedData.sort((a, b) => {
          const aValue = a[
            selectedCategory as keyof UserComparisonData
          ] as number;
          const bValue = b[
            selectedCategory as keyof UserComparisonData
          ] as number;

          if (bValue !== aValue) {
            return bValue - aValue;
          }
          if (b.totalDays !== a.totalDays) {
            return b.totalDays - a.totalDays;
          }
          return a.userName.localeCompare(b.userName);
        });
      }

      setUserComparisonData(sortedData);
    }
  }, [selectedCategory]);

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-50 flex items-center justify-center">
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
      className="min-h-screen bg-linear-to-br from-gray-50 to-emerald-50 font-sans"
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
      <header className="bg-linear-to-l from-emerald-800 to-emerald-600 text-white shadow-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <FaMoon className="text-3xl" />
              <h1 className="text-2xl md:text-3xl font-bold">رمضان كريم</h1>
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-10">
              <div className="text-left">
                <div className="flex items-center space-x-2">
                  <FaUserCircle className="text-4xl" />
                  <span className="font-bold">
                    {userProfile?.name || "مستخدم"}
                  </span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg transition duration-300 shadow-md hover:cursor-pointer hover:shadow-lg transform hover:scale-105"
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
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex items-center space-x-2  px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === "tracker"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-emerald-50 hover:cursor-pointer"
            }`}
          >
            <FaHome />
            <span>المتابعة اليومية</span>
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`flex items-center space-x-2  px-6 py-3 rounded-lg font-semibold transition duration-300 ${
              activeTab === "stats"
                ? "bg-emerald-600 text-white shadow-lg"
                : "bg-white text-gray-600 hover:bg-emerald-50 hover:cursor-pointer"
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
                icon={<FaMosque />}
                label="الضحى"
                value={userStats.alduhaaCount}
                color="yellow"
              />
              <StatCard
                icon={<FaMosque />}
                label="السنن"
                value={userStats.sunanCount}
                color="teal"
              />
              <StatCard
                icon={<FaMosque />}
                label="التراويح"
                value={userStats.tarawihCount}
                color="green"
              />
              <StatCard
                icon={<FaMosque />}
                label="الوتر"
                value={userStats.witrCount}
                color="cyan"
              />

              <StatCard
                icon={<FaBookOpen />}
                label="أذكار الصباح والمساء"
                value={userStats.azkarCount}
                color="amber"
              />
              <StatCard
                icon={<FaUsers />}
                label="المدارسة الجماعية"
                value={userStats.groupReadingCount}
                color="orange"
              />
              <StatCard
                icon={<FaQuran />}
                label="القراءة اليومية"
                value={userStats.totalReading}
                color="blue"
              />
              <StatCard
                icon={<FaQuran />}
                label="المدارسة اليومية"
                value={userStats.totalMudarasa}
                color="indigo"
              />
            </div>

            {/* Daily Tracker Card */}
            <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-emerald-700 text-white px-6 py-4">
                <h2 className="text-xl font-bold flex items-center">
                  <FaMoon className="ml-2" />
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
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                      <button
                        key={day}
                        onClick={() => setSelectedDay(day)}
                        className={`
                          p-2 rounded-lg font-semibold transition-all duration-300
                          ${
                            selectedDay === day
                              ? "bg-emerald-600 text-white shadow-lg scale-105"
                              : "bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:cursor-pointer"
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
                      icon={<FaMosque />}
                      label="صلاة الضحى"
                      checked={formData.alduhaa}
                      onChange={(v) => setFormData({ ...formData, alduhaa: v })}
                    />
                    <CheckRow
                      icon={<FaMosque />}
                      label="السنن الرواتب"
                      checked={formData.sunan}
                      onChange={(v) => setFormData({ ...formData, sunan: v })}
                    />
                    <CheckRow
                      icon={<FaMosque />}
                      label="صلاة التراويح"
                      checked={formData.tarawih}
                      onChange={(v) => setFormData({ ...formData, tarawih: v })}
                    />

                    <CheckRow
                      icon={<FaMosque />}
                      label="صلاة الوتر"
                      checked={formData.witr}
                      onChange={(v) => setFormData({ ...formData, witr: v })}
                    />
                  </div>
                  <div className="space-y-3">
                    <CheckRow
                      icon={<FaBookOpen />}
                      label="أذكار الصباح والمساء"
                      checked={formData.azkar}
                      onChange={(v) => setFormData({ ...formData, azkar: v })}
                    />
                    <CheckRow
                      icon={<FaUsers />}
                      label="المدارسة الجماعية"
                      checked={formData.group_reading}
                      onChange={(v) =>
                        setFormData({ ...formData, group_reading: v })
                      }
                    />
                    <NumberRow
                      icon={<FaQuran />}
                      label="القراءة اليومية (عدد الصفحات)"
                      value={formData.reading}
                      onChange={(v) => setFormData({ ...formData, reading: v })}
                    />

                    <NumberRow
                      icon={<FaQuran />}
                      label="المدارسة (عدد الصفحات)"
                      value={formData.mudarasa}
                      onChange={(v) =>
                        setFormData({ ...formData, mudarasa: v })
                      }
                    />
                  </div>
                </div>

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full mt-8 bg-linear-to-l from-emerald-600 to-emerald-500 text-white py-4 rounded-xl font-bold text-lg hover:from-emerald-700 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:cursor-pointer transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
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
            {/* Category Filter Tabs */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  onClick={() => setSelectedCategory("all")}
                  className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
                    selectedCategory === "all"
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
                  }`}
                >
                  جميع الفئات
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center space-x-2 ${
                      selectedCategory === cat.id
                        ? "bg-emerald-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-emerald-100 hover:cursor-pointer"
                    }`}
                    style={{
                      borderRight:
                        selectedCategory === cat.id
                          ? "none"
                          : `4px solid ${cat.color}`,
                    }}
                  >
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
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
                {/* Main Statistics Table */}
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-emerald-700 text-white">
                          <th className="px-4 py-3 text-right">#</th>
                          <th className="px-4 py-3 text-right">اسم المستخدم</th>
                          <th className="px-4 py-3 text-center">
                            الأيام المسجلة
                          </th>
                          {selectedCategory === "all" ? (
                            <>
                              <th className="px-4 py-3 text-center">الضحى</th>
                              <th className="px-4 py-3 text-center">السنن</th>
                              <th className="px-4 py-3 text-center">
                                التراويح
                              </th>
                              <th className="px-4 py-3 text-center">الوتر</th>
                              <th className="px-4 py-3 text-center">الأذكار</th>
                              <th className="px-4 py-3 text-center">
                                المدارسة الجماعية
                              </th>
                              <th className="px-4 py-3 text-center">القراءة</th>
                              <th className="px-4 py-3 text-center">
                                المدارسة
                              </th>
                            </>
                          ) : (
                            <>
                              <th className="px-4 py-3 text-center" colSpan={2}>
                                {
                                  categories.find(
                                    (c) => c.id === selectedCategory,
                                  )?.name
                                }
                              </th>
                            </>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {userComparisonData.length > 0 ? (
                          userComparisonData.map((user, index) => (
                            <tr
                              key={user.userId}
                              className={`border-b hover:bg-emerald-50 transition-colors ${
                                index % 2 === 0 ? "bg-white" : "bg-gray-50"
                              }`}
                            >
                              <td className="px-4 py-3 font-medium text-gray-700">
                                {index + 1}
                              </td>
                              <td className="px-4 py-3 font-semibold text-emerald-800">
                                {user.userName}
                              </td>
                              <td className="px-4 py-3 text-center font-medium">
                                {user.totalDays}
                              </td>

                              {selectedCategory === "all" ? (
                                <>
                                  {/* الضحى */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.alduhaa === maxValues.alduhaa &&
                                          maxValues.alduhaa > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.alduhaa > 0
                                              ? "bg-yellow-100 text-yellow-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.alduhaa}
                                        {user.alduhaa === maxValues.alduhaa &&
                                          maxValues.alduhaa > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* السنن */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.sunan === maxValues.sunan &&
                                          maxValues.sunan > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.sunan > 0
                                              ? "bg-teal-100 text-teal-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.sunan}
                                        {user.sunan === maxValues.sunan &&
                                          maxValues.sunan > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* التراويح */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.tarawih === maxValues.tarawih &&
                                          maxValues.tarawih > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.tarawih > 0
                                              ? "bg-green-100 text-green-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.tarawih}
                                        {user.tarawih === maxValues.tarawih &&
                                          maxValues.tarawih > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* الوتر */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.witr === maxValues.witr &&
                                          maxValues.witr > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.witr > 0
                                              ? "bg-cyan-100 text-cyan-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.witr}
                                        {user.witr === maxValues.witr &&
                                          maxValues.witr > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* الأذكار */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.azkar === maxValues.azkar &&
                                          maxValues.azkar > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.azkar > 0
                                              ? "bg-amber-100 text-amber-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.azkar}
                                        {user.azkar === maxValues.azkar &&
                                          maxValues.azkar > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* المدارسة الجماعية */}
                                  <td className="px-4 py-3 text-center">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-full inline-flex items-center gap-1 ${
                                          user.group_reading ===
                                            maxValues.group_reading &&
                                          maxValues.group_reading > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : user.group_reading > 0
                                              ? "bg-orange-100 text-orange-800"
                                              : "text-gray-500"
                                        }`}
                                      >
                                        {user.group_reading}
                                        {user.group_reading ===
                                          maxValues.group_reading &&
                                          maxValues.group_reading > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>

                                  {/* القراءة */}
                                  <td className="px-4 py-3 text-center font-medium">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 ${
                                          user.reading === maxValues.reading &&
                                          maxValues.reading > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : "text-blue-700"
                                        }`}
                                      >
                                        {user.reading}
                                        {user.reading === maxValues.reading &&
                                          maxValues.reading > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>

                                  {/* المدارسة */}
                                  <td className="px-4 py-3 text-center font-medium">
                                    {user.totalDays > 0 ? (
                                      <span
                                        className={`px-2 py-1 rounded-lg inline-flex items-center gap-1 ${
                                          user.mudarasa ===
                                            maxValues.mudarasa &&
                                          maxValues.mudarasa > 0
                                            ? "bg-gradient-to-l from-yellow-500 to-amber-600 text-white shadow-lg font-bold"
                                            : "text-indigo-700"
                                        }`}
                                      >
                                        {user.mudarasa}
                                        {user.mudarasa === maxValues.mudarasa &&
                                          maxValues.mudarasa > 0 && (
                                            <span className="text-yellow-200 text-sm">
                                              👑
                                            </span>
                                          )}
                                      </span>
                                    ) : (
                                      "-"
                                    )}
                                  </td>
                                </>
                              ) : (
                                <td
                                  className="px-4 py-3 text-center font-bold"
                                  colSpan={2}
                                >
                                  {user.totalDays > 0 ? (
                                    <span
                                      className={`px-4 py-2 rounded-lg text-white inline-flex items-center justify-center gap-2 transition-all duration-300 ${
                                        (user[
                                          selectedCategory as keyof UserComparisonData
                                        ] as number) === maxValue &&
                                        maxValue > 0
                                          ? "bg-linear-to-l from-yellow-500 to-amber-600 shadow-lg scale-105 ring-2 ring-yellow-300"
                                          : ""
                                      }`}
                                      style={{
                                        backgroundColor:
                                          (user[
                                            selectedCategory as keyof UserComparisonData
                                          ] as number) === maxValue &&
                                          maxValue > 0
                                            ? undefined
                                            : categories.find(
                                                (c) =>
                                                  c.id === selectedCategory,
                                              )?.color,
                                      }}
                                    >
                                      {
                                        user[
                                          selectedCategory as keyof UserComparisonData
                                        ] as number
                                      }
                                      {(user[
                                        selectedCategory as keyof UserComparisonData
                                      ] as number) === maxValue &&
                                        maxValue > 0 && (
                                          <span className="text-yellow-200 text-lg">
                                            🏆
                                          </span>
                                        )}
                                    </span>
                                  ) : (
                                    <span className="text-gray-400">-</span>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={selectedCategory === "all" ? 11 : 4}
                              className="text-center py-8 text-gray-500"
                            >
                              لا توجد بيانات لعرضها
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
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
    <div className="flex items-center space-x-3 ">
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
    <div className="flex items-center space-x-3  mb-2">
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
