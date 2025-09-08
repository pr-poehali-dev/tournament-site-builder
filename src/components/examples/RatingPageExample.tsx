import React from 'react';
import { RatingPage } from '@/components/pages/RatingPage';
import { useAppState } from '@/hooks/useAppState';

// Example component showing how to use the extracted RatingPage component
export const RatingPageExample: React.FC = () => {
  const { appState } = useAppState();
  
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Пример использования RatingPage</h1>
        
        {/* Использование извлеченного компонента RatingPage */}
        <RatingPage appState={appState} />
        
        <div className="mt-6 p-4 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Информация о состоянии:</h3>
          <ul className="space-y-1 text-sm">
            <li>Игроков в системе: <strong>{appState.players.length}</strong></li>
            <li>Текущий пользователь: <strong>{appState.currentUser?.name || 'Не авторизован'}</strong></li>
            <li>Текущая страница: <strong>{appState.currentPage}</strong></li>
          </ul>
        </div>
      </div>
    </div>
  );
};