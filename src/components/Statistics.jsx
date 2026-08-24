import React, { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, Users, TrendingUp } from 'lucide-react';
import { getSeriesStatistics } from '../services/api';

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.tarixiykinolar.uz';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

const Statistics = () => {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const data = await getSeriesStatistics();
        setStats(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Statistikani yuklab bo\'lmadi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  const totalSubscribers = stats.reduce((sum, s) => sum + (s.subscriberCount || 0), 0);
  const maxCount = Math.max(1, ...stats.map((s) => s.subscriberCount || 0));

  if (isLoading) {
    return (
      <div className="bg-[#0f111a] min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-64 text-white flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-gray-400 text-lg mt-4">Statistika yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#0f111a] min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-64 text-white">
      <div className="max-w-4xl mx-auto">

        <div className="mb-8 pt-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-blue-400">
            Statistika
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Har bir serial/film uchun hozirgi faol (to'lovli) obunachilar soni.
          </p>
        </div>

        {error && (
          <div className="flex items-center bg-red-900/40 text-red-300 p-4 rounded-xl mb-6 shadow-xl border border-red-700/50">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Xatolik:</span>&nbsp;{error}
          </div>
        )}

        {/* Umumiy son */}
        <div className="bg-[#1c1e2c] p-6 rounded-xl shadow-2xl border border-gray-700 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{totalSubscribers.toLocaleString()}</p>
            <p className="text-sm text-gray-400">Jami faol obunachi (barcha seriallar bo'yicha)</p>
          </div>
        </div>

        {/* Ro'yxat */}
        <div className="bg-[#1c1e2c] rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
          <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
            <TrendingUp className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm font-semibold text-gray-300">Serial/film bo'yicha obunachilar (ko'pdan kamga)</h2>
          </div>

          {stats.length === 0 ? (
            <p className="text-gray-500 text-center py-10">Hozircha ma'lumot yo'q.</p>
          ) : (
            <div className="divide-y divide-gray-700/70">
              {stats.map((s, idx) => (
                <div key={s.seriesId} className="flex items-center gap-4 px-6 py-4 hover:bg-white/5 transition">
                  <span className="w-6 text-center text-sm font-semibold text-gray-500 shrink-0">{idx + 1}</span>

                  <div className="w-12 h-16 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-700">
                    {s.imagePath ? (
                      <img
                        src={getFullImageUrl(s.imagePath)}
                        alt={s.title}
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate" title={s.title}>
                      {s.title}
                    </p>
                    <div className="mt-1.5 h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${Math.max(4, (s.subscriberCount / maxCount) * 100)}%` }}
                      />
                    </div>
                  </div>

                  <span className="shrink-0 text-right">
                    <span className="text-lg font-bold text-blue-400">{s.subscriberCount}</span>
                    <span className="block text-[11px] text-gray-500">obunachi</span>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Statistics;
