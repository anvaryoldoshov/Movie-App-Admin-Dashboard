import React from 'react';
import { Edit3, Trash2 } from 'lucide-react'; // Chiroyli ikonkalarni qo'shamiz

const Episode = ({ episode, seriesId, onEdit, onDelete }) => {
  return (
    // Har bir epizod kartasining dizayni
    <li className="p-4 bg-[#1c1e2c] border border-gray-700 rounded-lg shadow-md transition duration-300 hover:shadow-lg hover:bg-[#252836] mb-3">
      
      {/* Kontentni ajratish: Epizod ma'lumoti va tugmalar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Epizod Ma'lumoti */}
        <div className="flex-grow min-w-0">
          <p className="font-semibold text-lg text-white truncate" title={episode.title}>
            {episode.title}
          </p>
          <p className="text-sm text-gray-400">
            Epizod: <span className='text-blue-400 font-medium'>{episode.episodeNumber}</span>
            {episode.durationMinutes && (
              <span className="ml-3 text-gray-500">⏱ {episode.durationMinutes} daq</span>
            )}
          </p>
        </div>
        
        {/* Tugmalar guruhi */}
        <div className="flex space-x-3 items-center flex-shrink-0">
          {/* Tahrirlash Tugmasi */}
          <button
            onClick={() => onEdit(episode)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm font-medium transition duration-300 hover:bg-indigo-700 shadow-md transform hover:scale-[1.03]"
            title="Tahrirlash"
          >
            <Edit3 className="w-4 h-4" />
            <span className="hidden sm:inline">Tahrirlash</span>
          </button>
          
          {/* O'chirish Tugmasi */}
          <button
            onClick={() => onDelete(episode.id, seriesId)}
            className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm font-medium transition duration-300 hover:bg-red-700 shadow-md transform hover:scale-[1.03]"
            title="O'chirish"
          >
            <Trash2 className="w-4 h-4" />
            <span className="hidden sm:inline">O‘chirish</span>
          </button>
        </div>
      </div>
    </li>
  );
};

export default Episode;