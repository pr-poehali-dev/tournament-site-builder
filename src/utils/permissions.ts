import type { User, Tournament } from '@/types';

/**
 * Проверяет, может ли пользователь управлять турниром
 * @param user Текущий пользователь
 * @param tournament Турнир для проверки
 * @returns true, если пользователь может управлять турниром
 */
export function canManageTournament(user: User | null, tournament: Tournament): boolean {
  if (!user) return false;
  
  // Администраторы могут управлять всеми турнирами
  if (user.role === 'admin') return true;
  
  // Судья турнира может управлять своим турниром
  if (user.role === 'judge' && tournament.judgeId === user.id) return true;
  
  return false;
}

/**
 * Проверяет, может ли пользователь просматривать турнир
 * @param user Текущий пользователь
 * @param tournament Турнир для проверки
 * @returns true, если пользователь может просматривать турнир
 */
export function canViewTournament(user: User | null, tournament: Tournament): boolean {
  // Все могут просматривать турниры
  return true;
}

/**
 * Проверяет, может ли пользователь создавать турниры
 * @param user Текущий пользователь
 * @returns true, если пользователь может создавать турниры
 */
export function canCreateTournament(user: User | null): boolean {
  if (!user) return false;
  
  // Судьи и администраторы могут создавать турниры
  return user.role === 'judge' || user.role === 'admin';
}