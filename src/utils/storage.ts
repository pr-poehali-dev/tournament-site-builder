import { UIState } from '@/types';

export const saveUIStateToLocalStorage = (uiState: UIState) => {
  try {
    localStorage.setItem('tournamentUIState', JSON.stringify(uiState));
  } catch (error) {
    console.error('Failed to save UI state to localStorage:', error);
  }
};

export const loadUIStateFromLocalStorage = (): UIState | null => {
  try {
    const savedState = localStorage.getItem('tournamentUIState');
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (error) {
    console.error('Failed to load UI state from localStorage:', error);
  }
  return null;
};

export const clearOldLocalStorage = () => {
  try {
    localStorage.removeItem('tournamentAppState');
  } catch (error) {
    console.error('Failed to clear old localStorage:', error);
  }
};