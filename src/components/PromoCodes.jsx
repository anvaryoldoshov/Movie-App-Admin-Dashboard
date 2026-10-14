import React, { useState, useEffect } from "react";
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  getPromoCodeUsages,
  getAllSeries,
} from "../services/api";
import {
  Plus,
  Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  TicketPercent,
  ToggleLeft,
  ToggleRight,
  Users,
  Copy,
  X,
  Film,
  Search,
} from "lucide-react";

const emptyForm = {
  code: "",
  discountType: "PERCENT",
  discountValue: "",
  maxUses: "",
  validUntil: "",
  active: true,
  allSeries: true,
  seriesIds: [],
};

const som = (v) => Number(v || 0).toLocaleString("ru-RU") + " so'm";

const discountLabel = (p) =>
  p.discountType === "PERCENT" ? `${p.discountValue}%` : som(p.discountValue);

const isExpired = (p) => p.validUntil && new Date(p.validUntil + "T23:59:59") < new Date();

const formatDate = (v) => (v ? new Date(v).toLocaleDateString("ru-RU") : "—");

const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

const statusBadge = (p) => {
  if (!p.active) return { text: "Nofaol", cls: "bg-gray-700 text-gray-400 border-gray-600" };
  if (isExpired(p)) return { text: "Muddati tugagan", cls: "bg-red-900/40 text-red-300 border-red-700" };
  if (p.maxUses && p.usedCount >= p.maxUses)
    return { text: "Limit tugagan", cls: "bg-amber-900/40 text-amber-300 border-amber-700" };
  return { text: "Faol", cls: "bg-green-900/50 text-green-400 border-green-700" };
};

const Message = ({ message }) =>
  message ? (
    <div
      className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
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
  ) : null;

