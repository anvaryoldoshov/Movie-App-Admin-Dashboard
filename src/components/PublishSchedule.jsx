import React from "react";
import { Clock, Zap, Bell } from "lucide-react";

const TASHKENT_OFFSET_MIN = 5 * 60;
const pad = (n) => String(n).padStart(2, "0");

// Admin qaysi mintaqada bo'lishidan qat'i nazar vaqt Toshkent vaqti (UTC+5) deb olinadi
const tashkentParts = (date) => {
  const t = new Date(date.getTime() + TASHKENT_OFFSET_MIN * 60000);
  return {
    date: `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`,
    time: `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`,
  };
};

const addDays = (dateStr, days) => {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const emptySchedule = () => ({ mode: "NOW", date: "", time: "20:00", notifyBuyers: false });

export const scheduleFromEpisode = (episode) => {
  if (episode?.scheduled && episode.publishAt) {
    const p = tashkentParts(new Date(episode.publishAt));
    return { mode: "SCHEDULE", date: p.date, time: p.time, notifyBuyers: !!episode.notifyBuyers };
  }
  return { ...emptySchedule(), notifyBuyers: !!episode?.notifyBuyers };
};

export const scheduleToIso = (schedule) =>
  schedule.mode === "SCHEDULE" && schedule.date && schedule.time
    ? `${schedule.date}T${schedule.time}:00+05:00`
    : null;

export const validateSchedule = (schedule) => {
  if (schedule.mode !== "SCHEDULE") return null;
  const iso = scheduleToIso(schedule);
  if (!iso) return "Chiqish sanasi va vaqtini tanlang.";
  if (new Date(iso).getTime() <= Date.now()) return "Chiqish vaqti kelajakda bo'lishi kerak.";
  return null;
};

export const appendSchedule = (formData, schedule) => {
  const iso = scheduleToIso(schedule);
  if (iso) formData.append("publishAt", iso);
  formData.append("notifyBuyers", schedule.notifyBuyers ? "true" : "false");
};

const WEEKDAYS = ["yakshanba", "dushanba", "seshanba", "chorshanba", "payshanba", "juma", "shanba"];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

export const formatTashkent = (iso) => {
  if (!iso) return "";
  const t = new Date(new Date(iso).getTime() + TASHKENT_OFFSET_MIN * 60000);
  return `${t.getUTCDate()}-${MONTHS[t.getUTCMonth()]}, ${WEEKDAYS[t.getUTCDay()]} ${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
};

const formatLeft = (iso) => {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return "";
  const totalMin = Math.round(ms / 60000);
  const days = Math.floor(totalMin / 1440);
  const hours = Math.floor((totalMin % 1440) / 60);
  const mins = totalMin % 60;
  if (days > 0) return `${days} kun ${hours} soatdan keyin`;
  if (hours > 0) return `${hours} soat ${mins} daqiqadan keyin`;
  return `${mins} daqiqadan keyin`;
};

/**
 * Epizodning chiqish vaqti: "Hozir" yoki "Rejalashtirish" (Toshkent vaqti bilan).
 * lastScheduledAt berilsa, "oxirgi rejadan +7 kun" tez tanlash tugmasi chiqadi.
 */
const PublishSchedule = ({ value, onChange, episodeNumber, lastScheduledAt, compact = false }) => {
  const set = (patch) => onChange({ ...value, ...patch });
  const today = tashkentParts(new Date()).date;

  const presets = [
    { label: "Bugun 20:00", date: today, time: "20:00" },
    { label: "Ertaga 20:00", date: addDays(today, 1), time: "20:00" },
  ];
  if (lastScheduledAt) {
    const last = tashkentParts(new Date(lastScheduledAt));
    presets.push({ label: `Oxirgisidan +7 kun (${last.time})`, date: addDays(last.date, 7), time: last.time });
  }

  const iso = scheduleToIso(value);
  const error = validateSchedule(value);
  const labelCls = compact
    ? "block text-xs font-semibold text-gray-300 uppercase mb-1"
    : "block text-sm font-medium mb-2 text-gray-300";
  const inputCls = "p-2.5 bg-[#0f111a] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 [color-scheme:dark]";

  return (
    <div>
      <label className={labelCls}>Chiqish vaqti:</label>
      <div className="grid grid-cols-2 gap-2">
        {[
          { mode: "NOW", label: "Hozir", Icon: Zap },
          { mode: "SCHEDULE", label: "Rejalashtirish", Icon: Clock },
        ].map(({ mode, label, Icon }) => (
          <button
            key={mode}
            type="button"
            onClick={() => set(mode === "SCHEDULE" && !value.date ? { mode, date: addDays(today, 1) } : { mode })}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition
              ${value.mode === mode
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-[#0f111a] border-gray-600 text-gray-300 hover:border-blue-500"}`}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {value.mode === "SCHEDULE" && (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" min={today} value={value.date} onChange={(e) => set({ date: e.target.value })} className={inputCls} />
            <input type="time" value={value.time} onChange={(e) => set({ time: e.target.value })} className={inputCls} />
            <span className="text-xs text-gray-500">Toshkent vaqti</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => set({ date: p.date, time: p.time })}
                className="px-2.5 py-1 text-xs rounded-full border border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <label className="mt-3 flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
        <input
          type="checkbox"
          checked={value.notifyBuyers}
          onChange={(e) => set({ notifyBuyers: e.target.checked })}
          className="accent-blue-500"
        />
        <Bell className="w-4 h-4 text-pink-400" />
        Chiqqanda serialning amaldagi xaridorlariga push yuborilsin
      </label>

      {value.mode === "SCHEDULE" && (
        <p className={`mt-2 text-xs ${error ? "text-red-400" : "text-blue-300"}`}>
          {error ||
            `${episodeNumber ? `${episodeNumber}-qism` : "Qism"} ${formatTashkent(iso)} da ilovada paydo bo'ladi (${formatLeft(iso)}). Shu vaqtgacha ilovada "Tez kunda" bo'lib turadi.`}
        </p>
      )}
    </div>
  );
};

export default PublishSchedule;
