import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Check, Lock } from 'lucide-react';
import { verifyAdminPin } from '../utils/auth';

interface AdminAuthPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthorized: () => void;
  actionTitle?: string;
  actionDescription?: string;
}

export const AdminAuthPromptModal: React.FC<AdminAuthPromptModalProps> = ({
  isOpen,
  onClose,
  onAuthorized,
  actionTitle = 'Ação Restrita',
  actionDescription = 'Esta ação exige permissão de Administrador.',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPin(pin)) {
      onAuthorized();
      onClose();
    } else {
      setError('PIN de Administrador incorreto. Tente novamente.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
        {/* Top Warning Strip */}
        <div className="h-1.5 w-full bg-[#EF426F]" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-[#EF426F] rounded-xl">
                <ShieldAlert className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#253746]">{actionTitle}</h3>
                <p className="text-xs text-slate-500">{actionDescription}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#253746] mb-1">
                Digite o PIN de Administrador (Gestão):
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  maxLength={6}
                  autoFocus
                  placeholder="PIN..."
                  value={pin}
                  onChange={(e) => {
                    setPin(e.target.value.replace(/\D/g, ''));
                    setError(null);
                  }}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono font-black text-lg tracking-widest text-[#253746] focus:bg-white focus:ring-2 focus:ring-[#05C3DE] focus:border-[#05C3DE] outline-none"
                />
              </div>
              {error && (
                <p className="text-xs font-semibold text-rose-600 mt-1.5 flex items-center gap-1">
                  <span>●</span> {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={pin.length < 4}
                className="px-4 py-2 bg-[#253746] hover:bg-[#1a2833] disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5 text-[#8EDD65]" />
                <span>Autorizar Ação</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
