import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  getAllSeries,
  getAllUsersWithAccess,
  updateUser,
  updateUserAccess,
  makeAdmin,
  getSubscriptionPlans
} from "../services/api";
import ConfirmDialog from "./ConfirmDialog";

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({ username: "", email: "" });
  const [seriesList, setSeriesList] = useState([]);
  const [modalSearchTerm, setModalSearchTerm] = useState("");
  const [userAccessMap, setUserAccessMap] = useState({});
  const [selectedSeries, setSelectedSeries] = useState(new Set());
  const [seriesAccessDays, setSeriesAccessDays] = useState({});
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, user: null });
  const [initialAccess, setInitialAccess] = useState(new Set());
  const [paymentInfo, setPaymentInfo] = useState({});
  const [activePlan, setActivePlan] = useState(null);
  const [saving, setSaving] = useState(false);

  const matchesUser = (user, rawTerm) => {
    const term = rawTerm.trim().toLowerCase();
    if (!term) return true;
    return String(user.id) === term ||
      String(user.userId ?? '').toLowerCase() === term ||
      (user.username || '').toLowerCase().includes(term) ||
      (user.email || '').toLowerCase().includes(term);
  };


  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await getAllUsers();
        setUsers(usersData);
        setFilteredUsers(usersData);

        const seriesData = await getAllSeries();
        setSeriesList(seriesData);

        const accessDataRaw = await getAllUsersWithAccess(); 
        
        const accessMap = {};
        Object.keys(accessDataRaw).forEach((userId) => {
          accessMap[userId] = new Set(accessDataRaw[userId].map((s) => s.id));
        });
        setUserAccessMap(accessMap);

        try {
          const plans = await getSubscriptionPlans();
          setActivePlan((Array.isArray(plans) ? plans : []).find(p => p.active) || null);
        } catch (_) {
          setActivePlan(null);
        }
      } catch (e) {
        setError("Ma'lumotlarni olishda xatolik: " + e);
      }
    };
    fetchData();
  }, []);

  const handleSearch = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    setFilteredUsers(users.filter((user) => matchesUser(user, term)));
  };

  const handleEditClick = (user) => {
    setEditingUser(user);
    setEditForm({
      username: user.username || "",
      email: user.email || "",
    });
    setError("");

    const accessSet = userAccessMap[user.id] || new Set();
    const initialDays = {};
    seriesList.forEach(s => {
      initialDays[s.id] = accessSet.has(s.id) ? 30 : 0;
    });
    setSeriesAccessDays(initialDays);
    setSelectedSeries(accessSet);
    setInitialAccess(new Set(accessSet));
    setPaymentInfo({});
    setModalSearchTerm("");
  };

  // Yangi berilayotgan serial standart "To'lov qildi", oldindan bor kirish esa "To'lovsiz" (qayta saqlashda yangi to'lov yozilmaydi)
  const getPayType = (seriesId) =>
    paymentInfo[seriesId]?.type || (initialAccess.has(seriesId) ? 'free' : 'paid');

  const setPayType = (seriesId, type) => {
    setPaymentInfo(prev => ({ ...prev, [seriesId]: { ...prev[seriesId], type } }));
  };

  const setPayAmount = (seriesId, amount) => {
    const clean = amount.replace(/\D/g, '');
    setPaymentInfo(prev => ({
      ...prev,
      [seriesId]: { type: getPayType(seriesId), ...prev[seriesId], amount: clean, edited: true },
    }));
  };

  // Muddat o'zgarsa summa yana avtomatik narxga qaytadi
  const resetPayAmount = (seriesId) => {
    setPaymentInfo(prev => (prev[seriesId]?.edited
      ? { ...prev, [seriesId]: { ...prev[seriesId], amount: '', edited: false } }
      : prev));
  };

  // Obunaga asoslangan serialda narx faol obuna tarifidan, aks holda serialning o'z narxidan olinadi (3 oylik tarif bo'lsa 90+ kunga u, aks holda oylik narx × oylar soni)
  const defaultPrice = (series, days) => {
    const source = series.subscriptionBased ? activePlan : series;
    if (!source) return 0;
    if (days >= 90 && source.quarterlyPrice) return source.quarterlyPrice;
    return (source.monthlyPrice || 0) * Math.max(1, Math.ceil(days / 30));
  };

  // Faqat serialda (yoki obuna tarifida) bor muddatlar ko'rsatiladi
  const tariffOptions = (series) => {
    const source = series.subscriptionBased ? activePlan : series;
    const prefix = series.subscriptionBased ? 'Obuna ' : '';
    const options = [];
    if (source?.monthlyPrice) options.push({ days: 30, label: `${prefix}1 oy`, price: source.monthlyPrice });
    if (source?.quarterlyPrice) options.push({ days: 90, label: `${prefix}3 oy`, price: source.quarterlyPrice });
    return options.length ? options : [{ days: 30, label: '1 oy', price: 0 }];
  };

  const getPayAmount = (series) => {
    const info = paymentInfo[series.id];
    if (info?.edited) return info.amount || '';
    const price = defaultPrice(series, seriesAccessDays[series.id] || 0);
    return price ? String(price) : '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };
  
  // METOD: Alohida serial tugmalari uchun
  const handleIndividualSeriesDaysButton = (seriesId, days) => {
    const validDays = days;
    resetPayAmount(seriesId);
    
    setSeriesAccessDays(prev => ({
      ...prev,
      [seriesId]: validDays,
    }));
    
    // Tugma bosilganda serialni avtomatik tanlash
    setSelectedSeries(prev => {
        const updated = new Set(prev);
        if (validDays > 0) {
            updated.add(seriesId);
        } else {
            updated.delete(seriesId);
        }
        return updated;
    });
  };

  const handleSeriesToggle = (seriesId) => {
    resetPayAmount(seriesId);
    setSelectedSeries(prev => {
      const updated = new Set(prev);
      if (updated.has(seriesId)) {
          updated.delete(seriesId);
          setSeriesAccessDays(d => ({...d, [seriesId]: 0})); 
      }
      else {
          updated.add(seriesId);
          const series = seriesList.find(sr => sr.id === seriesId);
          const firstDays = series ? tariffOptions(series)[0].days : 30;
          setSeriesAccessDays(d => ({...d, [seriesId]: firstDays}));
      }
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    if (!editForm.email.trim()) {
      setError("Email kiritilishi shart.");
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await updateUser(editingUser.id, {
        username: editForm.username.trim() || null,
        email: editForm.email.trim(),
      });
      const updatedUsers = users.map(u => u.id === updatedUser.id ? updatedUser : u);
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers.filter(u => matchesUser(u, searchTerm)));

      const seriesAccessMap = {};
      const manualPayments = {};
      Array.from(selectedSeries).forEach(seriesId => {
        const days = seriesAccessDays[seriesId] || 0;
        if (days > 0) {
          seriesAccessMap[seriesId] = days;
          if (getPayType(seriesId) === 'paid') {
            const series = seriesList.find(sr => sr.id === seriesId);
            const amount = parseInt(series ? getPayAmount(series) : paymentInfo[seriesId]?.amount, 10);
            manualPayments[seriesId] = amount > 0 ? amount : null;
          }
        }
      });

      await updateUserAccess(updatedUser.id, { seriesAccessMap, manualPayments });

      setUserAccessMap(prev => ({
        ...prev,
        [updatedUser.id]: new Set(selectedSeries)
      }));

      setEditingUser(null);
      setEditForm({ username: "", email: "" });
      setSelectedSeries(new Set());
      setSeriesAccessDays({});
      setPaymentInfo({});
      setError("");
    } catch (err) {
      setError("Foydalanuvchini yangilashda xatolik: " + (err?.response?.data?.message || err?.message || err));
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    setEditingUser(null);
    setEditForm({ username: "", email: "" });
    setModalSearchTerm("");
    setSelectedSeries(new Set());
    setSeriesAccessDays({});
    setPaymentInfo({});
    setError("");
  };
  
  const handleSubscribeAllSeries = async (user, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const seriesAccessMap = {};
      seriesList.forEach(s => { seriesAccessMap[s.id] = 30; });
      await updateUserAccess(user.id, { seriesAccessMap });
      setUserAccessMap(prev => ({ ...prev, [user.id]: new Set(seriesList.map(s => s.id)) }));
      setError("");
    } catch (err) {
      setError("Barchasiga kirish berishda xatolik: " + (err?.message || err));
    }
  };

  const handleMakeAdmin = (user, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    setConfirmDialog({ isOpen: true, user });
  };

  const confirmMakeAdmin = async () => {
    const user = confirmDialog.user;
    setConfirmDialog({ isOpen: false, user: null });
    try {
      await makeAdmin(user.id);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'ADMIN' } : u));
      setFilteredUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: 'ADMIN' } : u));
      setError("");
    } catch (err) {
      setError("Admin qilishda xatolik: " + (err?.message || err));
    }
  };

  const handleUnsubscribeAllSeries = async (user, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      await updateUserAccess(user.id, { seriesAccessMap: {} });
      setUserAccessMap(prev => ({ ...prev, [user.id]: new Set() }));
      setError("");
    } catch (err) {
      setError("Barchasidan chiqarishda xatolik: " + (err?.message || err));
    }
  };


  const filteredSeries = seriesList.filter(s =>
    s.title.toLowerCase().includes(modalSearchTerm.toLowerCase())
  );

  // Alohida Serial tugmasi komponenti
  const IndividualAccessButton = ({ seriesId, days, label }) => {
    const currentDays = seriesAccessDays[seriesId] || 0;
    const isSelected = selectedSeries.has(seriesId);
    
    return (
        <button
            type="button"
            onClick={() => handleIndividualSeriesDaysButton(seriesId, days)}
            className={`px-3 py-1.5 rounded-lg text-xs transition duration-200 flex-1 min-w-[120px]
            ${currentDays === days && isSelected
              ? 'bg-purple-600 text-white shadow-lg border-purple-400' 
              : 'bg-[#0f111a] text-gray-400 hover:bg-[#2a2c3e] border border-gray-600'
            }
            `}
        >
            {label}
        </button>
    );
  };
  
  return (
    <div className="min-h-screen bg-[#0f111a] p-4 sm:p-6 lg:p-8 lg:ml-64 flex justify-center">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type="warning"
        title="Admin huquqi berish"
        message={`${confirmDialog.user?.username} foydalanuvchisini admin qilmoqchimisiz? Bu amalni keyinchalik o'zgartirish mumkin.`}
        confirmText="Ha, admin qilish"
        onConfirm={confirmMakeAdmin}
        onCancel={() => setConfirmDialog({ isOpen: false, user: null })}
      />
      <div className="max-w-7xl w-full">
        <h1 className="text-3xl font-bold text-white mb-6 sm:mb-8 text-center tracking-tight">
          Foydalanuvchilar Ro‘yxati 🎬
        </h1>
        {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg mb-6 text-center animate-pulse shadow-xl border border-red-400">{error}</p>}

        {/* Qidiruv */}
        <input
          type="text"
          placeholder="ID, username yoki email bo‘yicha qidirish..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full p-3 bg-[#1c1e2c] border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-6 shadow-xl"
        />

        {/* Jadval */}
        <div className="bg-[#1c1e2c] rounded-xl shadow-2xl overflow-x-auto">
          <table className="min-w-full text-left text-white divide-y divide-gray-700">
            <thead>
              <tr className="bg-[#2a2c3e]">
                <th className="p-3 text-xs sm:text-sm font-medium text-gray-300">ID</th>
                <th className="p-3 text-xs sm:text-sm font-medium text-gray-300">Username</th>
                <th className="p-3 text-xs sm:text-sm font-medium text-gray-300 hidden md:table-cell">Email</th>
                <th className="p-3 text-xs sm:text-sm font-medium text-gray-300 hidden md:table-cell">Role</th>
                <th className="p-3 text-xs sm:text-sm font-medium text-gray-300">Boshqaruv & Access</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map(user => (
                <tr
                  key={user.id}
                  className="hover:bg-[#2a2c3e] transition duration-200"
                  onClick={() => handleEditClick(user)}
                >
                  <td className="p-3 text-xs sm:text-sm text-gray-400">{user.id}</td>
                  <td className="p-3 text-xs sm:text-sm font-medium">{user.username || <span className="text-gray-500 italic">Ismsiz</span>}</td>
                  <td className="p-3 text-xs sm:text-sm hidden md:table-cell text-gray-300">{user.email}</td>
                  <td className="p-3 text-xs sm:text-sm hidden md:table-cell">
                    {user.role === "ADMIN"
                      ? <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Admin</span>
                      : <span className="px-2 py-0.5 rounded-full bg-gray-500/20 text-gray-400 text-xs font-semibold">User</span>
                    }
                  </td>
                  <td className="p-3 text-sm flex flex-col gap-2">
                    {/* Access ko'rinishi */}
                    <div className="flex flex-wrap gap-1">
                      {userAccessMap[user.id] && userAccessMap[user.id].size > 0 ? (
                        Array.from(userAccessMap[user.id]).slice(0, 3).map((sid) => { 
                          const s = seriesList.find((sr) => sr.id === sid);
                          return (
                            <span
                              key={sid}
                              className="px-2 py-1 text-xs rounded-full bg-blue-600/50 text-white font-medium"
                              title="Individual kirish"
                            >
                              {s ? s.title : `ID:${sid}`}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-gray-400 italic text-xs">Kirish huquqi yo‘q</span>
                      )}
                      {userAccessMap[user.id] && userAccessMap[user.id].size > 3 && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-600/30 text-white">
                            +{userAccessMap[user.id].size - 3}
                          </span>
                      )}
                    </div>

                    {/* Boshqaruv tugmalari */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <button
                        onClick={(e) => handleSubscribeAllSeries(user, e)}
                        className="px-2 py-1 text-xs rounded bg-green-600 hover:bg-green-700 text-white transition duration-200 shadow-sm"
                      >
                        Barchasiga kirish
                      </button>

                      <button
                        onClick={(e) => handleUnsubscribeAllSeries(user, e)}
                        className="px-2 py-1 text-xs rounded bg-gray-600 hover:bg-gray-700 text-white transition duration-200 shadow-sm"
                      >
                        Barchasidan chiqarish
                      </button>

                      {user.role !== "ADMIN" && (
                        <button
                          onClick={(e) => handleMakeAdmin(user, e)}
                          className="px-2 py-1 text-xs rounded bg-yellow-600 hover:bg-yellow-700 text-white transition duration-200 shadow-sm"
                        >
                          Admin qilish
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {editingUser && (
          // Responsive: Kichik ekranlarda to'liq kenglik/balandlik, katta ekranlarda max-width
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 sm:p-8 overflow-y-auto">
            <div className="w-full max-w-lg bg-[#1c1e2c] p-6 rounded-xl shadow-2xl text-white my-8 border border-gray-700">
              <h2 className="text-2xl font-bold mb-5 text-center tracking-tight text-blue-400">Foydalanuvchini Tahrirlash</h2>
              {error && <p className="text-red-400 bg-red-500/10 p-3 rounded-lg mb-4 text-center text-sm border border-red-400">{error}</p>}
              <form onSubmit={handleSubmit} noValidate className="space-y-4">
                <input
                  type="text"
                  name="username"
                  value={editForm.username}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  placeholder="Username"
                />
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleInputChange}
                  className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                  placeholder="Email"
                />
                
                <p className="text-sm text-gray-400 italic bg-[#1c1e2c] p-3 rounded-lg border border-gray-700">
                  Seriallarni tanlang va har biri uchun kirish kunini belgilang. Odam kartaga pul tashlagan bo'lsa "To'lov qildi"ni tanlab, summani kiriting — statistikaga tushadi.
                </p>

                {/* Serial qidirish inputi */}
                <input
                  type="text"
                  placeholder="Serial qidirish..."
                  value={modalSearchTerm}
                  onChange={(e) => setModalSearchTerm(e.target.value)}
                  className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 shadow-inner"
                />
                
                {/* 2. Serial tanlash ro'yxati (Individual Access) */}
                <div className="max-h-60 overflow-y-auto border border-gray-600 rounded-lg p-2 bg-[#2a2c3e] shadow-inner">
                  {filteredSeries.length > 0 ? (
                    filteredSeries.map(s => (
                      <div 
                        key={s.id} 
                        className="p-3 border-b border-gray-700 last:border-none flex flex-col space-y-3 transition duration-150 hover:bg-[#3b3d52] rounded-md"
                      >
                        {/* Checkbox va Title */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center w-full">
                                <input
                                    type="checkbox"
                                    checked={selectedSeries.has(s.id)}
                                    onChange={() => handleSeriesToggle(s.id)}
                                    className="mr-3 h-5 w-5 text-blue-600 rounded border-gray-600 bg-[#0f111a] focus:ring-blue-500"
                                />
                                <span className="text-white font-medium text-base">
                                    {s.title}
                                </span>
                            </div>
                        </div>

                        {/* Kun tanlash tugmalari va input */}
                        {(
                            <div className="flex flex-col space-y-2 pl-8">
                                <div className="flex flex-wrap gap-2">
                                    {tariffOptions(s).map(t => (
                                        <IndividualAccessButton
                                            key={t.days}
                                            seriesId={s.id}
                                            days={t.days}
                                            label={t.price ? `${t.label} · ${Number(t.price).toLocaleString('ru-RU')} so'm` : t.label}
                                        />
                                    ))}
                                </div>
                                {tariffOptions(s).every(t => !t.price) && (
                                    <p className="text-[11px] text-yellow-500/80">Bu serialda tarif narxi kiritilmagan.</p>
                                )}

                                {selectedSeries.has(s.id) && (seriesAccessDays[s.id] || 0) > 0 && (
                                  <div className="flex flex-col gap-2 pt-2 border-t border-gray-700/70">
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setPayType(s.id, 'paid')}
                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition duration-200 ${
                                          getPayType(s.id) === 'paid'
                                            ? 'bg-green-600 text-white border-green-400'
                                            : 'bg-[#0f111a] text-gray-400 border-gray-600 hover:bg-[#2a2c3e]'
                                        }`}
                                      >
                                        💳 To'lov qildi
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setPayType(s.id, 'free')}
                                        className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition duration-200 ${
                                          getPayType(s.id) === 'free'
                                            ? 'bg-gray-500 text-white border-gray-300'
                                            : 'bg-[#0f111a] text-gray-400 border-gray-600 hover:bg-[#2a2c3e]'
                                        }`}
                                      >
                                        🎁 {initialAccess.has(s.id) ? "To'lovsiz" : 'Bepul / sovg\'a'}
                                      </button>
                                    </div>
                                    {getPayType(s.id) === 'paid' && (
                                      <div className="flex items-center space-x-2">
                                        <label className="text-xs text-gray-400 whitespace-nowrap w-1/3">Summa (so'm):</label>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          value={getPayAmount(s)}
                                          onChange={(e) => setPayAmount(s.id, e.target.value)}
                                          placeholder="Summani kiriting"
                                          className="w-2/3 p-1.5 bg-[#0f111a] border border-green-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-right text-sm font-semibold text-green-300"
                                        />
                                      </div>
                                    )}
                                    {getPayType(s.id) === 'paid' && (
                                      <p className="text-[11px] text-gray-500">
                                        Summa tanlangan muddatga qarab {s.subscriptionBased ? 'obuna tarifi' : 'serial'} narxidan avtomatik yoziladi, kerak bo'lsa o'zgartiring. Statistikaga "qo'lda to'lov" bo'lib tushadi.
                                      </p>
                                    )}
                                  </div>
                                )}
                            </div>
                        )}
                      </div>
                    ))
                  ) : <div className="text-gray-400 p-3 text-center">Hech qanday serial topilmadi 😞</div>}
                </div>

                <div className="flex justify-end space-x-3 pt-5">
                  <button type="button" onClick={handleCloseModal} className="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded-lg transition duration-200 shadow-lg font-medium">Bekor qilish</button>
                  <button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-wait px-4 py-2 rounded-lg transition duration-200 shadow-lg font-semibold">{saving ? "Saqlanmoqda..." : "Saqlash"}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UsersTable;