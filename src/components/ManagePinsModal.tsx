import React, { useState } from 'react';
import { 
  X, 
  KeyRound, 
  ShieldCheck, 
  Check, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  AlertCircle 
} from 'lucide-react';
import { AppUser } from '../types';
import { DEFAULT_USERS, getStoredUsers, saveStoredUsers } from '../utils/auth';

interface ManagePinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser;
  onUsersUpdated: (users: AppUser[]) => void;
}

export const ManagePinsModal: React.FC<ManagePinsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onUsersUpdated,
}) => {
  const [users, setUsers] = useState<AppUser[]>(() => getStoredUsers());
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // Strict security guard: only Admin can view and manage team PINs
  if (currentUser.role !== 'admin') {
    return null;
  }

  const handlePinChange = (userId: string, newPin: string) => {
    // Only numeric up to 6 digits
    const sanitized = newPin.replace(/\D/g, '').slice(0, 6);
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, pin: sanitized } : u))
    );
    setErrorMsg(null);
  };

  const handleNameChange = (userId: string, newName: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, name: newName } : u))
    );
  };

  const toggleShowPin = (userId: string) => {
    setShowPins((prev) => ({ ...prev, [userId]: !prev[userId] }));
  };

  const handleSave = () => {
    // Validate each pin has at least 4 digits
    for (const u of users) {
      if (u.pin.length < 4) {
        setErrorMsg(`O PIN de "${u.name}" deve conter no mínimo 4 dígitos numéricos.`);
        return;
      }
    }

    saveStoredUsers(users);
    onUsersUpdated(users);
    setSuccessMsg('✓ PINs e permissões atualizados com sucesso!');
    setTimeout(() => {
      setSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const handleRestoreDefaults = () => {
    if (confirm('Deseja restaurar todos os PINs para os padrões de fábrica (2026, 1010, 0000)?')) {
      setUsers(DEFAULT_USERS);
      saveStoredUsers(DEFAULT_USERS);
      onUsersUpdated(DEFAULT_USERS);
      setSuccessMsg('PINs restaurados para os padrões originais!');
      setTimeout(() => setSuccessMsg(null), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-scaleIn">
        {/* Top Rainbow Line */}
        <div className="h-1.5 w-full flex">
          <div className="flex-1 bg-[#F9E547]" />
          <div className="flex-1 bg-[#8EDD65]" />
          <div className="flex-1 bg-[#EF426F]" />
          <div className="flex-1 bg-[#05C3DE]" />
          <div className="flex-1 bg-[#FF6A39]" />
        </div>

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#253746] text-[#F9E547] rounded-xl shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#253746]">
                Gerenciamento de Acesso &amp; PINs
              </h3>
              <p className="text-xs text-slate-500">
                Configure os códigos de acesso e os nomes da equipe da Grudado em Você
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="space-y-4">
            {users.map((user) => {
              const isVisible = showPins[user.id] || false;

              return (
                <div
                  key={user.id}
                  className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-extrabold text-white text-xs shrink-0 shadow-xs"
                      style={{ backgroundColor: user.color || '#253746' }}
                    >
                      {user.avatarText}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={user.name}
                          onChange={(e) => handleNameChange(user.id, e.target.value)}
                          className="font-bold text-[#253746] text-sm bg-transparent border-b border-transparent hover:border-slate-300 focus:border-[#05C3DE] outline-none px-1"
                        />
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 px-1">
                        {user.description}
                      </p>
                    </div>
                  </div>

                  {/* PIN Input & Visibility */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <div className="flex flex-col items-end">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Código PIN (4 a 6 dígitos)
                      </label>
                      <div className="relative">
                        <input
                          type={isVisible ? 'text' : 'password'}
                          value={user.pin}
                          maxLength={6}
                          onChange={(e) => handlePinChange(user.id, e.target.value)}
                          className="w-28 text-center font-mono font-black text-base px-3 py-1.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#05C3DE]/30 focus:border-[#05C3DE] outline-none tracking-widest text-[#253746]"
                        />
                        <button
                          type="button"
                          onClick={() => toggleShowPin(user.id)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5"
                          title={isVisible ? 'Ocultar' : 'Ver PIN'}
                        >
                          {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Restrições de cada perfil:
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900/80">
              <li><strong>Administrador:</strong> Pode fazer tudo, inclusive excluir solicitações e alterar configurações do Google Sheets.</li>
              <li><strong>Operador:</strong> Pode adicionar chamados, atualizar tratativas e gerar cobranças. Bloqueado para exclusão e alteração de planilhas.</li>
              <li><strong>Visualizador:</strong> Modo leitura estrito para consulta de valores, gráficos e exportação.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleRestoreDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restaurar Padrões Originais</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-[#253746] hover:bg-[#1a2833] text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 text-[#8EDD65]" />
              <span>Salvar Alterações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
