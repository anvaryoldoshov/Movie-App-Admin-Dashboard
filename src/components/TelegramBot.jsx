import React, { useEffect, useMemo, useState } from "react";
import {
  getBotSeriesMappings,
  saveBotSeriesMapping,
  deleteBotSeriesMapping,
  getBotPurchases,
  getAllSeries,
} from "../services/api";
import { Send, Loader2, Plus, Save, Trash2, RefreshCw, Link2, AlertTriangle } from "lucide-react";

const STATUS = {
  APPLIED: { label: "Ochildi", cls: "bg-emerald-500/20 text-emerald-400" },
  PENDING_USER: { label: "Ilovaga kirmagan", cls: "bg-amber-500/20 text-amber-400" },
  PENDING_MAPPING: { label: "Serial bog'lanmagan", cls: "bg-red-500/20 text-red-400" },
  EXPIRED: { label: "Muddati o'tgan", cls: "bg-gray-500/20 text-gray-400" },
};

const formatDate = (v) => (v ? new Date(v).toLocaleDateString("ru-RU") : "—");
const formatDateTime = (v) =>
  v ? new Date(v).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" }) : "—";

const TelegramBot = () => {
  const [mappings, setMappings] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [seriesList, setSeriesList] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [message, setMessage] = useState(null);
  const [newRow, setNewRow] = useState({ botSeriesId: "", botTitle: "", seriesId: "" });

  const sortedSeries = useMemo(
    () => [...seriesList].sort((a, b) => (a.title || "").localeCompare(b.title || "")),
    [seriesList]
  );

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadMappings = async () => {
    const data = await getBotSeriesMappings();
    setMappings(data);
    setDrafts({});
  };

  const loadPurchases = async (status = statusFilter) => {
    const data = await getBotPurchases(status);
    setPurchases(data);
  };

  useEffect(() => {
    (async () => {
      try {
        const [series] = await Promise.all([getAllSeries(), loadMappings(), loadPurchases("")]);
        setSeriesList(Array.isArray(series) ? series : []);
      } catch (e) {
        showMessage("error", String(e));
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (botSeriesId, botTitle, seriesId) => {
    setSavingId(botSeriesId);
    try {
      const res = await saveBotSeriesMapping(botSeriesId, {
        botTitle,
        seriesId: seriesId === "" || seriesId == null ? null : Number(seriesId),
      });
      await Promise.all([loadMappings(), loadPurchases()]);
      showMessage(
        "success",
        res.appliedNow > 0 ? `Saqlandi. ${res.appliedNow} ta kutilayotgan xarid ochildi` : "Saqlandi"
      );
      return true;
    } catch (e) {
      showMessage("error", String(e));
      return false;
    } finally {
      setSavingId(null);
    }
  };

  const addRow = async () => {
    const id = Number(newRow.botSeriesId);
    if (!id) {
      showMessage("error", "Botdagi serial ID ni kiriting");
      return;
    }
    if (await save(id, newRow.botTitle, newRow.seriesId)) {
      setNewRow({ botSeriesId: "", botTitle: "", seriesId: "" });
    }
  };

  const remove = async (botSeriesId) => {
    if (!window.confirm(`Bot serial #${botSeriesId} bog'lanishini o'chirasizmi?`)) return;
    try {
      await deleteBotSeriesMapping(botSeriesId);
      await loadMappings();
      showMessage("success", "O'chirildi");
    } catch (e) {
      showMessage("error", String(e));
    }
  };

  const changeFilter = async (value) => {
    setStatusFilter(value);
    try {
      await loadPurchases(value);
    } catch (e) {
      showMessage("error", String(e));
    }
  };

  const unmappedCount = mappings.filter((m) => !m.seriesId).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f111a] text-white flex items-center justify-center lg:ml-64">
        <Loader2 className="w-8 h-8 animate-spin text-sky-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-white p-4 sm:p-6 lg:p-8 lg:ml-64">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-sky-400 flex items-center gap-2">
            <Send className="w-8 h-8" />
            Telegram bot
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            @Tarixiy_Filmlarbot dagi seriallarni ilovadagi seriallarga bog'lang. Botda sotib olingan seriallar
            shu bog'lanish orqali ilovada ochiladi.
          </p>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg text-sm border ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                : "bg-red-500/10 border-red-500/40 text-red-300"
            }`}
          >
            {message.text}
          </div>
        )}

        {unmappedCount > 0 && (
          <div className="p-3 rounded-lg text-sm border bg-amber-500/10 border-amber-500/40 text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {unmappedCount} ta bot seriali hali ilovadagi serialga bog'lanmagan
          </div>
        )}

        <section className="bg-[#1c1e2c] border border-gray-700 rounded-2xl p-4 sm:p-5">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Link2 className="w-5 h-5 text-sky-400" /> Seriallarni bog'lash
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="p-2 font-medium">Bot ID</th>
                  <th className="p-2 font-medium">Botdagi nomi</th>
                  <th className="p-2 font-medium">Ilovadagi serial</th>
                  <th className="p-2 font-medium">Kutilmoqda</th>
                  <th className="p-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {mappings.map((m) => {
                  const draft = drafts[m.botSeriesId];
                  const value = draft !== undefined ? draft : m.seriesId ?? "";
                  const changed = draft !== undefined && String(draft) !== String(m.seriesId ?? "");
                  return (
                    <tr key={m.botSeriesId}>
                      <td className="p-2 font-mono text-gray-300">{m.botSeriesId}</td>
                      <td className="p-2">{m.botTitle || <span className="text-gray-500 italic">—</span>}</td>
                      <td className="p-2 min-w-[220px]">
                        <select
                          value={value}
                          onChange={(e) => setDrafts((d) => ({ ...d, [m.botSeriesId]: e.target.value }))}
                          className={`w-full p-2 bg-[#0f111a] border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                            value === "" ? "border-red-500/60" : "border-gray-600"
                          }`}
                        >
                          <option value="">— Bog'lanmagan —</option>
                          {sortedSeries.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2">
                        {m.pendingCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-xs font-semibold">
                            {m.pendingCount} xarid
                          </span>
                        ) : (
                          <span className="text-gray-500">—</span>
                        )}
                      </td>
                      <td className="p-2">
                        <div className="flex gap-2 justify-end">
                          <button
                            disabled={!changed || savingId === m.botSeriesId}
                            onClick={() => save(m.botSeriesId, m.botTitle, value)}
                            className="p-2 rounded-lg bg-sky-600 hover:bg-sky-700 disabled:opacity-40 disabled:cursor-not-allowed"
                            title="Saqlash"
                          >
                            {savingId === m.botSeriesId ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Save className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => remove(m.botSeriesId)}
                            className="p-2 rounded-lg bg-red-600/80 hover:bg-red-700"
                            title="O'chirish"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Hali bog'lanish yo'q. Botdan birinchi xarid kelganda serial bu yerda avtomatik paydo bo'ladi
                      yoki pastdan qo'lda qo'shing.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-700 grid grid-cols-1 sm:grid-cols-[110px_1fr_1fr_auto] gap-2">
            <input
              type="number"
              placeholder="Bot ID"
              value={newRow.botSeriesId}
              onChange={(e) => setNewRow((r) => ({ ...r, botSeriesId: e.target.value }))}
              className="p-2 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <input
              type="text"
              placeholder="Botdagi nomi (ixtiyoriy)"
              value={newRow.botTitle}
              onChange={(e) => setNewRow((r) => ({ ...r, botTitle: e.target.value }))}
              className="p-2 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
            <select
              value={newRow.seriesId}
              onChange={(e) => setNewRow((r) => ({ ...r, seriesId: e.target.value }))}
              className="p-2 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">— Ilovadagi serial —</option>
              {sortedSeries.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
            <button
              onClick={addRow}
              className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 flex items-center justify-center gap-1"
            >
              <Plus className="w-4 h-4" /> Qo'shish
            </button>
          </div>
        </section>

        <section className="bg-[#1c1e2c] border border-gray-700 rounded-2xl p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-bold">Botdan kelgan xaridlar</h2>
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => changeFilter(e.target.value)}
                className="p-2 bg-[#0f111a] border border-gray-600 rounded-lg text-sm focus:outline-none"
              >
                <option value="">Hammasi</option>
                {Object.entries(STATUS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => changeFilter(statusFilter)}
                className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600"
                title="Yangilash"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-gray-400">
                <tr>
                  <th className="p-2 font-medium">Kelgan vaqt</th>
                  <th className="p-2 font-medium">Telegram ID</th>
                  <th className="p-2 font-medium">Serial</th>
                  <th className="p-2 font-medium">Tugash sanasi</th>
                  <th className="p-2 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {purchases.map((p) => {
                  const st = STATUS[p.status] || { label: p.status, cls: "bg-gray-500/20 text-gray-400" };
                  return (
                    <tr key={p.id}>
                      <td className="p-2 text-gray-400 whitespace-nowrap">{formatDateTime(p.receivedAt)}</td>
                      <td className="p-2">
                        <div className="font-mono">{p.telegramId}</div>
                        {p.username && <div className="text-xs text-gray-400">{p.username}</div>}
                      </td>
                      <td className="p-2">
                        <div>{p.seriesTitle || p.title || `Bot #${p.botSeriesId}`}</div>
                        {p.planDays && <div className="text-xs text-gray-400">{p.planDays} kun</div>}
                      </td>
                      <td className="p-2 whitespace-nowrap">{formatDate(p.appliedEndDate || p.expiresAt)}</td>
                      <td className="p-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
                {purchases.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      Xaridlar yo'q
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TelegramBot;
