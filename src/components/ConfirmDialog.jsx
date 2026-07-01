import React from "react";
import { AlertTriangle, Trash2, ShieldAlert } from "lucide-react";

const ICONS = {
  danger: <Trash2 className="w-8 h-8 text-red-400" />,
  warning: <ShieldAlert className="w-8 h-8 text-yellow-400" />,
  default: <AlertTriangle className="w-8 h-8 text-orange-400" />,
};

const CONFIRM_STYLES = {
  danger: "bg-red-600 hover:bg-red-700 shadow-red-500/30",
  warning: "bg-yellow-600 hover:bg-yellow-700 shadow-yellow-500/30",
  default: "bg-orange-600 hover:bg-orange-700 shadow-orange-500/30",
};

const ICON_BG = {
  danger: "bg-red-500/20 ring-red-500/30",
  warning: "bg-yellow-500/20 ring-yellow-500/30",
  default: "bg-orange-500/20 ring-orange-500/30",
};

const ConfirmDialog = ({
  isOpen,
  title = "Tasdiqlash",
  message = "Davom etishni xohlaysizmi?",
  confirmText = "Ha, tasdiqlash",
  cancelText = "Bekor qilish",
  type = "danger",
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/75 flex items-center justify-center z-[200] p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="bg-gray-800 rounded-2xl p-7 w-full max-w-sm shadow-2xl border border-gray-700">
        <div className="flex flex-col items-center text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ring-4 ${ICON_BG[type]}`}>
            {ICONS[type]}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
          <p className="text-gray-400 text-sm leading-relaxed mb-7">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white transition font-medium text-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl text-white transition font-semibold text-sm shadow-lg ${CONFIRM_STYLES[type]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
