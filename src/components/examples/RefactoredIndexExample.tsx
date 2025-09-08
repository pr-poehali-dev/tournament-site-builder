import React, { useState, useRef, useCallback } from 'react';
import { useAppState } from '@/hooks/useAppState';

// Shared components
import { NavigationHeader } from '@/components/shared/NavigationHeader';
import { LoginForm } from '@/components/shared/LoginForm';

// Page components  
import { RatingPage } from '@/components/pages/RatingPage';
import { AdminPage } from '@/components/pages/AdminPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { TournamentsPage } from '@/components/pages/TournamentsPage';
import { MyTournamentsPage } from '@/components/pages/MyTournamentsPage';
import { PlayersPage } from '@/components/pages/PlayersPage';
import { CitiesPage } from '@/components/pages/CitiesPage';
import { FormatsPage } from '@/components/pages/FormatsPage';
import { CreateTournamentPage } from '@/components/pages/CreateTournamentPage';

// Example of what the fully refactored Index.tsx would look like
export const RefactoredIndexExample: React.FC = () => {
  // Use the extracted useAppState hook
  const {
    appState,
    navigateTo,
    logout,
    showLoginForm,
    hideLoginForm,
    setCurrentUser,
    // User management
    toggleUserStatus,
    deleteUser,
    addUser,
    updateUser,
    // Player management  
    addPlayer,
    deletePlayer,
    // City management
    addCity,
    deleteCity,
    updateCity,
    // Format management
    addTournamentFormat,
    deleteTournamentFormat,
    updateTournamentFormat,
    // Tournament management
    addTournament,
    updateTournament,
    confirmTournament
  } = useAppState();

  // Local form states (previously in the main component)
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [profileEdit, setProfileEdit] = useState({
    city: appState.currentUser?.city || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [newPlayer, setNewPlayer] = useState({ name: '', city: '' });
  const [editingCity, setEditingCity] = useState<{ id: string; name: string } | null>(null);
  const [editingFormat, setEditingFormat] = useState<{ id: string; name: string; coefficient: number } | null>(null);

  // Refs for form management
  const playerNameInputRef = useRef<HTMLInputElement>(null);
  const cityNameInputRef = useRef<HTMLInputElement>(null);
  const formatNameInputRef = useRef<HTMLInputElement>(null);
  const formatCoefficientInputRef = useRef<HTMLInputElement>(null);
  const tournamentNameInputRef = useRef<HTMLInputElement>(null);
  const tournamentDateInputRef = useRef<HTMLInputElement>(null);
  const tournamentCitySelectRef = useRef<HTMLSelectElement>(null);
  const tournamentFormatSelectRef = useRef<HTMLSelectElement>(null);
  const tournamentIsRatedInputRef = useRef<HTMLInputElement>(null);
  const tournamentSwissRoundsInputRef = useRef<HTMLInputElement>(null);
  const tournamentTopRoundsInputRef = useRef<HTMLInputElement>(null);

  // Login handlers
  const handleLoginUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const login = useCallback(() => {
    const user = appState.users.find(u => 
      u.username === loginForm.username && 
      u.password === loginForm.password &&
      u.isActive
    );
    
    if (user) {
      setCurrentUser(user);
      hideLoginForm();
      setLoginForm({ username: '', password: '' });
      setProfileEdit({
        city: user.city || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      alert('Неверный логин или пароль');
    }
  }, [loginForm, appState.users, setCurrentUser, hideLoginForm]);

  // Profile handlers
  const handleProfileCityChange = useCallback((value: string) => {
    setProfileEdit(prev => ({ ...prev, city: value }));
  }, []);

  const handleProfileCurrentPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, currentPassword: e.target.value }));
  }, []);

  const handleProfileNewPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, newPassword: e.target.value }));
  }, []);

  const handleProfileConfirmPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, confirmPassword: e.target.value }));
  }, []);

  const updateProfile = useCallback(() => {
    if (!appState.currentUser) return;
    
    if (profileEdit.newPassword && profileEdit.currentPassword !== appState.currentUser.password) {
      alert('Неверный текущий пароль');
      return;
    }
    
    if (profileEdit.newPassword && profileEdit.newPassword !== profileEdit.confirmPassword) {
      alert('Пароли не совпадают');
      return;
    }

    const updatedUser = {
      ...appState.currentUser,
      city: profileEdit.city,
      ...(profileEdit.newPassword && { password: profileEdit.newPassword })
    };

    updateUser(updatedUser);
    setProfileEdit(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    }));
    
    alert('Профиль обновлен!');
  }, [appState.currentUser, profileEdit, updateUser]);

  // Player handlers
  const handleNewPlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayer(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleNewPlayerCityChange = useCallback((value: string) => {
    setNewPlayer(prev => ({ ...prev, city: value }));
  }, []);

  const handlePlayerNameKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  }, []);

  const handleAddPlayer = useCallback(() => {
    if (!appState.currentUser || !['admin', 'judge'].includes(appState.currentUser.role)) {
      alert('У вас нет прав для добавления игроков');
      return;
    }
    if (!newPlayer.name.trim()) {
      alert('Введите имя игрока');
      return;
    }

    const player = {
      id: Date.now().toString(),
      name: newPlayer.name.trim(),
      city: newPlayer.city?.trim() || undefined,
      rating: 1200,
      tournaments: 0,
      wins: 0,
      losses: 0,
      draws: 0
    };

    addPlayer(player);
    setNewPlayer({ name: '', city: '' });
    setTimeout(() => playerNameInputRef.current?.focus(), 0);
  }, [appState.currentUser, newPlayer, addPlayer]);

  // City handlers (simplified for brevity - would include all handlers from original)
  const handleAddCity = useCallback(() => {
    const inputValue = cityNameInputRef.current?.value?.trim() || '';
    if (!inputValue) return;
    
    addCity({ id: Date.now().toString(), name: inputValue });
    if (cityNameInputRef.current) cityNameInputRef.current.value = '';
  }, [addCity]);

  // Tournament handlers (simplified)
  const createTournament = useCallback(() => {
    navigateTo('create-tournament');
  }, [navigateTo]);

  const startEditTournament = useCallback((tournament: any) => {
    // Would set editing tournament state and navigate
    navigateTo('tournamentEdit');
  }, [navigateTo]);

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
        {/* Use extracted NavigationHeader */}
        <NavigationHeader
          appState={appState}
          navigateTo={navigateTo}
          logout={logout}
          showLoginForm={showLoginForm}
        />
        
        {/* Route to appropriate page component */}
        {appState.currentPage === 'rating' && (
          <RatingPage appState={appState} />
        )}
        
        {appState.currentPage === 'admin' && (
          <AdminPage
            appState={appState}
            toggleUserStatus={toggleUserStatus}
            deleteUser={deleteUser}
            addUser={addUser}
            addPlayer={addPlayer}
          />
        )}
        
        {appState.currentPage === 'profile' && (
          <ProfilePage
            appState={appState}
            profileEdit={profileEdit}
            handleProfileCityChange={handleProfileCityChange}
            handleProfileCurrentPasswordChange={handleProfileCurrentPasswordChange}
            handleProfileNewPasswordChange={handleProfileNewPasswordChange}
            handleProfileConfirmPasswordChange={handleProfileConfirmPasswordChange}
            updateProfile={updateProfile}
          />
        )}
        
        {appState.currentPage === 'tournaments' && (
          <TournamentsPage
            appState={appState}
            createTournament={createTournament}
            startEditTournament={startEditTournament}
            confirmTournament={confirmTournament}
          />
        )}
        
        {appState.currentPage === 'my-tournaments' && (
          <MyTournamentsPage
            appState={appState}
            navigateTo={navigateTo}
          />
        )}
        
        {appState.currentPage === 'players' && (
          <PlayersPage
            appState={appState}
            newPlayer={newPlayer}
            addPlayer={handleAddPlayer}
            deletePlayer={deletePlayer}
            handleNewPlayerNameChange={handleNewPlayerNameChange}
            handleNewPlayerCityChange={handleNewPlayerCityChange}
            handlePlayerNameKeyPress={handlePlayerNameKeyPress}
            playerNameInputRef={playerNameInputRef}
          />
        )}
        
        {appState.currentPage === 'cities' && (
          <CitiesPage
            appState={appState}
            editingCity={editingCity}
            addCity={handleAddCity}
            startEditCity={setEditingCity}
            deleteCity={deleteCity}
            handleEditCityNameChange={(e) => setEditingCity(prev => prev ? {...prev, name: e.target.value} : null)}
            handleEditCityKeyPress={(e) => {}}
            saveEditCity={() => {}}
            cancelEditCity={() => setEditingCity(null)}
            cityNameInputRef={cityNameInputRef}
          />
        )}
        
        {appState.currentPage === 'formats' && (
          <FormatsPage
            appState={appState}
            editingFormat={editingFormat}
            addFormat={() => {}}
            startEditFormat={setEditingFormat}
            deleteFormat={deleteTournamentFormat}
            handleEditFormatNameChange={(e) => setEditingFormat(prev => prev ? {...prev, name: e.target.value} : null)}
            handleEditFormatCoefficientChange={(e) => setEditingFormat(prev => prev ? {...prev, coefficient: parseInt(e.target.value) || 1} : null)}
            saveEditFormat={() => {}}
            cancelEditFormat={() => setEditingFormat(null)}
            formatNameInputRef={formatNameInputRef}
            formatCoefficientInputRef={formatCoefficientInputRef}
          />
        )}
        
        {appState.currentPage === 'create-tournament' && (
          <CreateTournamentPage
            appState={appState}
            navigateTo={navigateTo}
            addTournament={addTournament}
            tournamentNameInputRef={tournamentNameInputRef}
            tournamentDateInputRef={tournamentDateInputRef}
            tournamentCitySelectRef={tournamentCitySelectRef}
            tournamentFormatSelectRef={tournamentFormatSelectRef}
            tournamentIsRatedInputRef={tournamentIsRatedInputRef}
            tournamentSwissRoundsInputRef={tournamentSwissRoundsInputRef}
            tournamentTopRoundsInputRef={tournamentTopRoundsInputRef}
          />
        )}
      </div>
    </div>
  );
};