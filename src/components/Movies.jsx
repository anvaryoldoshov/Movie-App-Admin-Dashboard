import React, { useState, useEffect } from "react";
import { getSeries, getEpisodesBySeries, createEpisode } from "../services/api";
import { Film, Hash, Link, Image, Save, ChevronDown, CheckCircle, XCircle } from 'lucide-react';

const Movies = () => {
  const [seriesList, setSeriesList] = useState([]);
  const [episodes, setEpisodes] = useState([]); 
  const [selectedSeriesId, setSelectedSeriesId] = useState("");
  const [newEpisode, setNewEpisode] = useState({
    title: "",
    episodeNumber: "",
    videoUrl: "",
    durationMinutes: "",
  });
  const [thumbFile, setThumbFile] = useState(null);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    getSeries()
      .then(response => {
        const data = Array.isArray(response) ? response : response.series || response.movies || [];
        setSeriesList(data);
      })
      .catch((e) => setError("Seriallarni olishda xato: " + e.message));
  }, []);

  useEffect(() => {
    setEpisodes([]); 
    if (!selectedSeriesId) return;
    getEpisodesBySeries(selectedSeriesId)
      .then(setEpisodes)
      .catch((e) => setError("Episodlarni olishda xato: " + e.message));
  }, [selectedSeriesId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!selectedSeriesId || !thumbFile || !newEpisode.title || !newEpisode.episodeNumber || !newEpisode.videoUrl) {
      setError("Iltimos, barcha maydonlarni to‘ldiring va rasmni tanlang.");
      return;
    }

    const formData = new FormData();
    formData.append("title", newEpisode.title);
    formData.append("episodeNumber", newEpisode.episodeNumber);
    formData.append("videoUrl", newEpisode.videoUrl);
    if (newEpisode.durationMinutes) formData.append("durationMinutes", newEpisode.durationMinutes);
    formData.append("image", thumbFile);

    try {
      const created = await createEpisode(selectedSeriesId, formData);
      setEpisodes((prev) => [...prev, created]);
      setSuccessMessage(`✅ Yangi epizod (${newEpisode.title}) muvaffaqiyatli yaratildi!`);

      // Reset form
      setNewEpisode({ title: "", episodeNumber: "", videoUrl: "", durationMinutes: "" });
      setThumbFile(null);
    } catch (err) {
      console.error(err);
      setError("❌ Episod qo‘shishda xatolik: " + (err.response?.data?.message || err.message || 'Server xatosi'));
    }
  };
  
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbFile(file);
      setError(""); 
    }
  };

  return (
    // ✨ TUZATISH: lg:ml-64 uslubi olib tashlandi, chunki bu komponentning o'zi mobil ko'rinishda oq bo'sh joy qoldirishi mumkin
    // Asosiy kontent endi barcha ekranlarda to'g'ri joylashadi
    <div className="min-h-screen bg-[#0f111a] flex justify-center items-center p-4 sm:p-6 lg:p-8 text-white">
      
      {/* Kartaning kengligi va stili */}
      <div className="max-w-lg w-full bg-[#1c1e2c] p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700/70">
        
        {/* Sarlavha */}
        <div className="mb-8 text-center">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-yellow-400">
                Yangi Epizod Qo‘shish 🎬
            </h1>
            <p className="text-gray-400 mt-2 text-sm">Serial uchun video ma'lumotlarini kiriting.</p>
        </div>
        
        {/* Xatolik / Muvaffaqiyat xabarlari */}
        {error && (
          <div className="flex items-center p-3 mb-6 bg-red-900/40 border border-red-600 rounded-lg text-red-300 text-sm shadow-lg animate-pulse">
            <XCircle className="w-5 h-5 mr-3"/>
            {error}
          </div>
        )}
        {successMessage && (
            <div className="flex items-center p-3 mb-6 bg-green-900/40 border border-green-600 rounded-lg text-green-300 text-sm shadow-lg">
                <CheckCircle className="w-5 h-5 mr-3"/>
                {successMessage}
            </div>
        )}

        <form onSubmit={handleCreate} className="space-y-6">
          
          {/* Series select */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Serial tanlang:
            </label>
            <div className="relative">
                <select
                className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner cursor-pointer"
                value={selectedSeriesId}
                onChange={(e) => {setSelectedSeriesId(e.target.value); setError("");}}
                required
                >
                <option value="" className='bg-[#1c1e2c]'>-- Serial tanlang --</option>
                {seriesList.map((s) => (
                    <option key={s.id} value={s.id} className='bg-[#1c1e2c]'>
                    {s.title}
                    </option>
                ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Epizod nomi:
            </label>
            <div className="relative">
                <Film className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                    type="text"
                    value={newEpisode.title}
                    onChange={(e) =>
                        setNewEpisode({ ...newEpisode, title: e.target.value })
                    }
                    className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-gray-500"
                    required
                    placeholder="Masalan: 1-Qism: Sarguzasht boshlanishi"
                />
            </div>
          </div>

          {/* Episode Number + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                Epizod raqami:
                </label>
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="number"
                        min="1"
                        value={newEpisode.episodeNumber}
                        onChange={(e) =>
                            setNewEpisode({ ...newEpisode, episodeNumber: e.target.value })
                        }
                        className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                        required
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                Davomiyligi (daqiqa):
                </label>
                <div className="relative">
                    <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                        type="number"
                        min="1"
                        value={newEpisode.durationMinutes}
                        onChange={(e) =>
                            setNewEpisode({ ...newEpisode, durationMinutes: e.target.value })
                        }
                        className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
                        placeholder="45"
                    />
                </div>
            </div>
          </div>

          {/* Video Link */}
          <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
              Video URL:
              </label>
              <div className="relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                      type="text"
                      value={newEpisode.videoUrl}
                      onChange={(e) =>
                          setNewEpisode({ ...newEpisode, videoUrl: e.target.value })
                      }
                      className="w-full p-3 pl-10 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-inner placeholder-gray-500"
                      required
                      placeholder="Video manzilini kiriting"
                  />
              </div>
          </div>

          {/* Thumbnail upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Epizod rasmi (Thumbnail):
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
              
              <label className={`cursor-pointer flex items-center space-x-2 py-2 px-4 rounded-lg shadow transition duration-200 text-sm font-medium min-w-[150px]
                  ${thumbFile ? 'bg-green-600 hover:bg-green-700' : 'bg-indigo-600 hover:bg-indigo-700'}
              `}>
                <Image className="w-5 h-5" />
                <span>
                  {thumbFile ? "Tanlandi" : "Rasm tanlang"}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  required
                />
              </label>
              
              {thumbFile ? (
                <div className="flex items-center space-x-2">
                    <img
                        src={URL.createObjectURL(thumbFile)}
                        alt="Thumbnail Preview"
                        className="w-16 h-12 rounded object-cover border-2 border-gray-600 shadow-md"
                    />
                    <span className="text-xs text-gray-400 truncate max-w-[150px]">{thumbFile.name}</span>
                </div>
              ) : (
                <p className="text-sm text-gray-500">JPG yoki PNG faylini yuklang</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full flex items-center justify-center space-x-2 py-3 bg-blue-600 text-white font-semibold text-lg rounded-lg hover:bg-blue-700 transition duration-300 ease-in-out shadow-lg shadow-blue-500/50 transform hover:scale-[1.01]"
          >
            <Save className="w-5 h-5" />
            <span>Epizodni Yaratish</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Movies;