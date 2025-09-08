import { AppState } from '@/types';

export const saveStateToLocalStorage = (state: AppState) => {
  try {
    localStorage.setItem('tournamentAppState', JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
};

export const loadStateFromLocalStorage = (): AppState | null => {
  try {
    const savedState = localStorage.getItem('tournamentAppState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
  }
  return null;
};