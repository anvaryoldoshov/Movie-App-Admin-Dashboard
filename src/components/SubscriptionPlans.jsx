import React, { useState, useEffect } from "react";
import {
  getSubscriptionPlans,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
} from "../services/api";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";

const emptyForm = {
  name: "",
  description: "",
  monthlyPrice: "",
  quarterlyPrice: "",
  active: true,
};

const formatPrice = (price) => {
  if (!price && price !== 0) return "—";
  return Number(price).toLocaleString("uz-UZ") + " so'm";
};

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success'|'error', text }
  const [deletingId, setDeletingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await getSubscriptionPlans();
      setPlans(data);
    } catch (err) {
      setMessage({ type: "error", text: err });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const openCreate = () => {
    setEditingPlan(null);
    setFormData(emptyForm);
    setShowForm(true);
    setMessage(null);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name || "",
      description: plan.description || "",
      monthlyPrice: plan.monthlyPrice ?? "",
      quarterlyPrice: plan.quarterlyPrice ?? "",
      active: plan.active ?? true,
    });
    setShowForm(true);
    setMessage(null);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPlan(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        monthlyPrice: formData.monthlyPrice !== "" ? Number(formData.monthlyPrice) : null,
        quarterlyPrice: formData.quarterlyPrice !== "" ? Number(formData.quarterlyPrice) : null,
        active: formData.active,
      };

      if (editingPlan) {
        await updateSubscriptionPlan(editingPlan.id, payload);
        setMessage({ type: "success", text: "Obuna tarifi muvaffaqiyatli yangilandi." });
      } else {
        await createSubscriptionPlan(payload);
        setMessage({ type: "success", text: "Yangi obuna tarifi qo'shildi." });
      }
      closeForm();
      await loadPlans();
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteSubscriptionPlan(id);
      setPlans((prev) => prev.filter((p) => p.id !== id));
      setMessage({ type: "success", text: "Obuna tarifi o'chirildi." });
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 sm:p-6 lg:p-8 lg:ml-64">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-indigo-400 flex items-center gap-2">
              <CreditCard className="w-8 h-8" />
              Obuna Tariflari
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Foydalanuvchilar sotib olishi mumkin bo'lgan obuna tariflarini boshqaring.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-indigo-500/30"
          >
            <Plus className="w-5 h-5" />
            Yangi Tarif
          </button>
        </div>

        {/* Global Message */}
        {message && !showForm && (
          <div
            className={`mb-6 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
              message.type === "success"
                ? "bg-green-900/40 border border-green-600 text-green-300"
                : "bg-red-900/40 border border-red-600 text-red-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Create / Edit Form */}
        {showForm && (
          <div className="mb-8 bg-[#1c1e2c] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-100 mb-5">
              {editingPlan ? "Tarifni tahrirlash" : "Yangi tarif qo'shish"}
            </h2>

            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  message.type === "success"
                    ? "bg-green-900/40 border border-green-600 text-green-300"
                    : "bg-red-900/40 border border-red-600 text-red-300"
                }`}
              >
                {message.type === "success" ? (
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 flex-shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tarif nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Masalan: Premium Obuna"
                  className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Tavsif <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={2}
                  placeholder="Obuna qamrovi, imtiyozlar haqida qisqacha..."
                  className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    1 Oylik narx (so'm){" "}
                    <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="number"
                    name="monthlyPrice"
                    min="0"
                    value={formData.monthlyPrice}
                    onChange={handleChange}
                    placeholder="Masalan: 50000"
                    className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    3 Oylik narx (so'm){" "}
                    <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="number"
                    name="quarterlyPrice"
                    min="0"
                    value={formData.quarterlyPrice}
                    onChange={handleChange}
                    placeholder="Masalan: 130000"
                    className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Active toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name="active"
                  checked={formData.active}
                  onChange={handleChange}
                  className="sr-only"
                />
                {formData.active ? (
                  <ToggleRight className="w-9 h-9 text-indigo-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-500" />
                )}
                <span className="text-sm text-gray-300">
                  {formData.active ? (
                    <span className="text-green-400 font-medium">Faol</span>
                  ) : (
                    <span className="text-gray-400">Nofaol</span>
                  )}{" "}
                  — foydalanuvchilar bu tarifni sotib ola{" "}
                  {formData.active ? "oladi" : "olmaydi"}
                </span>
              </label>

              {/* Buttons */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeForm}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-60 shadow-lg shadow-indigo-500/30"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saqlanmoqda...
                    </>
                  ) : (
                    "Saqlash"
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Plans Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          </div>
        ) : plans.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Hali obuna tariflari yo'q.</p>
            <p className="text-sm mt-1">
              "Yangi Tarif" tugmasini bosib birinchisini qo'shing.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-[#1c1e2c] border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-lg transition hover:border-indigo-600/50 ${
                  plan.active ? "border-gray-700" : "border-gray-700/40 opacity-60"
                }`}
              >
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white truncate">{plan.name}</h3>
                    {plan.active ? (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-400 border border-green-700 flex-shrink-0">
                        Faol
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400 border border-gray-600 flex-shrink-0">
                        Nofaol
                      </span>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-gray-400 text-sm mb-2">{plan.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">1 oy:</span>
                      <span className="text-indigo-300 font-semibold">
                        {formatPrice(plan.monthlyPrice)}
                      </span>
                    </div>
                    <div className="w-px bg-gray-700 hidden sm:block" />
                    <div className="flex items-center gap-1.5 text-sm">
                      <span className="text-gray-500">3 oy:</span>
                      <span className="text-indigo-300 font-semibold">
                        {formatPrice(plan.quarterlyPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openEdit(plan)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition"
                  >
                    <Pencil className="w-4 h-4" />
                    Tahrirlash
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(plan.id)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-600/20 hover:bg-red-600 border border-red-700 hover:border-transparent text-red-400 hover:text-white rounded-lg text-sm font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                    O'chirish
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirm Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1e2c] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 text-center">
              Tarifni o'chirmoqchimisiz?
            </h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              Bu amalni qaytarib bo'lmaydi.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {deletingId === confirmDeleteId ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Ha, o'chir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionPlans;
