import React, { useState, useEffect } from 'react';
import { pushNotification, getRecentSounds } from '../services/api';
import NotificationPreview from './NotificationPreview';

const SendNotification = () => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    sound: '',
    image: null,
  });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [recentSounds, setRecentSounds] = useState([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    fetchRecentSounds();
  }, []);

  const fetchRecentSounds = async () => {
    const sounds = await getRecentSounds();
    setRecentSounds(Array.isArray(sounds) ? sounds : []);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSoundPick = (value) => {
    setFormData({ ...formData, sound: value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const resetForm = () => {
    setFormData({ title: '', body: '', sound: '', image: null });
    setPreviewUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!formData.title.trim() || !formData.body.trim()) {
      setError('Sarlavha va matn majburiy.');
      return;
    }

    setSending(true);
    try {
      const result = await pushNotification(formData);
      setSuccess(
        `Yuborildi! Muvaffaqiyatli: ${result.success ?? 0}, Xato: ${result.failed ?? 0}`
      );
      resetForm();
      fetchRecentSounds();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      setError(typeof err === 'string' ? err : 'Push-notification yuborishda xatolik yuz berdi.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#0f111a] min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-64 text-white">
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 pt-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-blue-400">
            Push-notification yuborish
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Barcha foydalanuvchilarga push-xabar yuboring.
          </p>
        </div>

        {success && (
          <div className="p-3 mb-6 bg-green-900/40 border border-green-600 rounded-lg text-green-300 text-center shadow-lg">
            {success}
          </div>
        )}
        {error && (
          <div className="p-3 mb-6 bg-red-900/40 border border-red-600 rounded-lg text-red-300 text-center shadow-lg">
            Xatolik: {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 items-start">

        <div className="bg-[#1c1e2c] p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6">

            {/* Sarlavha */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Sarlavha</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Masalan: Yangi serial qo'shildi!"
                className="block w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 shadow-inner"
                required
              />
            </div>

            {/* Matn */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Matn</label>
              <textarea
                name="body"
                value={formData.body}
                onChange={handleInputChange}
                rows={4}
                placeholder="Xabar matnini kiriting"
                className="block w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 shadow-inner resize-none"
                required
              />
            </div>

            {/* Sound */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Sound (ixtiyoriy)</label>
              <input
                type="text"
                name="sound"
                value={formData.sound}
                onChange={handleInputChange}
                placeholder="Masalan: notification_sound"
                className="block w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 shadow-inner"
              />
              {recentSounds.length > 0 && (
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-2">Oldin yozilganlar:</p>
                  <div className="flex flex-wrap gap-2">
                    {recentSounds.map((s) => (
                      <button
                        type="button"
                        key={s}
                        onClick={() => handleSoundPick(s)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition
                          ${formData.sound === s
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-[#0f111a] border-gray-600 text-gray-300 hover:border-blue-500 hover:text-white'
                          }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Rasm */}
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Rasm (ixtiyoriy)</label>
              <input
                type="file"
                name="image"
                onChange={handleFileChange}
                accept="image/*"
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0 file:text-sm file:font-semibold
                  file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer
                  bg-[#0f111a] border border-gray-600 rounded-lg p-1.5
                "
              />
            </div>

            {previewUrl && (
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">Rasm ko'rinishi</label>
                <div className="w-full h-auto max-h-80 overflow-hidden rounded-xl border-4 border-gray-700 shadow-xl bg-gray-900">
                  <img src={previewUrl} alt="Notification preview" className="w-full h-full object-contain" />
                </div>
              </div>
            )}

            {/* Tugma */}
            <div className="flex flex-wrap gap-4 pt-2">
              <button
                type="submit"
                disabled={sending}
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-300 shadow-lg min-w-[160px] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {sending ? 'Yuborilmoqda...' : 'Barchaga yuborish'}
              </button>
            </div>
          </form>
        </div>

        {/* Mobil ko'rinish preview */}
        <div className="bg-[#1c1e2c] p-6 rounded-xl shadow-2xl border border-gray-700 lg:sticky lg:top-6">
          <h2 className="text-sm font-semibold text-gray-300 mb-4 text-center">Mobilkada qanday ko'rinadi</h2>
          <NotificationPreview
            title={formData.title}
            body={formData.body}
            imageUrl={previewUrl}
          />
        </div>

        </div>
      </div>
    </div>
  );
};

export default SendNotification;
