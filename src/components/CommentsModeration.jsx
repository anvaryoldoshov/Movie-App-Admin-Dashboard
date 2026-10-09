import React, { useState, useEffect, useCallback } from "react";
import { getAdminComments, setCommentHidden, deleteAdminComment, getAllSeries } from "../services/api";
import { Loader2, Trash2, Eye, EyeOff, AlertTriangle, CheckCircle, MessageSquare, Flag } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";

const formatDate = (iso) => {
  const d = new Date(iso);
  return isNaN(d) ? "" : d.toLocaleString("uz-UZ", { dateStyle: "short", timeStyle: "short" });
};

const CommentsModeration = () => {
  const [comments, setComments] = useState([]);
  const [series, setSeries] = useState([]);
  const [seriesId, setSeriesId] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null });

  const showSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const load = useCallback(async (nextPage, reset) => {
    try {
      setIsLoading(true);
      const data = await getAdminComments({ seriesId: seriesId || undefined, page: nextPage });
      setComments((prev) => (reset ? data.items : [...prev, ...data.items]));
      setHasMore(data.hasMore);
      setTotal(data.total);
      setPage(nextPage);
      setError(null);
    } catch (err) {
      setError(typeof err === "string" ? err : "Izohlarni yuklab bo'lmadi.");
    } finally {
      setIsLoading(false);
    }
  }, [seriesId]);

  useEffect(() => {
    getAllSeries().then(setSeries).catch(() => setSeries([]));
  }, []);

  useEffect(() => {
    load(0, true);
  }, [load]);

  const toggleHidden = async (comment) => {
    try {
      await setCommentHidden(comment.id, !comment.hidden);
      setComments((prev) =>
        prev.map((c) => (c.id === comment.id ? { ...c, hidden: !c.hidden, reportCount: c.hidden ? 0 : c.reportCount } : c))
      );
      showSuccess(comment.hidden ? "Izoh qayta ko'rsatildi" : "Izoh yashirildi");
    } catch (err) {
      setError(typeof err === "string" ? err : "Amalni bajarib bo'lmadi.");
    }
  };

  const handleDelete = (comment) => {
    setConfirmDialog({
      isOpen: true,
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, onConfirm: null });
        try {
          await deleteAdminComment(comment.id);
          setComments((prev) => prev.filter((c) => c.id !== comment.id));
          setTotal((t) => Math.max(0, t - 1));
          showSuccess("Izoh o'chirildi");
        } catch (err) {
          setError(typeof err === "string" ? err : "Izohni o'chirib bo'lmadi.");
        }
      },
    });
  };

  return (
    <div className="ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-900 text-white">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        type="danger"
        title="Izohni o'chirish"
        message="Izoh butunlay o'chiriladi. Davom etasizmi?"
        confirmText="Ha, o'chirish"
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog({ isOpen: false, onConfirm: null })}
      />

      <h1 className="text-3xl sm:text-4xl font-extrabold mb-8 text-center text-indigo-400 tracking-wider border-b-2 border-indigo-500/50 pb-3 flex items-center justify-center gap-3">
        <MessageSquare className="w-8 h-8" />
        Izohlar
      </h1>

      {error && (
        <div className="flex items-center bg-red-900/40 text-red-300 p-4 rounded-xl mb-6 border border-red-700/50 max-w-4xl mx-auto">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-900/40 text-green-300 p-4 rounded-xl mb-6 border border-green-700/50 max-w-4xl mx-auto">
          <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          {success}
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between mb-4">
          <select
            value={seriesId}
            onChange={(e) => setSeriesId(e.target.value)}
            className="p-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Barcha seriallar</option>
            {series.map((s) => (
              <option key={s.id} value={s.id}>{s.title}</option>
            ))}
          </select>
          <p className="text-gray-400 text-sm">
            Jami: <span className="text-white font-semibold">{total}</span> ta izoh · shikoyat qilinganlar tepada
          </p>
        </div>

        <div className="space-y-3">
          {!isLoading && comments.length === 0 && (
            <p className="text-gray-500 text-center py-10 italic">Izohlar yo'q.</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className={`rounded-xl p-4 border ${
                c.hidden
                  ? "bg-gray-800/40 border-gray-700 opacity-70"
                  : c.reportCount > 0
                  ? "bg-red-950/30 border-red-800/60"
                  : "bg-gray-800 border-gray-700"
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm mb-2">
                <span className="font-bold text-white">{c.authorName}</span>
                <span className="text-gray-500">{c.authorEmail}</span>
                <span className="text-indigo-300">· {c.seriesTitle}</span>
                <span className="text-gray-500">· {formatDate(c.createdAt)}</span>
                {c.reportCount > 0 && (
                  <span className="flex items-center gap-1 text-red-300 bg-red-900/50 px-2 py-0.5 rounded-full text-xs font-semibold">
                    <Flag className="w-3 h-3" /> {c.reportCount} ta shikoyat
                  </span>
                )}
                {c.hidden && (
                  <span className="text-yellow-300 bg-yellow-900/40 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Yashirilgan
                  </span>
                )}
              </div>
              <p className="text-gray-200 whitespace-pre-wrap break-words">{c.text}</p>
              <div className="flex gap-2 mt-3 justify-end">
                <button
                  onClick={() => toggleHidden(c)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-gray-700 hover:bg-gray-600 transition"
                >
                  {c.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {c.hidden ? "Ko'rsatish" : "Yashirish"}
                </button>
                <button
                  onClick={() => handleDelete(c)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-red-700 hover:bg-red-600 transition"
                >
                  <Trash2 className="w-4 h-4" /> O'chirish
                </button>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin h-8 w-8 text-indigo-500" />
          </div>
        )}
        {!isLoading && hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={() => load(page + 1, false)}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 font-semibold transition"
            >
              Yana yuklash
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentsModeration;
