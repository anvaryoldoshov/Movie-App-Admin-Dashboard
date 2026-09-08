import React, { useState, useEffect } from "react";
import {
  getAllSeries,
  getSeasonsBySeries,
  createSeason,
  updateSeason,
  deleteSeason,
} from "../services/api";
import { Loader2, Plus, Edit3, Trash2, Save, X, AlertTriangle, CheckCircle, Layers, ChevronDown } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const SeasonManagement = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [seasons, setSeasons] = useState([]);
  const [isLoadingSeries, setIsLoadingSeries] = useState(true);
  const [isLoadingSeasons, setIsLoadingSeasons] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newSeason, setNewSeason] = useState({ seasonNumber: "", title: "" });
  const [editingId, setEditingId] = useState(null);
  const [editingSeason, setEditingSeason] = useState({ seasonNumber: "", title: "" });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  const closeConfirm = () => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });

  useEffect(() => {
    getAllSeries()
      .then((data) => setSeriesList(Array.isArray(data) ? data : []))
      .catch(() => setError("Seriallarni yuklab bo'lmadi."))
      .finally(() => setIsLoadingSeries(false));
  }, []);

  useEffect(() => {
    if (!selectedSeriesId) {
      setSeasons([]);
      return;
    }
    setIsLoadingSeasons(true);
    getSeasonsBySeries(selectedSeriesId)
      .then(setSeasons)
      .catch(() => setError("Fasllarni yuklab bo'lmadi."))
      .finally(() => setIsLoadingSeasons(false));
  }, [selectedSeriesId]);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newSeason.seasonNumber || !selectedSeriesId) return;
    try {
      const created = await createSeason(selectedSeriesId, Number(newSeason.seasonNumber), newSeason.title || null);
      setSeasons((prev) => [...prev, created].sort((a, b) => a.seasonNumber - b.seasonNumber));
      setNewSeason({ seasonNumber: "", title: "" });
      setError(null);
      showSuccess("Fasl qo'shildi");
    } catch (err) {
      setError(typeof err === "string" ? err : "Fasl qo'shib bo'lmadi.");
    }
  };

  const startEdit = (season) => {
    setEditingId(season.id);
    setEditingSeason({ seasonNumber: String(season.seasonNumber), title: season.title || "" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingSeason({ seasonNumber: "", title: "" });
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    if (!editingSeason.seasonNumber) return;
    try {
      const updated = await updateSeason(id, Number(editingSeason.seasonNumber), editingSeason.title || null);
      setSeasons((prev) => prev.map((s) => (s.id === id ? updated : s)).sort((a, b) => a.seasonNumber - b.seasonNumber));
      cancelEdit();
      setError(null);
      showSuccess("Fasl yangilandi");
    } catch (err) {
      setError(typeof err === "string" ? err : "Faslni yangilab bo'lmadi.");
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Faslni o'chirish",
      message: "Haqiqatan ham ushbu faslni o'chirmoqchimisiz? (Faqat epizodi bo'lmagan fasllarni o'chirish mumkin)",
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteSeason(id);
          setSeasons((prev) => prev.filter((s) => s.id !== id));
          setError(null);
          showSuccess("Fasl o'chirildi");
        } catch (err) {
          setError(typeof err === "string" ? err : "Faslni o'chirib bo'lmadi.");
        }
      },
    });
  };

  if (isLoadingSeries) {
    return (
      <div className="ml-0 md:ml-64 p-4 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-orange-500" />
          <p className="text-gray-400 text-lg mt-4">Seriallar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-900 text-white">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type="danger"
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Ha, o'chirish"
        onConfirm={confirmDialog.onConfirm}
        onCancel={closeConfirm}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 text-center text-orange-400 tracking-wider border-b-2 border-orange-500/50 pb-3 flex items-center justify-center gap-3">
        <Layers className="w-8 h-8" />
        Fasllarni Boshqarish
      </h1>

      {error && (
        <div className="flex items-center bg-red-900/40 text-red-300 p-4 rounded-xl mb-6 shadow-xl border border-red-700/50 max-w-2xl mx-auto">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Xatolik:</span>&nbsp;{error}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-900/40 text-green-300 p-4 rounded-xl mb-6 shadow-xl border border-green-700/50 max-w-2xl mx-auto animate-fade-in">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Muvaffaqiyat:</span>&nbsp;{success}
        </div>
      )}

      <div className="max-w-2xl mx-auto bg-gray-800 rounded-2xl shadow-2xl border border-gray-700/70 p-6">
        {/* Series selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2 text-gray-300">Serial tanlang:</label>
          <div className="relative">
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-inner cursor-pointer"
            >
              <option value="" className="bg-gray-800">-- Serial tanlang --</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id} className="bg-gray-800">
                  {s.title}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {!selectedSeriesId ? (
          <p className="text-gray-500 text-sm italic text-center py-6">
            Fasllarni ko'rish va boshqarish uchun avval serial tanlang.
          </p>
        ) : isLoadingSeasons ? (
          <div className="flex justify-center py-6">
            <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
          </div>
        ) : (
          <>
            <form onSubmit={handleCreate} className="flex gap-2 mb-6">
              <input
                type="number"
                min="1"
                placeholder="№"
                value={newSeason.seasonNumber}
                onChange={(e) => setNewSeason((prev) => ({ ...prev, seasonNumber: e.target.value }))}
                className="w-20 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-500"
              />
              <input
                type="text"
                placeholder="Nomi (ixtiyoriy, masalan: Maxsus qism)"
                value={newSeason.title}
                onChange={(e) => setNewSeason((prev) => ({ ...prev, title: e.target.value }))}
                className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white placeholder-gray-500"
              />
              <button
                type="submit"
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg shadow-orange-500/30"
              >
                <Plus className="w-5 h-5" />
                Qo'shish
              </button>
            </form>

            <div className="space-y-2">
              {seasons.length === 0 ? (
                <p className="text-gray-500 text-sm italic text-center py-6">
                  Hozircha fasl mavjud emas — birinchi epizod qo'shilganda avtomatik "1-fasl" yaratiladi.
                </p>
              ) : (
                seasons.map((season) => (
                  <div
                    key={season.id}
                    className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 transition rounded-lg p-3"
                  >
                    {editingId === season.id ? (
                      <form onSubmit={(e) => handleUpdate(e, season.id)} className="flex flex-1 gap-2 items-center">
                        <input
                          type="number"
                          min="1"
                          value={editingSeason.seasonNumber}
                          onChange={(e) => setEditingSeason((prev) => ({ ...prev, seasonNumber: e.target.value }))}
                          className="w-16 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                        />
                        <input
                          type="text"
                          value={editingSeason.title}
                          onChange={(e) => setEditingSeason((prev) => ({ ...prev, title: e.target.value }))}
                          placeholder="Nomi (ixtiyoriy)"
                          autoFocus
                          className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                        />
                        <button
                          type="submit"
                          className="p-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition"
                          title="Saqlash"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="p-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition"
                          title="Bekor qilish"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </form>
                    ) : (
                      <>
                        <span className="font-medium text-gray-200">
                          {season.title || `${season.seasonNumber}-fasl`}
                          {season.title && <span className="text-gray-500 text-xs ml-2">({season.seasonNumber}-fasl)</span>}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(season)}
                            className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(season.id)}
                            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SeasonManagement;
