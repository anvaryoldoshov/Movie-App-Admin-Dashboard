import React, { useState, useEffect, useRef } from "react";
import {
  getAllSeries,
  getEpisodesBySeries,
  createEpisode,
  updateEpisode,
  deleteEpisode,
  updateSeries,
  deleteSeries,
} from "../services/api";
import Episode from "./Episode";
import { Loader2, X, Plus, Edit3, Trash2, ChevronDown, ChevronUp, Image, Save, AlertTriangle, CheckCircle, Video, List, Zap, Minus } from 'lucide-react';

// Rasm manzilini to'g'rilash uchun yordamchi funksiya
const getFullImageUrl = (imagePath) => {
    if (!imagePath) return '';
    const BASE_URL = 'http://62.84.177.49';
    return `${BASE_URL}${imagePath}`;
};

const SeriesList = () => {
  const [series, setSeries] = useState([]);
  const [expandedSeries, setExpandedSeries] = useState(null);
  const [episodes, setEpisodes] = useState({});
  const [editSeries, setEditSeries] = useState(null);
  const [editEpisode, setEditEpisode] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    episodeNumber: "",
    videoUrl: "",
    durationMinutes: "",
    image: null,
    status: "",
    monthlyPrice: "",
    quarterlyPrice: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [imagePreview, setImagePreview] = useState(null);
  const [addEpisodeSeriesId, setAddEpisodeSeriesId] = useState(null);
  const modalRef = useRef(null);

  // --- LOGIKA: ORIGINAL KODDAN O'ZGARIShSIZ SAQLANGAN ---

  // Original useEffect (data fetch)
  useEffect(() => {
    const fetchSeries = async () => {
      try {
        setIsLoading(true);
        const data = await getAllSeries();
        setSeries(data);
      } catch (err) {
        setError("Failed to fetch series");
        console.error("Error fetching series:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSeries();
  }, []);

  // Original useEffect (escape key)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && (editSeries || editEpisode || addEpisodeSeriesId)) {
        setEditSeries(null);
        setEditEpisode(null);
        setAddEpisodeSeriesId(null);
        setFormData({
          title: "",
          episodeNumber: "",
          videoUrl: "",
          durationMinutes: "",
          image: null,
          status: "",
          monthlyPrice: "",
          quarterlyPrice: "",
        });
        setFormErrors({});
        setImagePreview(null);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [editSeries, editEpisode, addEpisodeSeriesId]);

  // Original fetchEpisodes
  const fetchEpisodes = async (seriesId) => {
    try {
      const data = await getEpisodesBySeries(seriesId);
      setEpisodes((prev) => ({ ...prev, [seriesId]: data }));
    } catch (err) {
      setError("Failed to fetch episodes");
      console.error("Error fetching episodes:", err);
    }
  };

  // Original handleSeriesClick
  const handleSeriesClick = (seriesId) => {
    if (expandedSeries === seriesId) {
      setExpandedSeries(null);
    } else {
      setExpandedSeries(seriesId);
      if (!episodes[seriesId]) {
        fetchEpisodes(seriesId);
      }
    }
  };

  // Original handleEditSeriesClick
  const handleEditSeriesClick = (series) => {
    setAddEpisodeSeriesId(null);
    setEditSeries(series);
    setFormData({
      title: series.title,
      status: series.status || '',
      image: null,
      monthlyPrice: series.monthlyPrice != null ? String(series.monthlyPrice) : "",
      quarterlyPrice: series.quarterlyPrice != null ? String(series.quarterlyPrice) : "",
    });
    setImagePreview(getFullImageUrl(series.imagePath));
    setFormErrors({});
  };

  // Original handleEditEpisodeClick
  const handleEditEpisodeClick = (episode) => {
    setAddEpisodeSeriesId(null); 
    setEditEpisode(episode);
    setFormData({
      title: episode.title,
      episodeNumber: episode.episodeNumber,
      videoUrl: episode.videoUrl,
      durationMinutes: episode.durationMinutes || "",
      image: null,
    });
    setImagePreview(
      episode.imagePath ? getFullImageUrl(episode.imagePath) : null
    );
    setFormErrors({});
  };

  // Original handleDeleteSeries
  const handleDeleteSeries = async (seriesId) => {
    if (!window.confirm("Are you sure you want to delete this series?")) return;
    try {
      await deleteSeries(seriesId);
      setSeries((prev) => prev.filter((s) => s.id !== seriesId));
      setEpisodes((prev) => {
        const updated = { ...prev };
        delete updated[seriesId];
        return updated;
      });
      setExpandedSeries(null);
      setError(null);
      setSuccess("Series deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete series: " + (err.message || "Unknown error"));
      console.error("Error deleting series:", err);
    }
  };

  // Original handleInputChange
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
  };

  // Original handleFileChange
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFormData((prev) => ({ ...prev, image: file }));
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  // Original validateForm
  const validateForm = (isEpisode) => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Title is required";
    if (isEpisode) {
      if (!formData.episodeNumber)
        errors.episodeNumber = "Episode number is required";
      if (!formData.videoUrl.trim()) errors.videoUrl = "Video URL is required";
    } else {
      if (!formData.status) errors.status = "Status is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Original handleUpdateSeries
  const handleUpdateSeries = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    const form = new FormData();
    form.append("title", formData.title);
    form.append("status", formData.status);
    if (formData.monthlyPrice) form.append("monthlyPrice", formData.monthlyPrice);
    if (formData.quarterlyPrice) form.append("quarterlyPrice", formData.quarterlyPrice);
    if (formData.image) {
      form.append("image", formData.image);
    }

    try {
      const updatedSeries = await updateSeries(editSeries.id, form);
      setSeries((prev) =>
        prev.map((s) => (s.id === editSeries.id ? updatedSeries : s))
      );
      setEditSeries(null);
      setFormData({
        title: "",
        episodeNumber: "",
        videoUrl: "",
        image: null,
        status: "",
        monthlyPrice: "",
        quarterlyPrice: "",
      });
      setImagePreview(null);
      setError(null);
      setSuccess("Series updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update series: " + (err.message || "Unknown error"));
      console.error("Error updating series:", err);
    }
  };

  // Original handleUpdateEpisode
  const handleUpdateEpisode = async (e) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    const form = new FormData();
    form.append("title", formData.title);
    form.append("episodeNumber", formData.episodeNumber);
    form.append("videoUrl", formData.videoUrl);
    if (formData.durationMinutes) form.append("durationMinutes", formData.durationMinutes);
    if (formData.image) {
      form.append("image", formData.image);
    }

    try {
      const updatedEpisode = await updateEpisode(editEpisode.id, form);
      setEpisodes((prev) => ({
        ...prev,
        [editEpisode.seriesId]: prev[editEpisode.seriesId].map((ep) =>
          ep.id === editEpisode.id ? updatedEpisode : ep
        ),
      }));
      setEditEpisode(null);
      setFormData({
        title: "",
        episodeNumber: "",
        videoUrl: "",
        image: null,
        status: "",
        monthlyPrice: "",
        quarterlyPrice: "",
      });
      setImagePreview(null);
      setError(null);
      setSuccess("Episode updated successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to update episode: " + (err.message || "Unknown error"));
      console.error("Error updating episode:", err);
    }
  };

  // Original handleDeleteEpisode
  const handleDeleteEpisode = async (episodeId, seriesId) => {
    if (!window.confirm("Are you sure you want to delete this episode?"))
      return;
    try {
      await deleteEpisode(episodeId);
      setEpisodes((prev) => ({
        ...prev,
        [seriesId]: prev[seriesId].filter((ep) => ep.id !== episodeId),
      }));
      setError(null);
      setSuccess("Episode deleted successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to delete episode: " + (err.message || "Unknown error"));
      console.error("Error deleting episode:", err);
    }
  };

  // Original handleAddEpisode
  const handleAddEpisode = async (e, seriesId) => {
    e.preventDefault();
    if (!validateForm(true)) return;

    const form = new FormData();
    form.append("title", formData.title);
    form.append("episodeNumber", formData.episodeNumber);
    form.append("videoUrl", formData.videoUrl);
    if (formData.durationMinutes) form.append("durationMinutes", formData.durationMinutes);
    if (formData.image) {
      form.append("image", formData.image);
    }

    try {
      const newEpisode = await createEpisode(seriesId, form);
      setEpisodes((prev) => ({
        ...prev,
        [seriesId]: [...(prev[seriesId] || []), newEpisode],
      }));
      
      // Qo'shishdan keyin formani yopish va tozalash
      setAddEpisodeSeriesId(null);
      setFormData({
        title: "",
        episodeNumber: "",
        videoUrl: "",
        image: null,
        status: "",
        monthlyPrice: "",
        quarterlyPrice: "",
      });
      setImagePreview(null);
      setError(null);
      setSuccess("Episode added successfully");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError("Failed to add episode: " + (err.message || "Unknown error"));
      console.error("Error adding episode:", err);
    }
  };

  // Yangi funksiya: Qo'shish formasini ochish/yopish
  const toggleAddEpisodeForm = (seriesId) => {
      // Agar shu serial allaqachon ochiq bo'lsa - yopish
      if (addEpisodeSeriesId === seriesId) {
          setAddEpisodeSeriesId(null);
      } else {
          // Boshqa formani yopish
          setEditSeries(null);
          setEditEpisode(null);
          // Yangi formani ochish va formData'ni tozalash
          setAddEpisodeSeriesId(seriesId);
          setFormData({
            title: "",
            episodeNumber: "",
            videoUrl: "",
            image: null,
            status: "",
            monthlyPrice: "",
            quarterlyPrice: "",
          });
          setImagePreview(null);
          setFormErrors({});
      }
  };


  // --- UI QISMI: YANADA YAXSHILANGAN DIZAYN ---
  
  // Loader
  if (isLoading) {
    return (
      <div className="ml-0 md:ml-64 p-4 min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <Loader2 className="animate-spin h-10 w-10 text-indigo-500" />
          <p className="text-gray-400 text-lg mt-4">Ma'lumotlar yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-0 md:ml-64 p-4 sm:p-6 lg:p-8 min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-10 text-center text-indigo-400 tracking-wider border-b-2 border-indigo-500/50 pb-3">
        Serial Kontentni Boshqarish Paneli 📺
      </h1>
      
      {/* Xabar Bandi */}
      {error && (
        <div className="flex items-center bg-red-900/40 text-red-300 p-4 rounded-xl mb-6 shadow-xl border border-red-700/50">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Xatolik:</span> {error}
        </div>
      )}
      {success && (
        <div className="flex items-center bg-green-900/40 text-green-300 p-4 rounded-xl mb-6 shadow-xl border border-green-700/50 animate-fade-in">
            <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">Muvaffaqiyat:</span> {success}
        </div>
      )}
      
      {/* Seriallar Gridi (Premium Ko'rinish) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8">
        {series.map((s) => (
          <div
            key={s.id}
            className="bg-gray-800 shadow-2xl rounded-xl overflow-hidden border border-gray-700/70 transition duration-300 hover:shadow-indigo-500/30 flex flex-col group"
          >
            {/* Rasm va Kengaytirish Tugmasi */}
            <div 
                className="relative w-full h-48 bg-gray-900 cursor-pointer"
                onClick={() => handleSeriesClick(s.id)}
            >
              <img
                src={getFullImageUrl(s.imagePath)}
                alt={s.title}
                className="w-full h-full object-cover transition duration-300 group-hover:opacity-80"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 transition-opacity">
                {expandedSeries === s.id ? (
                    <ChevronUp className="w-10 h-10 text-indigo-400 p-1 bg-gray-900/50 rounded-full" />
                ) : (
                    <ChevronDown className="w-10 h-10 text-indigo-400 p-1 bg-gray-900/50 rounded-full" />
                )}
              </div>
            </div>
            
            {/* Ma'lumot va Boshqaruv */}
            <div className="p-4 flex flex-col flex-grow">
              <h2 className="text-lg font-bold text-white mb-2 truncate" title={s.title}>
                {s.title}
              </h2>
              <div className="flex items-center space-x-2 text-sm">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      s.status === 'PUBLISHED' ? 'bg-green-600/20 text-green-400' :
                      s.status === 'COMING_SOON' ? 'bg-yellow-600/20 text-yellow-400' :
                      'bg-red-600/20 text-red-400'
                  }`}>
                      {s.status ? s.status.replace('_', ' ') : 'NO STATUS'}
                  </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                  {s.monthlyPrice != null && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-600/20 text-blue-300">1oy: {s.monthlyPrice.toLocaleString()} so'm</span>
                  )}
                  {s.quarterlyPrice != null && (
                      <span className="px-2 py-0.5 rounded text-xs bg-purple-600/20 text-purple-300">3oy: {s.quarterlyPrice.toLocaleString()} so'm</span>
                  )}
              </div>
              
              <div className="mt-4 flex space-x-3 border-t border-gray-700 pt-3">
                <button
                  onClick={() => handleEditSeriesClick(s)}
                  className="p-2 bg-indigo-600 text-white rounded-lg text-sm transition duration-200 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 flex items-center"
                  title="Serialni tahrirlash"
                  aria-label={`Edit series ${s.title}`}
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteSeries(s.id)}
                  className="p-2 bg-red-600 text-white rounded-lg text-sm transition duration-200 hover:bg-red-700 shadow-lg shadow-red-500/20 flex items-center"
                  title="Serialni o'chirish"
                  aria-label={`Delete series ${s.title}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Epizodlar Ro'yxati va Qo'shish Tugmasi (Expanded qism) */}
            {expandedSeries === s.id && (
                <div className="p-4 border-t border-gray-700/70 bg-gray-800/80">
                    <h3 className="text-sm font-bold text-indigo-400 mb-3 flex items-center space-x-2">
                        <List className="w-4 h-4"/>
                        <span>Epizodlar ({episodes[s.id]?.length || 0}):</span>
                    </h3>
                    
                    {/* IXCHAMLASHTIRILGAN EPIZODLAR RO'YXATI */}
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1 mb-4 border-b border-gray-700/50 pb-3 custom-scrollbar">
                      {episodes[s.id]?.length > 0 ? (
                        episodes[s.id].map((ep) => (
                          <div key={ep.id} className="flex items-center justify-between text-xs bg-gray-700/50 p-2 rounded-lg hover:bg-gray-700 transition">
                            <span className="truncate flex items-center space-x-1 font-medium text-gray-300">
                                <Video className="w-3 h-3 text-blue-400 flex-shrink-0" />
                                <span>{ep.episodeNumber}. {ep.title}</span>
                                {ep.durationMinutes && (
                                  <span className="text-gray-500 text-xs ml-1">⏱{ep.durationMinutes}daq</span>
                                )}
                            </span>
                            <div className="flex space-x-2 flex-shrink-0 ml-2">
                                <button
                                    onClick={() => handleEditEpisodeClick(ep)}
                                    className="text-indigo-400 hover:text-indigo-300 p-0.5"
                                    title="Tahrirlash"
                                >
                                    <Edit3 className="w-3 h-3" />
                                </button>
                                <button
                                    onClick={() => handleDeleteEpisode(ep.id, s.id)}
                                    className="text-red-400 hover:text-red-300 p-0.5"
                                    title="O'chirish"
                                >
                                    <Trash2 className="w-3 h-3" />
                                </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-sm italic">Epizodlar mavjud emas.</p>
                      )}
                    </div>
                    
                    {/* EPIZOD QO'SHISH TOGGLE/DROPDOWN TUGMASI */}
                    <button
                        onClick={() => toggleAddEpisodeForm(s.id)}
                        className={`w-full flex items-center justify-center space-x-2 py-2 rounded-lg text-sm font-bold transition duration-200 shadow-md ${
                            addEpisodeSeriesId === s.id ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/30' : 'bg-green-600 hover:bg-green-700 text-white shadow-green-500/30'
                        }`}
                    >
                        {addEpisodeSeriesId === s.id ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        <span>{addEpisodeSeriesId === s.id ? "Formani Yopish" : "Yangi Epizod Qo'shish"}</span>
                    </button>
                    
                    {/* EPIZOD QO'SHISH FORMASI (TOGGLEABLE) */}
                    {addEpisodeSeriesId === s.id && (
                        <div className="mt-4 p-4 bg-gray-900/50 rounded-xl border border-gray-700/50 shadow-inner animate-fade-in-down">
                            <h4 className="text-md font-bold text-green-400 mb-3 flex items-center space-x-2">
                                <Zap className="w-4 h-4"/>
                                <span>Yangi Epizod Ma'lumotlari</span>
                            </h4>
                            <form
                                onSubmit={(e) => handleAddEpisode(e, s.id)}
                                className="space-y-3"
                            >
                                {/* Title Input */}
                                <div>
                                    <label
                                    htmlFor={`episode-title-add-${s.id}`}
                                    className="block text-xs font-semibold text-gray-300 uppercase mb-1"
                                    >
                                    Sarlavha <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                    id={`episode-title-add-${s.id}`}
                                    type="text"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleInputChange}
                                    placeholder="Epizod sarlavhasi"
                                    className={`w-full p-2.5 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm ${
                                        formErrors.title ? "border-red-500" : "border-gray-700"
                                    }`}
                                    aria-required="true"
                                    />
                                    {formErrors.title && (
                                    <p className="text-red-400 text-xs mt-1">
                                        {formErrors.title}
                                    </p>
                                    )}
                                </div>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {/* Episode Number */}
                                    <div>
                                        <label
                                            htmlFor={`episode-number-add-${s.id}`}
                                            className="block text-xs font-semibold text-gray-300 uppercase mb-1"
                                        >
                                            № <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id={`episode-number-add-${s.id}`}
                                            type="number"
                                            name="episodeNumber"
                                            value={formData.episodeNumber}
                                            onChange={handleInputChange}
                                            placeholder="№"
                                            className={`w-full p-2.5 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm ${
                                            formErrors.episodeNumber
                                                ? "border-red-500"
                                                : "border-gray-700"
                                            }`}
                                            aria-required="true"
                                        />
                                        {formErrors.episodeNumber && (
                                            <p className="text-red-400 text-xs mt-1">
                                            {formErrors.episodeNumber}
                                            </p>
                                        )}
                                    </div>

                                    {/* Duration Minutes */}
                                    <div>
                                        <label
                                            htmlFor={`episode-duration-add-${s.id}`}
                                            className="block text-xs font-semibold text-gray-300 uppercase mb-1"
                                        >
                                            Daqiqa
                                        </label>
                                        <input
                                            id={`episode-duration-add-${s.id}`}
                                            type="number"
                                            name="durationMinutes"
                                            value={formData.durationMinutes}
                                            onChange={handleInputChange}
                                            placeholder="45"
                                            min="1"
                                            className="w-full p-2.5 bg-gray-800 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm"
                                        />
                                    </div>

                                    {/* Video URL */}
                                    <div className="col-span-1">
                                        <label
                                            htmlFor={`video-url-add-${s.id}`}
                                            className="block text-xs font-semibold text-gray-300 uppercase mb-1"
                                        >
                                            Video URL <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id={`video-url-add-${s.id}`}
                                            type="text"
                                            name="videoUrl"
                                            value={formData.videoUrl}
                                            onChange={handleInputChange}
                                            placeholder="Video URL manzili"
                                            className={`w-full p-2.5 bg-gray-800 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white text-sm ${
                                            formErrors.videoUrl
                                                ? "border-red-500"
                                                : "border-gray-700"
                                            }`}
                                            aria-required="true"
                                        />
                                        {formErrors.videoUrl && (
                                            <p className="text-red-400 text-xs mt-1">
                                            {formErrors.videoUrl}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                
                                {/* Rasm Yuklash */}
                                <div>
                                    <label
                                        htmlFor={`episode-image-add-${s.id}`}
                                        className="block text-xs font-semibold text-gray-300 uppercase mb-1"
                                    >
                                        Rasm (Thumbnail)
                                    </label>
                                    <input
                                        id={`episode-image-add-${s.id}`}
                                        type="file"
                                        name="image"
                                        onChange={handleFileChange}
                                        className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                                        accept="image/*"
                                    />
                                    {imagePreview && (
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="mt-2 w-full h-24 object-contain rounded-lg border border-gray-600/50"
                                        />
                                    )}
                                </div>
                                
                                <button
                                    type="submit"
                                    className="w-full bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors font-bold flex items-center justify-center space-x-2 mt-4 shadow-md shadow-indigo-500/30"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>Saqlash va Qo'shish</span>
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
          </div>
        ))}
      </div>

      {/* --- MODAL (Tahrirlash) --- */}
      {(editSeries || editEpisode) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-fade-in"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && (setEditSeries(null) || setEditEpisode(null))} // Click outside to close
          ref={modalRef}
        >
          <div className="bg-gray-800 p-6 sm:p-8 rounded-xl w-full max-w-lg shadow-3xl border border-indigo-700/50 transform transition-all duration-300 max-h-[90vh] overflow-y-auto text-white">
            
            {/* Modal Sarlavha va Yopish */}
            <div className="flex justify-between items-center mb-6 border-b border-gray-700/50 pb-3">
              <h2 className="text-2xl font-bold text-indigo-400">
                {editSeries ? 'Serialni Tahrirlash' : 'Epizodni Tahrirlash'}
              </h2>
              <button
                onClick={() => { setEditSeries(null); setEditEpisode(null); setFormData({ title: "", episodeNumber: "", videoUrl: "", image: null, status: "", monthlyPrice: "", quarterlyPrice: "" }); setFormErrors({}); setImagePreview(null); }}
                className="text-gray-400 hover:text-white transition duration-200 p-1 rounded-full hover:bg-gray-700"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            {/* Modal Xatolik xabari */}
            {error && (
              <div className="bg-red-900/40 text-red-300 p-3 rounded-lg mb-4 text-sm border border-red-700">
                {error}
              </div>
            )}

            {editSeries ? (
              // SERIALNI TAHRIRLASH FORMASI
              <form onSubmit={handleUpdateSeries} className="space-y-4">
                {/* Title Input */}
                <div>
                  <label htmlFor="series-title" className="block text-sm font-medium text-gray-300 mb-2">
                    Serial Sarlavhasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="series-title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Serial nomini kiriting"
                    className={`w-full p-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white ${formErrors.title ? "border-red-500" : "border-gray-700"}`}
                    aria-required="true"
                  />
                  {formErrors.title && (<p className="text-red-400 text-xs mt-1">{formErrors.title}</p>)}
                </div>
                
                {/* Status Select */}
                <div>
                  <label htmlFor="series-status" className="block text-sm font-medium text-gray-300 mb-2">
                    Holat <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="series-status"
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className={`w-full p-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white ${formErrors.status ? "border-red-500" : "border-gray-700"}`}
                    aria-required="true"
                  >
                    <option value="" disabled className='bg-gray-700'>Holatni tanlang</option>
                    <option value="COMING_SOON" className='bg-gray-700'>Tez kunda</option>
                    <option value="PUBLISHED" className='bg-gray-700'>Efirda / Nashr etilgan</option>
                    <option value="UNLISTED" className='bg-gray-700'>Yashirin</option>
                    <option value="ARCHIVED" className='bg-gray-700'>Arxivlangan</option>
                    <option value="DRAFT" className='bg-gray-700'>Qoralama</option>
                    <option value="REMOVED" className='bg-gray-700'>O'chirilgan</option>
                  </select>
                  {formErrors.status && (<p className="text-red-400 text-xs mt-1">{formErrors.status}</p>)}
                </div>

                {/* Narx maydonlari */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="series-monthly-price" className="block text-sm font-medium text-gray-300 mb-2">
                      1 Oylik narx <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                    </label>
                    <input
                      id="series-monthly-price"
                      type="number"
                      min="0"
                      name="monthlyPrice"
                      value={formData.monthlyPrice}
                      onChange={handleInputChange}
                      placeholder="Masalan: 15000"
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="series-quarterly-price" className="block text-sm font-medium text-gray-300 mb-2">
                      3 Oylik narx <span className="text-gray-500 text-xs">(ixtiyoriy)</span>
                    </label>
                    <input
                      id="series-quarterly-price"
                      type="number"
                      min="0"
                      name="quarterlyPrice"
                      value={formData.quarterlyPrice}
                      onChange={handleInputChange}
                      placeholder="Masalan: 40000"
                      className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none text-white"
                    />
                  </div>
                </div>

                {/* Rasm Yuklash */}
                <div>
                  <label htmlFor="series-image" className="block text-sm font-medium text-gray-300 mb-2">
                    Serial Rasmi
                  </label>
                  <input
                    id="series-image"
                    type="file"
                    name="image"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    accept="image/*"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-24 h-20 object-contain rounded-lg border-2 border-gray-600"
                    />
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setEditSeries(null); setFormData({ title: "", episodeNumber: "", videoUrl: "", image: null, status: "", monthlyPrice: "", quarterlyPrice: "" }); setFormErrors({}); setImagePreview(null); }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    Bekor qilish
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 shadow-md shadow-indigo-500/30">
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            ) : (
              // EPIZODNI TAHRIRLASH FORMASI
              <form onSubmit={handleUpdateEpisode} className="space-y-4">
                {/* Title Input */}
                <div>
                  <label htmlFor="edit-episode-title" className="block text-sm font-medium text-gray-300 mb-2">
                    Epizod Sarlavhasi <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="edit-episode-title"
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Epizod sarlavhasini kiriting"
                    className={`w-full p-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white ${formErrors.title ? "border-red-500" : "border-gray-700"}`}
                    aria-required="true"
                  />
                  {formErrors.title && (<p className="text-red-400 text-xs mt-1">{formErrors.title}</p>)}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Episode Number */}
                    <div>
                        <label htmlFor="edit-episode-number" className="block text-sm font-medium text-gray-300 mb-2">
                            Epizod Raqami <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="edit-episode-number"
                            type="number"
                            name="episodeNumber"
                            value={formData.episodeNumber}
                            onChange={handleInputChange}
                            placeholder="Epizod raqami"
                            className={`w-full p-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white ${formErrors.episodeNumber ? "border-red-500" : "border-gray-700"}`}
                            aria-required="true"
                        />
                        {formErrors.episodeNumber && (<p className="text-red-400 text-xs mt-1">{formErrors.episodeNumber}</p>)}
                    </div>

                    {/* Duration Minutes */}
                    <div>
                        <label htmlFor="edit-duration-minutes" className="block text-sm font-medium text-gray-300 mb-2">
                            Davomiyligi (daqiqa)
                        </label>
                        <input
                            id="edit-duration-minutes"
                            type="number"
                            name="durationMinutes"
                            value={formData.durationMinutes}
                            onChange={handleInputChange}
                            placeholder="45"
                            min="1"
                            className="w-full p-3 bg-gray-900 border border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white"
                        />
                    </div>

                    {/* Video URL */}
                    <div>
                        <label htmlFor="edit-video-url" className="block text-sm font-medium text-gray-300 mb-2">
                            Video URL <span className="text-red-500">*</span>
                        </label>
                        <input
                            id="edit-video-url"
                            type="text"
                            name="videoUrl"
                            value={formData.videoUrl}
                            onChange={handleInputChange}
                            placeholder="Video URL manzilini kiriting"
                            className={`w-full p-3 bg-gray-900 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none shadow-inner text-white ${formErrors.videoUrl ? "border-red-500" : "border-gray-700"}`}
                            aria-required="true"
                        />
                        {formErrors.videoUrl && (<p className="text-red-400 text-xs mt-1">{formErrors.videoUrl}</p>)}
                    </div>
                </div>

                {/* Rasm Yuklash */}
                <div>
                  <label htmlFor="edit-episode-image" className="block text-sm font-medium text-gray-300 mb-2">
                    Epizod Rasmi
                  </label>
                  <input
                    id="edit-episode-image"
                    type="file"
                    name="image"
                    onChange={handleFileChange}
                    className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer"
                    accept="image/*"
                  />
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="mt-2 w-24 h-20 object-contain rounded-lg border-2 border-gray-600"
                    />
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button type="button" onClick={() => { setEditEpisode(null); setFormData({ title: "", episodeNumber: "", videoUrl: "", image: null, status: "", monthlyPrice: "", quarterlyPrice: "" }); setFormErrors({}); setImagePreview(null); }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium">
                    Bekor qilish
                  </button>
                  <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium flex items-center space-x-2 shadow-md shadow-indigo-500/30">
                    <Save className="w-4 h-4" />
                    <span>Saqlash</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeriesList;  