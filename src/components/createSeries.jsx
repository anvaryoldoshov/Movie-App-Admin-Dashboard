import React, { useState, useEffect } from "react";
import { createSeries, createSeason, getGenres } from "../services/api";
import { Upload, XCircle, CheckCircle, Plus, Trash2, Gift, Layers, Video } from 'lucide-react'; // Keling, zamonaviy ikonkalarni qo'shamiz

let seasonRowKeySeq = 0;
const emptySeasonRow = () => ({ key: seasonRowKeySeq++, seasonNumber: "", episodeCount: "", title: "" });

const CreateSeries = () => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("COMING_SOON");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [quarterlyPrice, setQuarterlyPrice] = useState("");
  const [freeEpisodesCount, setFreeEpisodesCount] = useState("");
  const [bunnyCollectionId, setBunnyCollectionId] = useState("");
  const [seasonRows, setSeasonRows] = useState([{ ...emptySeasonRow(), seasonNumber: "1" }]);
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");
  const [genres, setGenres] = useState([]);
  const [selectedGenreIds, setSelectedGenreIds] = useState([]);

  const updateSeasonRow = (key, field, value) => {
    setSeasonRows((prev) => prev.map((row) => (row.key === key ? { ...row, [field]: value } : row)));
  };

  const addSeasonRow = () => setSeasonRows((prev) => [...prev, emptySeasonRow()]);

  const removeSeasonRow = (key) => setSeasonRows((prev) => prev.filter((row) => row.key !== key));

  useEffect(() => {
    getGenres().then(setGenres).catch(() => setGenres([]));
  }, []);

  const toggleGenre = (id) => {
    setSelectedGenreIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title || !image) {
      // Message UI ga moslash
      setMessage("Barcha maydonlarni to‘ldiring.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("status", status);
      if (monthlyPrice) formData.append("monthlyPrice", monthlyPrice);
      if (quarterlyPrice) formData.append("quarterlyPrice", quarterlyPrice);
      if (freeEpisodesCount) formData.append("freeEpisodesCount", freeEpisodesCount);
      if (bunnyCollectionId) formData.append("bunnyCollectionId", bunnyCollectionId);
      selectedGenreIds.forEach((id) => formData.append("genreIds", id));
      formData.append("image", image);

      const res = await createSeries(formData);

      // Fasllarni ketma-ket yaratish (agar admin oldindan belgilagan bo'lsa)
      const validRows = seasonRows.filter((row) => row.seasonNumber);
      let seasonWarning = "";
      for (const row of validRows) {
        try {
          await createSeason(
            res.id,
            Number(row.seasonNumber),
            row.episodeCount ? Number(row.episodeCount) : null,
            row.title || null
          );
        } catch (seasonErr) {
          seasonWarning = " (ba'zi fasllarni yaratishda xatolik yuz berdi, ularni 'Fasllar' sahifasida qo'shing)";
        }
      }

      setMessage(`✅ Yangi series muvaffaqiyatli yaratildi. ID: ${res.id}${seasonWarning}`);
      setTitle("");
      setImage(null);
      setStatus("COMING_SOON");
      setMonthlyPrice("");
      setQuarterlyPrice("");
      setFreeEpisodesCount("");
      setBunnyCollectionId("");
      setSeasonRows([{ ...emptySeasonRow(), seasonNumber: "1" }]);
      setSelectedGenreIds([]);
    } catch (error) {
      console.error(error);
      setMessage("❌ Xatolik yuz berdi. Series yaratilmadi.");
    }
  };

  return (
    // Responsive: Kichik ekranlarda chap margin (ml-64) olib tashlanadi
    <div className="min-h-screen bg-[#0f111a] flex justify-center items-center p-4 sm:p-6 lg:p-8 lg:ml-64 text-white">
      
      {/* Kartaning kengligi va stili */}
      <div className="max-w-xl w-full bg-[#1c1e2c] p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-700">
        
        {/* Sarlavha */}
        <div className="mb-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-blue-400">
                Series Yaratish ✨
            </h2>
            <p className="text-gray-400 text-center mt-2 text-sm">Series haqidagi asosiy ma'lumotlarni kiriting.</p>
        </div>
        
        {/* Form Elementlari */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Sarlavha:
            </label>
            <input
              type="text"
              className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 shadow-inner"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Series nomini kiriting"
            />
          </div>

          {/* Status Select */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Holat:
            </label>
            <select
              className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white shadow-inner appearance-none cursor-pointer"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="COMING_SOON" className='bg-[#1c1e2c]'>Tez kunda</option>
              <option value="PUBLISHED" className='bg-[#1c1e2c]'>Efirda / Nashr etilgan</option>
              <option value="UNLISTED" className='bg-[#1c1e2c]'>Yashirin</option>
              <option value="ARCHIVED" className='bg-[#1c1e2c]'>Arxivlangan</option>
              <option value="DRAFT" className='bg-[#1c1e2c]'>Qoralama</option>
              <option value="REMOVED" className='bg-[#1c1e2c]'>O'chirilgan</option>
            </select>
          </div>

          {/* Price Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                1 Oylik narx (so'm) <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 shadow-inner"
                value={monthlyPrice}
                onChange={(e) => setMonthlyPrice(e.target.value)}
                placeholder="Masalan: 15000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">
                3 Oylik narx (so'm) <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
              </label>
              <input
                type="number"
                min="0"
                className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 shadow-inner"
                value={quarterlyPrice}
                onChange={(e) => setQuarterlyPrice(e.target.value)}
                placeholder="Masalan: 40000"
              />
            </div>
          </div>

          {/* Free episodes count */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              Nechta qism bepul: <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
            </label>
            <input
              type="number"
              min="0"
              className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 shadow-inner"
              value={freeEpisodesCount}
              onChange={(e) => setFreeEpisodesCount(e.target.value)}
              placeholder="Masalan: 5 (birinchi 5 ta epizod obunasiz ochiq bo'ladi)"
            />
          </div>

          {/* Bunny Collection ID */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-400" />
              Bunny Collection ID: <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
            </label>
            <input
              type="text"
              className="w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 shadow-inner"
              value={bunnyCollectionId}
              onChange={(e) => setBunnyCollectionId(e.target.value)}
              placeholder="Collection ID yoki Bunny dashboard havolasini joylashtiring"
            />
            <p className="text-gray-500 text-xs mt-1">
              Agar bu serialning videolari Bunny'da alohida Collection'ga yuklangan bo'lsa, shu yerga qo'ying — epizod qo'shishda video va raqam avtomatik taklif qilinadi, "Seriallar ro'yxati"da esa bir bosishda hammasini import qilish mumkin bo'ladi.
            </p>
          </div>

          {/* Seasons pre-definition */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-orange-400" />
              Fasllar: <span className="text-gray-500 text-xs">(ixtiyoriy — epizod qo'shilganda avtomatik taqsimlash uchun)</span>
            </label>
            <div className="space-y-2">
              {seasonRows.map((row) => (
                <div key={row.key} className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="№"
                    value={row.seasonNumber}
                    onChange={(e) => updateSeasonRow(row.key, "seasonNumber", e.target.value)}
                    className="w-16 p-2.5 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                  />
                  <input
                    type="number"
                    min="1"
                    placeholder="Nechta qism (masalan 30)"
                    value={row.episodeCount}
                    onChange={(e) => updateSeasonRow(row.key, "episodeCount", e.target.value)}
                    className="flex-1 p-2.5 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                  />
                  <input
                    type="text"
                    placeholder="Nomi (ixtiyoriy)"
                    value={row.title}
                    onChange={(e) => updateSeasonRow(row.key, "title", e.target.value)}
                    className="flex-1 p-2.5 bg-[#0f111a] border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeSeasonRow(row.key)}
                    className="p-2.5 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white rounded-lg transition"
                    title="O'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addSeasonRow}
              className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-full text-xs font-medium transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Yana fasl qo'shish
            </button>
          </div>

          {/* Genre Selection */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Janrlar: <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
            </label>
            {genres.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Janrlar topilmadi.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {genres.map((genre) => {
                  const isSelected = selectedGenreIds.includes(genre.id);
                  return (
                    <button
                      type="button"
                      key={genre.id}
                      onClick={() => toggleGenre(genre.id)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition ${
                        isSelected
                          ? "bg-indigo-600 border-indigo-500 text-white"
                          : "bg-[#0f111a] border-gray-600 text-gray-300 hover:bg-gray-700/50"
                      }`}
                    >
                      {genre.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-300">
              Poster yuklash: (Maks. 5MB)
            </label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                id="image-upload"
                required
              />
              <label
                htmlFor="image-upload"
                className={`flex items-center justify-between w-full p-3 border rounded-lg cursor-pointer transition duration-300
                  ${image 
                      ? 'bg-green-800/20 border-green-600 hover:bg-green-800/40' 
                      : 'bg-[#0f111a] border-gray-600 hover:bg-gray-700/50'
                  }
                `}
              >
                <div className="flex items-center space-x-3 truncate">
                    {image ? (
                        <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    ) : (
                        <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className={`truncate ${image ? 'text-green-400' : 'text-gray-400'}`}>
                    {image ? image.name : "Rasmni tanlash uchun bosing"}
                    </span>
                </div>
                
                {image && (
                    <XCircle 
                        className="w-5 h-5 text-red-400 hover:text-red-500 cursor-pointer flex-shrink-0" 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setImage(null); }}
                        title="Rasmni o'chirish"
                    />
                )}
              </label>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition duration-300 ease-in-out shadow-lg shadow-indigo-500/50 transform hover:-translate-y-0.5"
          >
            ➕ Seriesni Saqlash
          </button>

          {/* Message */}
          {message && (
            <div
                className={`p-3 rounded-lg text-center font-medium ${
                    message.startsWith("❌")
                        ? "bg-red-900/40 border border-red-600 text-red-300"
                        : "bg-green-900/40 border border-green-600 text-green-300"
                } transition-all duration-500 ease-in-out`}
            >
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreateSeries;