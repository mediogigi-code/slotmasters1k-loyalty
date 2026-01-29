import { type ClassValue, clsx } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Formatear puntos con separadores de miles
export function formatPoints(points: number): string {
  return new Intl.NumberFormat('es-ES').format(points);
}

// Formatear euros
export function formatEuro(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(amount);
}

// Validar dirección de wallet (básico)
export function isValidWalletAddress(address: string): boolean {
  // TRC20/ERC20 addresses start with 0x or T and are 42/34 chars
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  const tronRegex = /^T[a-zA-Z0-9]{33}$/;
  
  return ethRegex.test(address) || tronRegex.test(address);
}

// Obtener número de semana
export function getCurrentWeek(): { week: number; year: number } {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const week = Math.ceil(diff / oneWeek);
  
  return {
    week,
    year: now.getFullYear()
  };
}

// Calcular tiempo restante hasta el lunes
export function getTimeUntilMonday(): string {
  const now = new Date();
  const nextMonday = new Date(now);
  
  // Encontrar el próximo lunes
  nextMonday.setDate(now.getDate() + ((8 - now.getDay()) % 7));
  nextMonday.setHours(0, 0, 0, 0);
  
  const diff = nextMonday.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  }
  return `${hours}h`;
}

// Copiar al portapapeles
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    return false;
  }
}

// Truncar texto
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

// Generar color aleatorio para avatares
export function generateAvatarColor(username: string): string {
  const colors = [
    'bg-blue-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-red-500',
    'bg-indigo-500',
  ];
  
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
