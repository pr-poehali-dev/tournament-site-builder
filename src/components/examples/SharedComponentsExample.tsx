import React, { useState, useCallback } from 'react';
import { useAppState } from '@/hooks/useAppState';
import { NavigationHeader } from '@/components/shared/NavigationHeader';
import { LoginForm } from '@/components/shared/LoginForm';
import { RatingPage } from '@/components/pages/RatingPage';

// Example showing how the extracted shared components would be used in the main app
export const SharedComponentsExample: React.FC = () => {
  const {
    appState,
    navigateTo,
    logout,
    showLoginForm,
    setCurrentUser,
    hideLoginForm
  } = useAppState();

  // Login form state (would be in the main component)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Login handlers (would be in the main component)
  const handleLoginUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const login = useCallback(() => {
    console.log('Login attempt with:', loginForm);
    console.log('Available users:', appState.users);
    
    const user = appState.users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password &&
      u.isActive
    );
    
    console.log('Found user:', user);
    
    if (user) {
      console.log('Login successful, updating state...');
      setCurrentUser(user);
      hideLoginForm();
      setLoginForm({ username: '', password: '' });
    } else {
      console.log('Login failed - user not found or inactive');
      alert('Неверный логин или пароль');
    }
  }, [loginForm, appState.users, setCurrentUser, hideLoginForm]);

  // Check if showing login screen
  if (appState.showLogin) {
    return (
      <LoginForm
        loginForm={loginForm}
        handleLoginUsernameChange={handleLoginUsernameChange}
        handleLoginPasswordChange={handleLoginPasswordChange}
        login={login}
      />
    );
  }

  // Main render with navigation
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Use the extracted NavigationHeader component */}
        <NavigationHeader
          appState={appState}
          navigateTo={navigateTo}
          logout={logout}
          showLoginForm={showLoginForm}
        />
        
        {/* Current page content */}
        <div className="space-y-6">
          <div className="p-6 bg-card rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Пример использования извлеченных компонентов</h2>
            <div className="space-y-2 text-sm">
              <p><strong>NavigationHeader:</strong> Извлечен из Index.tsx (79 строк)</p>
              <p><strong>LoginForm:</strong> Извлечен из Index.tsx (46 строк)</p>
              <p><strong>Текущая страница:</strong> {appState.currentPage}</p>
              <p><strong>Пользователь:</strong> {appState.currentUser?.name || 'Не авторизован'}</p>
            </div>
            
            <div className="mt-4 space-y-2">
              <h3 className="font-semibold">Тестирование навигации:</h3>
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={() => navigateTo('rating')}
                  className="px-3 py-1 bg-primary text-primary-foreground rounded text-sm"
                >
                  Рейтинг
                </button>
                <button 
                  onClick={() => navigateTo('tournaments')}
                  className="px-3 py-1 bg-secondary text-secondary-foreground rounded text-sm"
                >
                  Турниры
                </button>
                <button 
                  onClick={showLoginForm}
                  className="px-3 py-1 bg-accent text-accent-foreground rounded text-sm"
                >
                  Показать форму входа
                </button>
              </div>
            </div>
          </div>
          
          {/* Example of rendering a page component */}
          {appState.currentPage === 'rating' && <RatingPage appState={appState} />}
          
          {appState.currentPage !== 'rating' && (
            <div className="p-8 text-center bg-card rounded-lg border">
              <h3 className="text-lg font-semibold mb-2">Страница: {appState.currentPage}</h3>
              <p className="text-muted-foreground">
                Здесь бы отображался соответствующий компонент страницы
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};