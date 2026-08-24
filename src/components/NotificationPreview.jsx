import React, { useState, useEffect } from 'react';
import { Clapperboard, Signal, Wifi, BatteryFull } from 'lucide-react';

const APP_NAME = 'Tarixiy Filmlar';

const NotificationPreview = ({ title, body, imageUrl }) => {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (imageUrl) setExpanded(true);
  }, [imageUrl]);

  const time = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });
  const displayTitle = title?.trim() || 'Bildirishnoma sarlavhasi';
  const displayBody = body?.trim() || 'Bildirishnoma matni shu yerda ko\'rinadi.';

  return (
    <div className="flex flex-col items-center">
      {/* Telefon korpusi */}
      <div className="w-[300px] rounded-[2.5rem] border-[10px] border-gray-950 bg-gray-950 shadow-2xl overflow-hidden">
        <div className="relative bg-gradient-to-b from-slate-800 via-slate-900 to-black h-[560px] overflow-hidden">

          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-950 rounded-b-2xl z-20" />

          {/* Status bar */}
          <div className="flex items-center justify-between px-6 pt-3 text-white text-xs relative z-10">
            <span className="font-medium">{time}</span>
            <div className="flex items-center gap-1.5">
              <Signal size={13} />
              <Wifi size={13} />
              <BatteryFull size={15} />
            </div>
          </div>

          {/* Soat / sana (lock-screen) */}
          <div className="text-center mt-10 text-white select-none">
            <p className="text-5xl font-light tracking-wide">{time}</p>
            <p className="text-sm text-gray-300 mt-1">
              {now.toLocaleDateString('uz-UZ', { weekday: 'long', day: 'numeric', month: 'long' })}
            </p>
          </div>

          {/* Notification card */}
          <div className="px-3 mt-8">
            <button
              type="button"
              onClick={() => setExpanded((e) => !e)}
              className="w-full text-left bg-[#2b2d3a]/95 backdrop-blur rounded-2xl p-3 shadow-xl border border-white/5 transition"
            >
              {/* Header row */}
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                  <Clapperboard size={12} className="text-white" />
                </div>
                <span className="text-[11px] text-gray-300 font-medium">{APP_NAME}</span>
                <span className="text-[11px] text-gray-500">&middot; hozir</span>
              </div>

              {/* Text + (collapsed) thumbnail */}
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-white truncate">{displayTitle}</p>
                  <p className={`text-[12px] text-gray-300 mt-0.5 ${expanded ? '' : 'line-clamp-2'}`}>
                    {displayBody}
                  </p>
                </div>
                {imageUrl && !expanded && (
                  <img
                    src={imageUrl}
                    alt="thumbnail"
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                  />
                )}
              </div>

              {/* Expanded image */}
              {imageUrl && expanded && (
                <div className="mt-2 w-full h-32 rounded-lg overflow-hidden bg-black/40">
                  <img src={imageUrl} alt="notification" className="w-full h-full object-cover" />
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-3 text-center max-w-[260px]">
        Taxminiy ko'rinish (Android). Haqiqiy qurilmada dizayn biroz farq qilishi mumkin.
        {imageUrl && ' Rasmni bosib, yig\'ilgan/kengaytirilgan holatni ko\'ring.'}
      </p>
    </div>
  );
};

export default NotificationPreview;
