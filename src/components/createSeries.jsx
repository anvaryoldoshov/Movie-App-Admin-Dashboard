import React, { useState } from "react";
import { createSeries } from "../services/api"; 
import { Upload, XCircle, CheckCircle } from 'lucide-react'; // Keling, zamonaviy ikonkalarni qo'shamiz

const CreateSeries = () => {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("COMING_SOON");
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [quarterlyPrice, setQuarterlyPrice] = useState("");
  const [image, setImage] = useState(null);
  const [message, setMessage] = useState("");

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
      formData.append("image", image);

      const res = await createSeries(formData);
      setMessage(`✅ Yangi series muvaffaqiyatli yaratildi. ID: ${res.id}`);
      setTitle("");
      setImage(null);
      setStatus("COMING_SOON");
      setMonthlyPrice("");
      setQuarterlyPrice("");
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