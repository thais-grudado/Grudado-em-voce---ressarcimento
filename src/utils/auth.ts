import { AppUser, UserRole, UserPermissions } from '../types';

export const USERS_STORAGE_KEY = 'grudado_em_voce_users_v1';
export const AUTH_SESSION_KEY = 'grudado_em_voce_current_session_v1';

export const DEFAULT_USERS: AppUser[] = [
  {
    id: 'user-admin',
    name: 'Thaís (Administradora)',
    email: 'thais@grudadoemvoce.com.br',
    role: 'admin',
    pin: '2026',
    avatarText: 'TH',
    color: '#253746',
    roleLabel: 'Administrador (Acesso Total)',
    description: 'Acesso total irrestrito: gestão de status, exclusão de registros, configurações e integração com planilhas.',
  },
  {
    id: 'user-operator',
    name: 'Equipe SAC / Logística',
    role: 'operator',
    pin: '1010',
    avatarText: 'OP',
    color: '#05C3DE',
    roleLabel: 'Operador (Atendimento)',
    description: 'Cadastrar novos chamados, editar tratativas e gerar cobranças rápidas via WhatsApp. Restrição: não pode excluir nem alterar integrações.',
  },
  {
    id: 'user-viewer',
    name: 'Financeiro / Diretoria',
    role: 'viewer',
    pin: '0000',
    avatarText: 'FIN',
    color: '#8EDD65',
    roleLabel: 'Visualizador (Apenas Leitura)',
    description: 'Acesso exclusivo para consulta de métricas de ressarcimento, gráficos operacionais e exportação de dados em Excel/CSV.',
  },
];

export function getStoredUsers(): AppUser[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) return DEFAULT_USERS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Ensure all required fields exist
      return parsed.map((u) => {
        const def = DEFAULT_USERS.find((d) => d.id === u.id);
        return {
          ...def,
          ...u,
        };
      });
    }
    return DEFAULT_USERS;
  } catch {
    return DEFAULT_USERS;
  }
}

export function saveStoredUsers(users: AppUser[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Error saving users to localStorage:', e);
  }
}

export function getStoredSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(AUTH_SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    const users = getStoredUsers();
    // Re-verify against current users in case PIN or details changed
    const current = users.find((u) => u.id === session.id);
    return current || null;
  } catch {
    return null;
  }
}

export function setStoredSession(user: AppUser | null): void {
  try {
    if (user) {
      localStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_SESSION_KEY);
    }
  } catch (e) {
    console.error('Error setting auth session:', e);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(AUTH_SESSION_KEY);
  } catch (e) {
    console.error('Error clearing auth session:', e);
  }
}

export function getRolePermissions(role: UserRole): UserPermissions {
  switch (role) {
    case 'admin':
      return {
        canCreateClaim: true,
        canEditClaim: true,
        canDeleteClaim: true,
        canChangeStatus: true,
        canConfigureSheets: true,
        canExportData: true,
        canManagePins: true,
        canResetData: true,
      };
    case 'operator':
      return {
        canCreateClaim: true,
        canEditClaim: true,
        canDeleteClaim: false, // Restricted
        canChangeStatus: true,
        canConfigureSheets: false, // Restricted
        canExportData: true,
        canManagePins: false, // Restricted
        canResetData: false, // Restricted
      };
    case 'viewer':
    default:
      return {
        canCreateClaim: false, // Restricted
        canEditClaim: false, // Restricted
        canDeleteClaim: false, // Restricted
        canChangeStatus: false, // Restricted
        canConfigureSheets: false, // Restricted
        canExportData: true,
        canManagePins: false, // Restricted
        canResetData: false, // Restricted
      };
  }
}

export function verifyAdminPin(enteredPin: string): boolean {
  const users = getStoredUsers();
  const admin = users.find((u) => u.role === 'admin');
  return admin ? admin.pin.trim() === enteredPin.trim() : enteredPin.trim() === '2026';
}
