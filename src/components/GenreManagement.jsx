import React, { useState, useEffect } from "react";
import { getGenres, createGenre, updateGenre, deleteGenre } from "../services/api";
import { Loader2, Plus, Edit3, Trash2, Save, X, AlertTriangle, CheckCircle, Tags } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const GenreManagement = () => {
  const [genres, setGenres] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: "", message: "", onConfirm: null });

  const closeConfirm = () => setConfirmDialog({ isOpen: false, title: "", message: "", onConfirm: null });

  const fetchGenres = async () => {
    try {
      setIsLoading(true);
      const data = await getGenres();
      setGenres(data);
    } catch (err) {
      setError(typeof err === "string" ? err : "Janrlarni yuklab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGenres();
  }, []);

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    try {
      const created = await createGenre(newName.trim());
      setGenres((prev) => [...prev, created]);
      setNewName("");
      setError(null);
      showSuccess("Janr qo'shildi");
    } catch (err) {
      setError(typeof err === "string" ? err : "Janr qo'shib bo'lmadi.");
    }
  };

  const startEdit = (genre) => {
    setEditingId(genre.id);
    setEditingName(genre.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleUpdate = async (e, id) => {
    e.preventDefault();
    if (!editingName.trim()) return;
    try {
      const updated = await updateGenre(id, editingName.trim());
      setGenres((prev) => prev.map((g) => (g.id === id ? updated : g)));
      cancelEdit();
      setError(null);
      showSuccess("Janr yangilandi");
    } catch (err) {
      setError(typeof err === "string" ? err : "Janrni yangilab bo'lmadi.");
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: "Janrni o'chirish",
      message: "Haqiqatan ham ushbu janrni o'chirmoqchimisiz? U barcha seriallardan ham olib tashlanadi.",
      onConfirm: async () => {
        closeConfirm();
        try {
          await deleteGenre(id);
          setGenres((prev) => prev.filter((g) => g.id !== id));
          setError(null);
          showSuccess("Janr o'chirildi");
        } catch (err) {
          setError(typeof err === "string" ? err : "Janrni o'chirib bo'lmadi.");
        }
      },
    });
  };

  if (isLoading) {
    return (
      <div className="ml-0 md:ml-64 p-4 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-gray-400 text-lg mt-4">Janrlar yuklanmoqda...</p>
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

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 text-center text-indigo-400 tracking-wider border-b-2 border-indigo-500/50 pb-3 flex items-center justify-center gap-3">
        <Tags className="w-8 h-8" />
        Janrlarni Boshqarish
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
        <form onSubmit={handleCreate} className="flex gap-3 mb-6">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Yangi janr nomi (masalan: Jangari)"
            className="flex-1 p-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-gray-500"
          />
          <button
            type="submit"
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-bold transition shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            Qo'shish
          </button>
        </form>

        <div className="space-y-2">
          {genres.length === 0 ? (
            <p className="text-gray-500 text-sm italic text-center py-6">Hozircha janrlar mavjud emas.</p>
          ) : (
            genres.map((genre) => (
              <div
                key={genre.id}
                className="flex items-center justify-between bg-gray-700/50 hover:bg-gray-700 transition rounded-lg p-3"
              >
                {editingId === genre.id ? (
                  <form onSubmit={(e) => handleUpdate(e, genre.id)} className="flex flex-1 gap-2 items-center">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      autoFocus
                      className="flex-1 p-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white"
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
                    <span className="font-medium text-gray-200">{genre.name}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(genre)}
                        className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
                        title="Tahrirlash"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(genre.id)}
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
      </div>
    </div>
  );
};

export default GenreManagement;
