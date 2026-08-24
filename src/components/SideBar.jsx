import React, { useState } from "react";
import { Link } from "react-router-dom";
// lucide-react ikonalaridan foydalanilgan
import { Menu, X, MonitorPlay, Film, Users, LayoutList, Image, LogOut, Bell } from "lucide-react";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);

  // Sidebar toggle funksiyasi (mobil uchun)
  const toggleSidebar = () => setIsOpen(!isOpen);

  // Logout modalini ochish
  const handleLogoutClick = () => {
    // Mobil menyu ochiq bo'lsa, avval uni yopamiz
    if (isOpen) setIsOpen(false); 
    setIsLogoutOpen(true);
  };

  // Logoutni tasdiqlash va yo'naltirish
  const confirmLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setIsLogoutOpen(false);
    // Tezroq yo'naltirish uchun window.location ishlatilgan
    window.location.href = "/login"; 
  };

  // Logoutni bekor qilish
  const cancelLogout = () => setIsLogoutOpen(false);
  
  // Navigatsiya elementlari ro'yxati (kodni tozalash uchun)
  const navItems = [
    { to: "/create/series", icon: Film, label: "Serial yaratish", color: "text-blue-400" },
    { to: "/movies", icon: MonitorPlay, label: "Epizod qo‘shish", color: "text-green-400" },
    { to: "/user-table", icon: Users, label: "Foydalanuvchilar ro‘yxati", color: "text-yellow-400" },
    { to: "/series-list", icon: LayoutList, label: "Seriallar ro‘yxati", color: "text-purple-400" },
    { to: "/banners-list", icon: Image, label: "Bannerlar boshqaruvi", color: "text-indigo-400" },
    { to: "/send-notification", icon: Bell, label: "Notification yuborish", color: "text-pink-400" },
  ];

  // NavLink Componenti
  const NavLink = ({ to, icon: Icon, label, color }) => (
    <Link
      to={to}
      onClick={() => setIsOpen(false)} // Mobil menyuni yopish
      className={`
        flex items-center space-x-3 p-3 rounded-xl 
        text-white font-medium text-sm transition-all duration-300 
        hover:bg-[#2a2c3e] hover:shadow-lg hover:ring-2 hover:ring-blue-500/50
        group
      `}
    >
      <Icon size={20} className={`${color} transition-colors duration-200 group-hover:scale-110`} />
      <span>{label}</span>
    </Link>
  );

  return (
    <>
      {/* 1. Mobile toggle button */}
      <div className="md:hidden fixed top-4 left-4 z-[60]">
        <button
          onClick={toggleSidebar}
          className="p-3 rounded-xl bg-blue-600/90 text-white shadow-xl hover:bg-blue-700 transition duration-300 ring-2 ring-white/10"
          aria-label={isOpen ? "Menyuni yopish" : "Menyuni ochish"}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 2. Sidebar Backdrop (Mobil ochilganda orqa fon) */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-70 z-30"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* 3. Sidebar Kontenti */}
      <div
        className={`fixed top-0 left-0 h-full w-64 bg-[#1c1e2c] text-white p-4 flex flex-col shadow-2xl transform transition-transform duration-300 z-40 md:z-40 border-r border-gray-700/50
          ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0
        `}
      >
        {/* Logo/Header */}
        <div className="mb-8 pt-6 pb-4 border-b border-gray-700 md:pt-0 md:border-none">
          <h1 className="text-2xl font-extrabold text-white tracking-wider text-center">
            <span className="text-blue-500">ADMIN</span> PANEL
          </h1>
        </div>

        {/* Navigatsiya elementlari */}
        <nav className="flex-grow space-y-2">
          {navItems.map((item) => (
            <NavLink 
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
              color={item.color}
            />
          ))}
        </nav>

        {/* Profildan chiqish tugmasi */}
        <div className="mt-auto pt-6 border-t border-gray-700">
          <button
            onClick={handleLogoutClick}
            className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl transition duration-200 shadow-lg"
          >
            <LogOut size={20} />
            <span>Profildan chiqish</span>
          </button>
        </div>
      </div>

      {/* 4. Logout Confirmation Popup */}
      {isLogoutOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[70] p-4">
          <div className="bg-[#1c1e2c] p-6 rounded-xl shadow-2xl max-w-sm w-full border border-gray-700">
            <h3 className="text-xl font-bold text-white mb-5 text-center">
              Profildan chiqishni tasdiqlaysizmi?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
                Siz qayta tizimga kirishingiz kerak bo'ladi.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelLogout}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
              >
                Yo‘q, qolaman
              </button>
              <button
                onClick={confirmLogout}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200 font-medium"
              >
                Ha, chiqaman
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;