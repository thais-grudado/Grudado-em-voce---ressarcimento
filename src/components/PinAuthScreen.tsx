import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Sparkles,
  HelpCircle,
  Delete
} from 'lucide-react';
import { AppUser } from '../types';
import { getStoredUsers, getRolePermissions } from '../utils/auth';
import { GrudadoLogo } from './GrudadoLogo';

interface PinAuthScreenProps {
  onLoginSuccess: (user: AppUser) => void;
}

export const PinAuthScreen: React.FC<PinAuthScreenProps> = ({ onLoginSuccess }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [showPin, setShowPin] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showDefaultPinsHelp, setShowDefaultPinsHelp] = useState<boolean>(false);

  useEffect(() => {
    const loadedUsers = getStoredUsers();
    setUsers(loadedUsers);
    if (loadedUsers.length > 0) {
      // Default select admin for quickest onboarding
      setSelectedUser(loadedUsers[0]);
    }
  }, []);

  const handleSelectUser = (user: AppUser) => {
    setSelectedUser(user);
    setPin('');
    setError(null);
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(null);
      if (selectedUser && nextPin.length === selectedUser.pin.length) {
        verifyPin(nextPin, selectedUser);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(null);
  };

  const handleClear = () => {
    setPin('');
    setError(null);
  };

  const verifyPin = (pinToTest: string, user: AppUser) => {
    setIsSubmitting(true);
    setTimeout(() => {
      if (pinToTest.trim() === user.pin.trim()) {
        setError(null);
        onLoginSuccess(user);
      } else {
        setError('PIN incorreto. Verifique o código e tente novamente.');
        setPin('');
      }
      setIsSubmitting(false);
    }, 200);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedUser) {
      setError('Selecione um perfil de acesso.');
      return;
    }
    if (!pin) {
      setError('Digite o PIN de 4 dígitos para continuar.');
      return;
    }
    verifyPin(pin, selectedUser);
  };

  // Keyboard support for typing PIN
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedUser) return;
      if (/^[0-9]$/.test(e.key)) {
        handleKeypadPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmit();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedUser, pin]);

  return (
    <div className="min-h-screen w-full bg-[#253746] flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden select-none font-sans">
      {/* Grudado em Você Brand Top Rainbow Line */}
      <div className="absolute top-0 left-0 right-0 h-1.5 flex z-10">
        <div className="flex-1 bg-[#F9E547]" />
        <div className="flex-1 bg-[#8EDD65]" />
        <div className="flex-1 bg-[#EF426F]" />
        <div className="flex-1 bg-[#05C3DE]" />
        <div className="flex-1 bg-[#FF6A39]" />
      </div>

      {/* Ambient background decoration */}
      <div className="absolute -right-40 -top-40 w-96 h-96 rounded-full bg-[#05C3DE]/10 blur-3xl pointer-events-none" />
      <div className="absolute -left-40 -bottom-40 w-96 h-96 rounded-full bg-[#8EDD65]/10 blur-3xl pointer-events-none" />

      {/* Top Bar with brand logo */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between z-10 py-2">
        <div className="flex items-center gap-3">
          <GrudadoLogo variant="horizontal" size="md" textColor="white" />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDefaultPinsHelp(!showDefaultPinsHelp)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-xs transition cursor-pointer border border-white/10"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#F9E547]" />
            <span>PINs Padrão</span>
          </button>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-4xl mx-auto my-auto py-6 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          
          {/* Left Column: Select Profile & Role info */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#253746]/10 text-[#253746] text-xs font-bold mb-3">
                <ShieldCheck className="w-3.5 h-3.5 text-[#05C3DE]" />
                <span>Autenticação Segura &amp; Controle de Acesso</span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-[#253746] tracking-tight mb-2">
                Quem está acessando?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 mb-6">
                Selecione seu perfil profissional para desbloquear as permissões do painel.
              </p>

              {/* Profiles List */}
              <div className="space-y-3">
                {users.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const perms = getRolePermissions(user.role);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left p-3.5 rounded-2xl border-2 transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? 'bg-white border-[#05C3DE] shadow-md ring-2 ring-[#05C3DE]/20 scale-[1.01]'
                          : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-sm shrink-0 shadow-xs"
                          style={{ backgroundColor: user.color || '#253746' }}
                        >
                          {user.avatarText || 'GV'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#253746] text-sm sm:text-base">
                              {user.name}
                            </span>
                            {user.role === 'admin' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#253746] text-[#F9E547] text-[10px] font-extrabold uppercase">
                                Admin
                              </span>
                            )}
                            {user.role === 'operator' && (
                              <span className="px-2 py-0.5 rounded-full bg-[#05C3DE]/20 text-[#05C3DE] text-[10px] font-extrabold uppercase">
                                Operador
                              </span>
                            )}
                            {user.role === 'viewer' && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
                                Leitura
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                            {user.description}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 ml-2">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-[#05C3DE] bg-[#05C3DE] text-white'
                              : 'border-slate-300 bg-transparent'
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-white stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role Permissions summary card */}
            {selectedUser && (
              <div className="mt-6 p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 shadow-2xs">
                <div className="flex items-center justify-between font-bold text-[#253746] mb-2 pb-1 border-b border-slate-100">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#05C3DE]" />
                    Nível de Permissão: {selectedUser.roleLabel}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <span className={getRolePermissions(selectedUser.role).canCreateClaim ? 'text-emerald-700 font-semibold' : 'text-slate-400 line-through'}>
                    ✓ Criar Ocorrências
                  </span>
                  <span className={getRolePermissions(selectedUser.role).canEditClaim ? 'text-emerald-700 font-semibold' : 'text-slate-400 line-through'}>
                    ✓ Editar Tratativas
                  </span>
                  <span className={getRolePermissions(selectedUser.role).canChangeStatus ? 'text-emerald-700 font-semibold' : 'text-slate-400 line-through'}>
                    ✓ Baixa / Marcar Pago
                  </span>
                  <span className={getRolePermissions(selectedUser.role).canDeleteClaim ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                    {getRolePermissions(selectedUser.role).canDeleteClaim ? '✓ Excluir Registros' : '✗ Sem Exclusão'}
                  </span>
                  <span className={getRolePermissions(selectedUser.role).canConfigureSheets ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                    {getRolePermissions(selectedUser.role).canConfigureSheets ? '✓ Configurar Planilha' : '✗ Bloqueio Planilha'}
                  </span>
                  <span className="text-emerald-700 font-semibold">
                    ✓ Exportar Relatórios
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: PIN Pad & Keypad */}
          <div className="lg:col-span-6 p-6 sm:p-8 bg-white flex flex-col justify-between items-center">
            <div className="w-full max-w-xs text-center">
              <div className="inline-flex p-3 rounded-2xl bg-[#05C3DE]/10 text-[#05C3DE] mb-3">
                <KeyRound className="w-6 h-6" />
              </div>

              <h3 className="text-lg sm:text-xl font-black text-[#253746] mb-1">
                Digite o PIN de Acesso
              </h3>
              <p className="text-xs text-slate-500 mb-5">
                {selectedUser ? (
                  <>Autenticando para: <strong className="text-[#253746]">{selectedUser.name}</strong></>
                ) : (
                  'Selecione um perfil primeiro'
                )}
              </p>

              {/* PIN Digits Display */}
              <div className="relative mb-6">
                <div className="flex items-center justify-center gap-3">
                  {[0, 1, 2, 3].map((index) => {
                    const isFilled = pin.length > index;
                    const char = pin[index];
                    return (
                      <div
                        key={index}
                        className={`w-12 h-14 rounded-2xl border-2 flex items-center justify-center text-xl font-black transition-all ${
                          isFilled
                            ? 'border-[#05C3DE] bg-[#05C3DE]/10 text-[#253746] shadow-xs'
                            : 'border-slate-200 bg-slate-50 text-slate-400'
                        }`}
                      >
                        {isFilled ? (showPin ? char : '●') : ''}
                      </div>
                    );
                  })}
                </div>

                {/* Show / Hide PIN Toggle */}
                {pin.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute -right-8 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 text-xs cursor-pointer"
                    title={showPin ? 'Ocultar PIN' : 'Ver PIN'}
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-semibold flex items-center gap-2 animate-shake">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              {/* Numerical Keypad for touch/clicks */}
              <div className="grid grid-cols-3 gap-2.5 mb-5 w-full">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[#253746] font-bold text-lg rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleClear}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-500 font-bold text-xs rounded-2xl transition cursor-pointer flex items-center justify-center uppercase tracking-wider"
                >
                  Limpar
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[#253746] font-bold text-lg rounded-2xl transition cursor-pointer flex items-center justify-center shadow-2xs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 rounded-2xl transition cursor-pointer flex items-center justify-center"
                  title="Apagar último dígito"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={isSubmitting || pin.length < 4}
                className="w-full py-3.5 px-4 bg-[#05C3DE] hover:bg-[#04b0c7] active:bg-[#039eb3] disabled:opacity-50 disabled:pointer-events-none text-[#253746] font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>{isSubmitting ? 'Verificando...' : 'Desbloquear Painel'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Bottom reminder text */}
            <div className="mt-4 text-center">
              <p className="text-[11px] text-slate-400">
                Você também pode digitar o PIN diretamente no teclado numérico.
              </p>
            </div>
          </div>
        </div>

        {/* Default PINs Quick Reference Card */}
        {showDefaultPinsHelp && (
          <div className="mt-4 p-4 bg-white/95 rounded-2xl border border-white/20 shadow-xl backdrop-blur-md max-w-xl mx-auto animate-fadeIn text-[#253746]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#253746] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#05C3DE]" />
                PINs Padrão Configurados:
              </h4>
              <button
                type="button"
                onClick={() => setShowDefaultPinsHelp(false)}
                className="text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                Fechar ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#253746]">Administrador</div>
                <div className="text-[11px] text-slate-500">PIN: <span className="font-mono font-black text-[#253746] bg-[#F9E547]/30 px-1 rounded">2026</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#253746]">Operador SAC</div>
                <div className="text-[11px] text-slate-500">PIN: <span className="font-mono font-black text-[#253746] bg-[#05C3DE]/20 px-1 rounded">1010</span></div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-[#253746]">Visualizador</div>
                <div className="text-[11px] text-slate-500">PIN: <span className="font-mono font-black text-[#253746] bg-[#8EDD65]/30 px-1 rounded">0000</span></div>
              </div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2">
              * O administrador pode alterar estes códigos a qualquer momento no botão de perfil no topo do painel.
            </p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between text-[11px] text-slate-400 z-10 py-2 border-t border-white/10">
        <span>© {new Date().getFullYear()} Grudado em Você — Logística &amp; Ressarcimentos</span>
        <span className="hidden sm:inline">Protegido por Autenticação PIN Local</span>
      </div>
    </div>
  );
};
