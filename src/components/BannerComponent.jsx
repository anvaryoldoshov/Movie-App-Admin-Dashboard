import React, { useState, useEffect } from 'react';
import {
  getBanners,
  getSeries,
  addBanner,
  updateBanner,
  deleteBanner
} from '../services/api';
import ConfirmDialog from './ConfirmDialog';

// ***************************************************************
// BASE_URL server manzilini to'g'irlashni unutmang!
const BASE_URL = 'http://62.84.177.49';

// Manzilni xavfsiz shakllantirish funksiyasi
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    
    // Agar path '/' bilan boshlanmasa, '/' qo'shamiz
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    return `${BASE_URL}${cleanPath}`;
};
// ***************************************************************


const BannerComponent = () => {
  const [banners, setBanners] = useState([]);
  const [series, setSeries] = useState([]);
  const [formData, setFormData] = useState({
    id: null,
    image: null,
    imageUrl: '',
    seriesId: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, bannerId: null, seriesId: null, unlinked: false });

  useEffect(() => {
    fetchBanners();
    fetchSeries();
  }, []);

  const fetchBanners = async () => {
    try {
      const response = await getBanners();
      // Server endi BannerDto array qaytarishi kutilmoqda
      const bannersData = Array.isArray(response) ? response : response.banners || [];
      setBanners(bannersData);
    } catch (error) {
      console.error('Error fetching banners:', error);
      setError("Bannerlarni yuklashda xatolik.");
      setBanners([]);
    }
  };

  const fetchSeries = async () => {
    try {
      const data = await getSeries();
      setSeries(Array.isArray(data) ? data : data.series || []); 
    } catch (error) {
      console.error('Error fetching series:', error);
      setError("Seriallarni yuklashda xatolik.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'imageUrl') setPreviewUrl(getFullImageUrl(value));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, image: file });
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

 const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
        if (!formData.seriesId) {
            setError('Iltimos, serialni tanlang.');
            return;
        }
        
        if (!formData.image && !isEditing) {
             setError('Iltimos, rasm yuklang.');
             return;
        }
        if (isEditing && !formData.image && !formData.imageUrl) {
             setError('Banner rasmi mavjud emas. Iltimos, yangi rasm yuklang.');
             return;
        }

        if (isEditing) {
            await updateBanner(formData.id, formData.image, formData.imageUrl, formData.seriesId);
            setSuccess('Banner muvaffaqiyatli yangilandi!');
        } else {
            await addBanner(formData.seriesId, formData.image);
            setSuccess('Banner muvaffaqiyatli yaratildi!');
        }

        resetForm();
        fetchBanners();
        setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
        console.error('Error saving banner:', error);
        setError(error?.response?.data?.message || 'Saqlashda xatolik yuz berdi.');
    }
};


  const handleEdit = (banner) => {
    setFormData({
      id: banner.id,
      image: null,
      imageUrl: banner.image,
      // âœ¨ TUZATISH: Endi to'g'ridan-to'g'ri banner.seriesId ishlatilmoqda
      seriesId: banner.seriesId || '' 
    });
    
    setPreviewUrl(getFullImageUrl(banner.image));
    
    setIsEditing(true);
    setError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id, seriesId) => {
    setConfirmDialog({ isOpen: true, bannerId: id, seriesId, unlinked: !seriesId });
  };

  const confirmDelete = async () => {
    const { bannerId, seriesId } = confirmDialog;
    setConfirmDialog({ isOpen: false, bannerId: null, seriesId: null, unlinked: false });
    try {
      await deleteBanner(bannerId, seriesId);
      fetchBanners();
      setSuccess("Banner o'chirildi!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting banner:', error);
      setError(error?.message || "Bannerni o'chirishda xatolik.");
    }
  };

  const resetForm = () => {
    setFormData({ id: null, image: null, imageUrl: '', seriesId: '' });
    setPreviewUrl(null);
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="bg-[#0f111a] min-h-screen p-4 sm:p-6 lg:p-8 lg:ml-64 text-white">
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.unlinked ? "Serial bog'lanmagan" : "Bannerni o'chirish"}
        message={confirmDialog.unlinked
          ? "Bu banner hech qanday serial bilan bog'lanmagan. Shunga qaramay o'chirishni xohlaysizmi?"
          : "Haqiqatan ham ushbu bannerni o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi."}
        confirmText="Ha, o'chirish"
        type="danger"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmDialog({ isOpen: false, bannerId: null, seriesId: null, unlinked: false })}
      />

      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8 pt-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-center tracking-tight text-blue-400">
            {isEditing ? 'Banner Tahrirlash ðŸ› ï¸' : 'Yangi Banner Yaratish'}
          </h1>
          <p className="text-gray-400 text-center mt-2">Seriallar uchun bannerlarni yuklang va boshqaring.</p>
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

        {/* Form Kartasi */}
        <div className="bg-[#1c1e2c] p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700 mb-12">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Series Tanlash */}
            <div className='lg:col-span-1'>
              <label className="block text-sm font-medium mb-2 text-gray-300">Serialni tanlang</label>
              <select
                name="seriesId"
                value={formData.seriesId}
                onChange={handleInputChange}
                className="block w-full p-3 bg-[#0f111a] border border-gray-600 rounded-lg text-white focus:ring-blue-500 focus:border-blue-500 shadow-inner"
                required
              >
                <option value="">-- Serial tanlanmagan --</option>
                {series.map((s) => (
                  <option key={s.id} value={s.id} className='bg-[#1c1e2c] text-white'>
                    {s.title || `Series ID: ${s.id}`}
                  </option>
                ))}
              </select>
            </div>

            {/* Rasm Yuklash va Preview qismlari o'zgarishsiz qoldi */}
            {/* ... */}
            
            {/* Rasm Yuklash */}
            <div className='lg:col-span-1'>
                <label className="block text-sm font-medium mb-2 text-gray-300">
                    {isEditing ? 'Yangi rasmni yuklash (Agar o\'zgartirmoqchi bo\'lsangiz)' : 'Rasmni yuklash'}
                </label>
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
                    required={!isEditing && !formData.imageUrl} 
                />
            </div>

            {/* Rasm Preview */}
            {previewUrl && (
              <div className="col-span-1 lg:col-span-2">
                <label className="block text-sm font-medium mb-2 text-gray-300">Rasm Ko'rinishi</label>
                <div className='w-full h-auto max-h-80 overflow-hidden rounded-xl border-4 border-gray-700 shadow-xl bg-gray-900'>
                    <img
                        src={previewUrl}
                        alt="Banner Preview"
                        className="w-full h-full object-contain"
                    />
                </div>
              </div>
            )}

            {/* Tugmalar */}
            <div className="col-span-1 lg:col-span-2 flex flex-wrap gap-4 pt-4 justify-start">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition duration-300 shadow-lg min-w-[120px]"
              >
                {isEditing ? 'Yangilash (Update)' : 'Yaratish (Create)'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition duration-300 shadow-lg min-w-[120px]"
                >
                  Bekor qilish
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Bannerlar Ro'yxati */}
        <div className="bg-[#1c1e2c] p-6 sm:p-8 rounded-xl shadow-2xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-6 text-yellow-400">Mavjud Bannerlar</h2>
          
          {banners.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Hozircha hech qanday banner mavjud emas.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="bg-[#0f111a] rounded-xl overflow-hidden shadow-xl border border-gray-700 transition duration-300 hover:scale-[1.02]"
                >
                  {/* Banner rasmi */}
                  <div className='w-full h-40 overflow-hidden bg-gray-900'>
                     <img
                        src={getFullImageUrl(banner.image)}
                        alt="Banner"
                        className="w-full h-full object-cover transition duration-500 hover:opacity-80"
                      />
                  </div>
                  
                  {/* Ma'lumot va tugmalar */}
                  <div className='p-4'>
                    <p className="text-sm text-gray-300 font-medium mb-3">
                        Serial: <span className='text-blue-400 font-semibold'>
                            {/* âœ¨ TUZATISH: banner.seriesTitle (yoki seriesId) ishlatilmoqda */}
                            {banner.seriesTitle || (banner.seriesId ? `ID: ${banner.seriesId}` : 'Serial ma\'lumoti yo\'q')}
                        </span>
                    </p>
                    <div className="flex justify-between gap-3">
                      <button
                        onClick={() => handleEdit(banner)}
                        className="flex-1 px-3 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                      >
                        Tahrirlash
                      </button>
                      <button
                        // âœ¨ TUZATISH: To'g'ridan-to'g'ri banner.seriesId ishlatilmoqda
                        onClick={() => handleDelete(banner.id, banner.seriesId)}
                        className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
                      >
                        O'chirish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BannerComponent;
