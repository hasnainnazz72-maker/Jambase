import React from 'react';
import { X, Check, Globe } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { SupportedLanguage } from '../i18n/translations';

interface LanguageSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LanguageSelectorModal: React.FC<LanguageSelectorModalProps> = ({ isOpen, onClose }) => {
  const { language, setLanguage, languages, t } = useLanguage();

  if (!isOpen) return null;

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-3xl bg-[#160c0e] border border-[#3d181c] overflow-hidden shadow-2xl text-white flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 bg-gradient-to-r from-[#2a0e11] via-[#1a0c0f] to-[#2a0e11] border-b border-[#3d181c] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-[#DC2626]/20 text-[#E5A93C] flex items-center justify-center">
              <Globe size={18} />
            </span>
            <div>
              <h3 className="text-sm font-black text-white">{t('header.language', 'Select Language')}</h3>
              <p className="text-[11px] text-[#E5A93C]">International language options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Language List */}
        <div className="p-3 space-y-2 overflow-y-auto flex-1">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full p-3 rounded-2xl flex items-center justify-between border transition-all ${
                  isSelected
                    ? 'bg-[#DC2626]/20 border-[#DC2626] text-[#E5A93C]'
                    : 'bg-neutral-900/60 border-neutral-800/80 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lang.flag}</span>
                  <div className="text-left">
                    <span className="text-xs font-bold block text-white">{lang.nativeName}</span>
                    <span className="text-[10px] text-neutral-400">{lang.name}</span>
                  </div>
                </div>

                {isSelected && (
                  <span className="w-6 h-6 rounded-full bg-gradient-to-r from-[#DC2626] to-[#EF4444] text-[#FDE047] flex items-center justify-center">
                    <Check size={14} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="p-3 bg-neutral-950 border-t border-neutral-800/60 text-center">
          <p className="text-[10px] text-neutral-500">
            Selected language applies instantly across all tabs and menus.
          </p>
        </div>
      </div>
    </div>
  );
};
