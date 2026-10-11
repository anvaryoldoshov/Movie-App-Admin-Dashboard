import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, AlertTriangle, ArrowLeft, Users, ShoppingCart, Wallet, CalendarDays } from 'lucide-react';
import { getSeriesMonthlyStatistics } from '../services/api';

const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  const BASE_URL = process.env.REACT_APP_API_URL || 'https://api.tarixiykinolar.uz';
  if (imagePath.startsWith('http')) return imagePath;
  return `${BASE_URL}${imagePath}`;
};

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const formatMonth = (value) => {
  const [year, month] = (value || '').split('-');
  const name = MONTHS[Number(month) - 1];
  return name ? `${name} ${year}` : value;
};

const formatSum = (value) => `${Number(value || 0).toLocaleString('ru-RU')} so'm`;

const SummaryCard = ({ icon: Icon, color, value, label }) => (
  <div className="bg-[#1c1e2c] p-5 rounded-xl shadow-2xl border border-gray-700 flex items-center gap-4">
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color.bg}`}>
      <Icon className={`w-5 h-5 ${color.text}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xl font-bold text-white truncate">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  </div>
);

const SeriesStatistics = () => {
  const { seriesId } = useParams();
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        setStats(await getSeriesMonthlyStatistics(seriesId));
        setError(null);
      } catch (err) {
        setError(typeof err === 'string' ? err : 'Statistikani yuklab bo\'lmadi.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, [seriesId]);

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

  const months = stats?.months || [];
  const maxAmount = Math.max(1, ...months.map((m) => m.amount || 0));

  return (
    <div className="bg-[#0f111a] min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-64 text-white">
      <div className="max-w-4xl mx-auto">
        <Link to="/statistics" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white pt-4 mb-6">
          <ArrowLeft className="w-4 h-4" />
          Statistikaga qaytish
        </Link>

        {error && (
          <div className="flex items-center bg-red-900/40 text-red-300 p-4 rounded-xl mb-6 shadow-xl border border-red-700/50">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Xatolik:</span>&nbsp;{error}
          </div>
        )}

        {stats && (
          <>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-20 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-gray-700">
                {stats.imagePath ? (
                  <img src={getFullImageUrl(stats.imagePath)} alt={stats.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-blue-400 truncate">{stats.title}</h1>
                <p className="text-gray-400 text-sm mt-1">Oylar bo'yicha sotuvlar</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <SummaryCard
                icon={Users}
                color={{ bg: 'bg-blue-600/20', text: 'text-blue-400' }}
                value={stats.activeSubscribers.toLocaleString('ru-RU')}
                label="Hozirgi faol obunachilar"
              />
              <SummaryCard
                icon={ShoppingCart}
                color={{ bg: 'bg-yellow-600/20', text: 'text-yellow-400' }}
                value={stats.totalPurchases.toLocaleString('ru-RU')}
                label="Jami sotib olishlar"
              />
              <SummaryCard
                icon={Wallet}
                color={{ bg: 'bg-green-600/20', text: 'text-green-400' }}
                value={formatSum(stats.totalAmount)}
                label={stats.totalManualAmount > 0 ? `Jami summa (qo'lda: ${formatSum(stats.totalManualAmount)})` : 'Jami summa'}
              />
            </div>

            <div className="bg-[#1c1e2c] rounded-xl shadow-2xl border border-gray-700 overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-700">
                <CalendarDays className="w-4 h-4 text-yellow-400" />
                <h2 className="text-sm font-semibold text-gray-300">Oylar kesimida</h2>
              </div>

              {months.length === 0 ? (
                <p className="text-gray-500 text-center py-10">Bu serial hali sotib olinmagan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-gray-500 border-b border-gray-700">
                        <th className="px-6 py-3 font-medium">Oy</th>
                        <th className="px-4 py-3 font-medium text-right">Sotib olishlar</th>
                        <th className="px-4 py-3 font-medium text-right">Odamlar</th>
                        <th className="px-6 py-3 font-medium text-right">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700/70">
                      {months.map((m) => (
                        <tr key={m.month} className="hover:bg-white/5">
                          <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{formatMonth(m.month)}</td>
                          <td className="px-4 py-4 text-right text-yellow-400 font-semibold">{m.purchases}</td>
                          <td className="px-4 py-4 text-right text-gray-300">{m.buyers}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="font-bold text-green-400 whitespace-nowrap">{formatSum(m.amount)}</span>
                            <div className="mt-1.5 h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500 rounded-full ml-auto"
                                style={{ width: `${Math.max(4, (m.amount / maxAmount) * 100)}%` }}
                              />
                            </div>
                            {m.manualPurchases > 0 && (
                              <span className="block text-[11px] text-gray-400 mt-1 whitespace-nowrap">
                                Pixy: {formatSum(m.amount - m.manualAmount)} · Qo'lda ({m.manualPurchases}): {formatSum(m.manualAmount)}
                              </span>
                            )}
                            <span className="block text-[11px] text-gray-500 mt-1 whitespace-nowrap">
                              foydalanuvchilar to'lagan: {formatSum(m.paidAmount)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <p className="text-xs text-gray-500 mt-4">
              Summa har bir xarid qilingan paytdagi narx bo'yicha hisoblanadi (narx keyin o'zgarsa, eski xaridlar o'zgarmaydi).
              "Foydalanuvchilar to'lagan" — Pixy orqali narx + 4% komissiya, qo'lda to'lovlar esa admin kiritgan summa.
              "Qo'lda" — admin paneldan "To'lov qildi" deb yoqilgan obunalar (masalan, kartaga o'tkazma).
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default SeriesStatistics;