const PromoCodes = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [usagesFor, setUsagesFor] = useState(null);
  const [usages, setUsages] = useState([]);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [seriesList, setSeriesList] = useState([]);
  const [seriesSearch, setSeriesSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      setPromos(await getPromoCodes());
    } catch (err) {
      setMessage({ type: "error", text: String(err) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    getAllSeries()
      .then((data) => setSeriesList(Array.isArray(data) ? data : []))
      .catch(() => setSeriesList([]));
  }, []);

  const toggleSeries = (id) =>
    setFormData((prev) => ({
      ...prev,
      seriesIds: prev.seriesIds.includes(id)
        ? prev.seriesIds.filter((x) => x !== id)
        : [...prev.seriesIds, id],
    }));

  const visibleSeries = seriesList.filter((sr) =>
    (sr.title || "").toLowerCase().includes(seriesSearch.trim().toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setFormData(emptyForm);
    setSeriesSearch("");
    setShowForm(true);
    setMessage(null);
  };

  const openEdit = (p) => {
    setEditing(p);
    setFormData({
      code: p.code,
      discountType: p.discountType,
      discountValue: String(p.discountValue),
      maxUses: p.maxUses ? String(p.maxUses) : "",
      validUntil: p.validUntil || "",
      active: p.active,
      allSeries: p.allSeries,
      seriesIds: (p.series || []).map((sr) => sr.id),
    });
    setSeriesSearch("");
    setShowForm(true);
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setFormData(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === "code") v = value.toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (name === "discountValue" || name === "maxUses") v = value.replace(/\D/g, "");
    setFormData((prev) => ({ ...prev, [name]: v }));
  };

  const formError = () => {
    if (formData.code.length < 3) return "Promokod nomi kamida 3 ta belgi bo'lsin (lotin harf, raqam, - yoki _).";
    const value = Number(formData.discountValue);
    if (!value) return "Chegirma qiymatini kiriting.";
    if (formData.discountType === "PERCENT" && value > 100) return "Foiz 100 dan oshmasin.";
    if (!formData.allSeries && formData.seriesIds.length === 0) return "Kamida bitta serial tanlang yoki \"Barcha seriallar\"ni belgilang.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = formError();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const payload = {
      code: formData.code,
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      maxUses: formData.maxUses ? Number(formData.maxUses) : null,
      validUntil: formData.validUntil || null,
      active: formData.active,
      seriesIds: formData.allSeries ? [] : formData.seriesIds,
    };
    try {
      if (editing) {
        await updatePromoCode(editing.id, payload);
        setMessage({ type: "success", text: `${payload.code} promokodi yangilandi.` });
      } else {
        await createPromoCode(payload);
        setMessage({ type: "success", text: `${payload.code} promokodi yaratildi.` });
      }
      closeForm();
      await load();
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (p) => {
    try {
      await updatePromoCode(p.id, {
        code: p.code,
        discountType: p.discountType,
        discountValue: p.discountValue,
        maxUses: p.maxUses,
        validUntil: p.validUntil,
        active: !p.active,
        seriesIds: (p.series || []).map((sr) => sr.id),
      });
      setPromos((prev) => prev.map((x) => (x.id === p.id ? { ...x, active: !p.active } : x)));
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePromoCode(confirmDelete.id);
      setPromos((prev) => prev.filter((p) => p.id !== confirmDelete.id));
      setMessage({ type: "success", text: "Promokod o'chirildi." });
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
    } finally {
      setDeleting(false);
      setConfirmDelete(null);
    }
  };

  const openUsages = async (p) => {
    setUsagesFor(p);
    setUsages([]);
    setUsagesLoading(true);
    try {
      setUsages(await getPromoCodeUsages(p.id));
    } catch (error) {
      setMessage({ type: "error", text: String(error) });
      setUsagesFor(null);
    } finally {
      setUsagesLoading(false);
    }
  };

  const copyCode = (code) => {
    try {
      navigator.clipboard.writeText(code);
      setMessage({ type: "success", text: `${code} nusxalandi.` });
    } catch (_) {}
  };

  const totals = promos.reduce(
    (acc, p) => ({
      used: acc.used + p.usedCount,
      discount: acc.discount + p.totalDiscountInSom,
      revenue: acc.revenue + p.totalRevenueInSom,
    }),
    { used: 0, discount: 0, revenue: 0 }
  );

  const preview = (() => {
    const v = Number(formData.discountValue);
    if (!v) return null;
    const base = 50000;
    const d = formData.discountType === "PERCENT" ? Math.round((base * Math.min(v, 100)) / 100) : v;
    const final = Math.max(base - d, 1000);
    return `Masalan, ${som(base)} lik tarif → ${som(final)} (komissiyadan oldin)`;
  })();

  const inputCls =
    "w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-fuchsia-500";

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 sm:p-6 lg:p-8 lg:ml-64">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-fuchsia-400 flex items-center gap-2">
              <TicketPercent className="w-8 h-8" />
              Promokodlar
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              Foiz yoki so'mda chegirma beruvchi promokodlar. Har bir foydalanuvchi bitta promokodni bir marta ishlata oladi.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2.5 rounded-xl font-medium transition shadow-lg shadow-fuchsia-500/30"
          >
            <Plus className="w-5 h-5" />
            Yangi promokod
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-[#1c1e2c] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Promokod bilan to'lovlar</p>
            <p className="text-2xl font-bold text-white mt-1">{totals.used}</p>
          </div>
          <div className="bg-[#1c1e2c] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Berilgan jami chegirma</p>
            <p className="text-2xl font-bold text-amber-300 mt-1">{som(totals.discount)}</p>
          </div>
          <div className="bg-[#1c1e2c] border border-gray-700 rounded-xl p-4">
            <p className="text-gray-400 text-xs">Promokod orqali tushum</p>
            <p className="text-2xl font-bold text-green-400 mt-1">{som(totals.revenue)}</p>
          </div>
        </div>

        {!showForm && <Message message={message} />}

        {showForm && (
          <div className="mb-8 bg-[#1c1e2c] border border-gray-700 rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-100 mb-5">
              {editing ? `${editing.code} — tahrirlash` : "Yangi promokod"}
            </h2>
            <Message message={message} />

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Promokod nomi <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  maxLength={40}
                  placeholder="Masalan: KINO15"
                  className={`${inputCls} font-mono tracking-wider uppercase`}
                />
                <p className="text-xs text-gray-500 mt-1">Lotin harf, raqam, "-" yoki "_". Foydalanuvchi katta-kichik harf farqisiz kiritishi mumkin.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Chegirma <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <div className="flex rounded-lg overflow-hidden border border-gray-600 flex-shrink-0">
                    {[
                      { v: "PERCENT", l: "Foiz %" },
                      { v: "AMOUNT", l: "So'm" },
                    ].map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, discountType: o.v }))}
                        className={`px-4 py-2 text-sm font-medium transition ${
                          formData.discountType === o.v
                            ? "bg-fuchsia-600 text-white"
                            : "bg-[#0f111a] text-gray-400 hover:bg-[#2a2c3e]"
                        }`}
                      >
                        {o.l}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleChange}
                    placeholder={formData.discountType === "PERCENT" ? "Masalan: 10" : "Masalan: 15000"}
                    className={inputCls}
                  />
                </div>
                {preview && <p className="text-xs text-fuchsia-300/80 mt-1">{preview}</p>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Necha marta ishlatish mumkin <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="maxUses"
                    value={formData.maxUses}
                    onChange={handleChange}
                    placeholder="Bo'sh = cheksiz"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5">
                    Amal qilish muddati <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                  </label>
                  <input
                    type="date"
                    name="validUntil"
                    value={formData.validUntil}
                    onChange={handleChange}
                    className={`${inputCls} [color-scheme:dark]`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Qaysi seriallarga amal qiladi <span className="text-red-500">*</span>
                </label>
                <div className="flex rounded-lg overflow-hidden border border-gray-600 w-fit mb-2">
                  {[
                    { v: true, l: "Barcha seriallar" },
                    { v: false, l: "Tanlangan seriallar" },
                  ].map((o) => (
                    <button
                      key={String(o.v)}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, allSeries: o.v }))}
                      className={`px-4 py-2 text-sm font-medium transition ${
                        formData.allSeries === o.v
                          ? "bg-fuchsia-600 text-white"
                          : "bg-[#0f111a] text-gray-400 hover:bg-[#2a2c3e]"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                {formData.allSeries ? (
                  <p className="text-xs text-gray-500">Har qanday serial xaridiga va obunaga qo'llanadi.</p>
                ) : (
                  <div className="border border-gray-600 rounded-lg bg-[#0f111a]">
                    <div className="flex items-center gap-2 px-3 border-b border-gray-700">
                      <Search className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={seriesSearch}
                        onChange={(e) => setSeriesSearch(e.target.value)}
                        placeholder="Serial qidirish..."
                        className="w-full py-2.5 bg-transparent text-sm text-white placeholder-gray-500 focus:outline-none"
                      />
                      <span className="text-xs text-fuchsia-300 whitespace-nowrap">{formData.seriesIds.length} ta tanlandi</span>
                    </div>
                    <div className="max-h-56 overflow-y-auto p-1">
                      {visibleSeries.length === 0 ? (
                        <p className="text-center text-gray-500 text-sm py-4">Serial topilmadi</p>
                      ) : (
                        visibleSeries.map((sr) => (
                          <label
                            key={sr.id}
                            className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-[#2a2c3e] cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={formData.seriesIds.includes(sr.id)}
                              onChange={() => toggleSeries(sr.id)}
                              className="h-4 w-4 accent-fuchsia-600"
                            />
                            <span className="text-sm text-white">{sr.title}</span>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
                {!formData.allSeries && (
                  <p className="text-xs text-gray-500 mt-1">Obuna xaridiga faqat "Barcha seriallar" promokodi qo'llanadi.</p>
                )}
              </div>

              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData((prev) => ({ ...prev, active: e.target.checked }))}
                  className="sr-only"
                />
                {formData.active ? (
                  <ToggleRight className="w-9 h-9 text-fuchsia-400" />
                ) : (
                  <ToggleLeft className="w-9 h-9 text-gray-500" />
                )}
                <span className="text-sm text-gray-300">
                  {formData.active ? <span className="text-green-400 font-medium">Faol</span> : <span className="text-gray-400">Nofaol</span>}
                  {" "}— foydalanuvchilar bu promokodni {formData.active ? "ishlata oladi" : "ishlata olmaydi"}
                </span>
              </label>

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
                  className="px-5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-lg font-medium transition flex items-center gap-2 disabled:opacity-60"
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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400" />
          </div>
        ) : promos.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <TicketPercent className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-lg">Hali promokodlar yo'q.</p>
            <p className="text-sm mt-1">"Yangi promokod" tugmasini bosib birinchisini yarating.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {promos.map((p) => {
              const badge = statusBadge(p);
              return (
                <div
                  key={p.id}
                  className={`bg-[#1c1e2c] border border-gray-700 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center gap-4 shadow-lg transition hover:border-fuchsia-600/50 ${
                    p.active ? "" : "opacity-60"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <button
                        onClick={() => copyCode(p.code)}
                        title="Nusxalash"
                        className="font-mono text-lg font-bold tracking-wider text-white bg-[#0f111a] border border-dashed border-fuchsia-500/60 px-3 py-0.5 rounded-lg flex items-center gap-2 hover:border-fuchsia-400"
                      >
                        {p.code}
                        <Copy className="w-3.5 h-3.5 text-gray-500" />
                      </button>
                      <span className="px-2.5 py-0.5 rounded-full text-sm font-bold bg-fuchsia-600/20 text-fuchsia-300 border border-fuchsia-700">
                        −{discountLabel(p)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${badge.cls}`}>{badge.text}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mb-2">
                      <Film className="w-3.5 h-3.5 text-gray-500" />
                      {p.allSeries ? (
                        <span className="text-xs text-gray-300">Barcha seriallar va obuna</span>
                      ) : (
                        <>
                          {(p.series || []).slice(0, 4).map((sr) => (
                            <span key={sr.id} className="px-2 py-0.5 text-xs rounded-full bg-blue-600/30 text-blue-100">
                              {sr.title}
                            </span>
                          ))}
                          {(p.series || []).length > 4 && (
                            <span
                              className="px-2 py-0.5 text-xs rounded-full bg-blue-600/20 text-blue-200"
                              title={p.series.slice(4).map((sr) => sr.title).join(", ")}
                            >
                              +{p.series.length - 4}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
                      <span className="text-gray-400">
                        Ishlatildi:{" "}
                        <span className="text-white font-semibold">
                          {p.usedCount}
                          {p.maxUses ? ` / ${p.maxUses}` : ""}
                        </span>
                      </span>
                      <span className="text-gray-400">
                        Qo'llab ko'rgan: <span className="text-white font-semibold">{p.triedUsers}</span>
                      </span>
                      <span className="text-gray-400">
                        Chegirma: <span className="text-amber-300 font-semibold">{som(p.totalDiscountInSom)}</span>
                      </span>
                      <span className="text-gray-400">
                        Tushum: <span className="text-green-400 font-semibold">{som(p.totalRevenueInSom)}</span>
                      </span>
                      <span className="text-gray-400">
                        Muddat: <span className="text-white">{p.validUntil ? formatDate(p.validUntil) + " gacha" : "cheksiz"}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => openUsages(p)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-fuchsia-600/20 hover:bg-fuchsia-600/40 border border-fuchsia-700 text-fuchsia-200 rounded-lg text-sm font-medium transition"
                    >
                      <Users className="w-4 h-4" />
                      Kimlar ishlatdi
                    </button>
                    <button
                      onClick={() => toggleActive(p)}
                      title={p.active ? "Nofaol qilish" : "Faollashtirish"}
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                      {p.active ? <ToggleRight className="w-5 h-5 text-fuchsia-400" /> : <ToggleLeft className="w-5 h-5 text-gray-400" />}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      title="Tahrirlash"
                      className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p)}
                      title="O'chirish"
                      className="p-2 bg-red-600/20 hover:bg-red-600 border border-red-700 hover:border-transparent text-red-400 hover:text-white rounded-lg transition"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-[#1c1e2c] border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-2 text-center">{confirmDelete.code} o'chirilsinmi?</h3>
            <p className="text-gray-400 text-sm text-center mb-6">
              {confirmDelete.triedUsers > 0
                ? "Bu promokod bilan to'lovlar bor, uni o'chirib bo'lmaydi. Uning o'rniga nofaol qiling."
                : "Bu amalni qaytarib bo'lmaydi."}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg font-medium transition"
              >
                Bekor qilish
              </button>
              {confirmDelete.triedUsers === 0 && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Ha, o'chir"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {usagesFor && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={() => setUsagesFor(null)}>
          <div
            className="bg-[#1c1e2c] border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-white">
                  <span className="font-mono text-fuchsia-300">{usagesFor.code}</span> — foydalanishlar
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  To'lagan: {usagesFor.paidUsers} kishi · Qo'llab ko'rgan: {usagesFor.triedUsers} kishi
                </p>
              </div>
              <button onClick={() => setUsagesFor(null)} className="p-2 hover:bg-gray-700 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-auto p-2">
              {usagesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 animate-spin text-fuchsia-400" />
                </div>
              ) : usages.length === 0 ? (
                <p className="text-center text-gray-500 py-12">Bu promokod hali ishlatilmagan.</p>
              ) : (
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="text-gray-400 text-xs">
                      <th className="p-2">Sana</th>
                      <th className="p-2">Foydalanuvchi</th>
                      <th className="p-2">Nima uchun</th>
                      <th className="p-2 text-right">Chegirma</th>
                      <th className="p-2 text-right">To'lov</th>
                      <th className="p-2">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700/60">
                    {usages.map((u) => (
                      <tr key={u.paymentId}>
                        <td className="p-2 text-gray-400 whitespace-nowrap">{formatDateTime(u.createdAt)}</td>
                        <td className="p-2">
                          <div className="text-white">{u.username || <span className="italic text-gray-500">Ismsiz</span>}</div>
                          <div className="text-xs text-gray-500">ID {u.userId} · {u.email}</div>
                        </td>
                        <td className="p-2 text-gray-300">
                          {u.target}
                          {u.days ? <span className="text-gray-500"> · {u.days} kun</span> : null}
                        </td>
                        <td className="p-2 text-right text-amber-300 whitespace-nowrap">−{som(u.discountInSom)}</td>
                        <td className="p-2 text-right text-white whitespace-nowrap">{som(u.amountInSom)}</td>
                        <td className="p-2">
                          {u.status === "PAID" ? (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-900/50 text-green-400 border border-green-700">To'langan</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-gray-700 text-gray-400 border border-gray-600">To'lanmagan</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoCodes;
