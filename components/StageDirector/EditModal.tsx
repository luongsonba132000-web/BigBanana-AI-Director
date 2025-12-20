import React from 'react';
import { X, Edit2, Check } from 'lucide-react';

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  title: string;
  icon?: React.ReactNode;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  textareaClassName?: string;
}

const EditModal: React.FC<EditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  title,
  icon,
  value,
  onChange,
  placeholder = '输入内容...',
  textareaClassName = 'font-normal'
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div 
        className="bg-[#1A1A1A] border border-zinc-700 rounded-xl p-6 max-w-2xl w-full space-y-4 shadow-2xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-white font-bold flex items-center gap-2">
            {icon || <Edit2 className="w-4 h-4 text-indigo-400" />}
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full h-64 bg-black text-white border border-zinc-700 rounded-lg p-4 text-sm outline-none focus:border-indigo-500 transition-colors resize-none ${textareaClassName}`}
          placeholder={placeholder}
          autoFocus
        />
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded-lg text-sm font-bold transition-colors"
          >
            取消
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditModal;
