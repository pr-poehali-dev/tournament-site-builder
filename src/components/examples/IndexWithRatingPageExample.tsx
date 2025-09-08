import React from 'react';
import { useAppState } from '@/hooks/useAppState';
import { RatingPage } from '@/components/pages/RatingPage';
// ... other page imports would go here

// Example showing how the main Index component would look with extracted RatingPage
export const IndexWithRatingPageExample: React.FC = () => {
  const { appState, navigateTo } = useAppState();

  // ... other component logic would be here (auth, forms, etc.)

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        
        {/* Navigation Header would be here */}
        <div className="mb-8 p-4 bg-card rounded-lg">
          <h1 className="text-2xl font-bold">Турнирная система</h1>
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => navigateTo('rating')}
              className="px-4 py-2 bg-primary text-primary-foreground rounded"
            >
              Рейтинг
            </button>
            <button 
              onClick={() => navigateTo('tournaments')}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded"
            >
              Турниры
            </button>
            {/* ... other navigation buttons */}
          </div>
        </div>

        {/* Page routing - before extraction this was all inline */}
        {appState.currentPage === 'rating' && <RatingPage appState={appState} />}
        {/* Other pages would be rendered here:
        {appState.currentPage === 'tournaments' && <TournamentsPage appState={appState} {...otherProps} />}
        {appState.currentPage === 'admin' && <AdminPage appState={appState} {...otherProps} />}
        {appState.currentPage === 'profile' && <ProfilePage appState={appState} {...otherProps} />}
        */}
        
        {/* Temporary demo - show current page */}
        {appState.currentPage !== 'rating' && (
          <div className="p-8 text-center bg-card rounded-lg">
            <p className="text-lg">Текущая страница: <strong>{appState.currentPage}</strong></p>
            <p className="text-sm text-muted-foreground mt-2">
              Остальные страницы будут извлечены аналогично RatingPage
            </p>
          </div>
        )}
      </div>
    </div>
  );
};