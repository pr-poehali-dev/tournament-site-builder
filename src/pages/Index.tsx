import React, { useState, useCallback, useRef, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

// Types
import type { AppState, Tournament, Page, Match, Round } from '@/types';

// Hook
import { useAppState } from '@/hooks/useAppState';

// Shared Components
import { NavigationHeader } from '@/components/shared/NavigationHeader';
import { LoginForm } from '@/components/shared/LoginForm';

// Page Components
import { RatingPage } from '@/components/pages/RatingPage';
import { AdminPage } from '@/components/pages/AdminPage';
import { ProfilePage } from '@/components/pages/ProfilePage';
import { TournamentsPage } from '@/components/pages/TournamentsPage';
import { MyTournamentsPage } from '@/components/pages/MyTournamentsPage';
import { PlayersPage } from '@/components/pages/PlayersPage';
import { CitiesPage } from '@/components/pages/CitiesPage';
import { FormatsPage } from '@/components/pages/FormatsPage';
import { CreateTournamentPage } from '@/components/pages/CreateTournamentPage';

const Index = () => {
  // Get all state and handlers from custom hook
  const {
    appState,
    navigateTo,
    logout,
    showLoginForm,
    hideLoginForm,
    addUser,
    deleteUser,
    toggleUserStatus,
    addPlayer,
    deletePlayer,
    updatePlayer,
    addCity,
    deleteCity,
    updateCity,
    addTournamentFormat,
    deleteTournamentFormat,
    updateTournamentFormat,
    addTournament,
    deleteTournament,
    updateTournament,
    addTournamentRound,
    updateMatchResult,
    deleteLastRound,
    finishTournament,
    confirmTournamentWithPlayerUpdates,
    generatePairings
  } = useAppState();

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });

  // Profile editing state
  const [profileEdit, setProfileEdit] = useState({
    isEditing: false,
    name: '',
    password: '',
    city: ''
  });

  // Player form states
  const [newPlayer, setNewPlayer] = useState({ name: '', city: '' });
  const playerNameInputRef = useRef<HTMLInputElement>(null);

  // City form states
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState('');
  const [newCityName, setNewCityName] = useState('');
  const cityNameInputRef = useRef<HTMLInputElement>(null);

  // Format form states
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [editingFormat, setEditingFormat] = useState({ name: '', coefficient: 1 });
  const [newFormat, setNewFormat] = useState({ name: '', coefficient: 1 });
  const formatNameInputRef = useRef<HTMLInputElement>(null);

  // Tournament creation form states and refs
  const [tournamentForm, setTournamentForm] = useState({
    name: '',
    date: '',
    city: 'ryazan',
    format: 'sealed',
    description: '',
    isRated: true,
    swissRounds: 3,
    topRounds: 1,
    participants: [] as string[]
  });
  
  // Tournament refs removed - now using controlled components

  // Tournament editing state
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(null);
  const [matchResults, setMatchResults] = useState<{[matchId: string]: string}>({});

  // Login handlers
  const handleLoginUsernameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, username: e.target.value }));
  }, []);

  const handleLoginPasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const login = useCallback(() => {
    const user = appState.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user && user.isActive) {
      // Set current user through the hook's login mechanism
      appState.currentUser = user;
      hideLoginForm();
      setLoginForm({ username: '', password: '' });
    } else {
      alert('Неверные учетные данные или пользователь заблокирован');
    }
  }, [appState.users, loginForm, hideLoginForm]);

  // Profile handlers
  const startEditProfile = useCallback(() => {
    if (appState.currentUser) {
      setProfileEdit({
        isEditing: true,
        name: appState.currentUser.name,
        password: '',
        city: appState.currentUser.city || ''
      });
    }
  }, [appState.currentUser]);

  const handleProfileNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleProfilePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProfileEdit(prev => ({ ...prev, password: e.target.value }));
  }, []);

  const handleProfileCityChange = useCallback((value: string) => {
    setProfileEdit(prev => ({ ...prev, city: value }));
  }, []);

  const saveProfile = useCallback(() => {
    if (!appState.currentUser) return;
    
    // Update user through the hook's mechanism
    const updatedUser = {
      ...appState.currentUser,
      name: profileEdit.name,
      city: profileEdit.city,
      ...(profileEdit.password && { password: profileEdit.password })
    };
    
    // Update the user in state
    const userIndex = appState.users.findIndex(u => u.id === appState.currentUser!.id);
    if (userIndex !== -1) {
      appState.users[userIndex] = updatedUser;
      appState.currentUser = updatedUser;
    }
    
    setProfileEdit(prev => ({ ...prev, isEditing: false }));
  }, [appState.currentUser, appState.users, profileEdit]);

  const cancelEditProfile = useCallback(() => {
    setProfileEdit(prev => ({ ...prev, isEditing: false }));
  }, []);

  // Player management handlers
  const handleNewPlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPlayer(prev => ({ ...prev, name: e.target.value }));
  }, []);

  const handleNewPlayerCityChange = useCallback((value: string) => {
    setNewPlayer(prev => ({ ...prev, city: value }));
  }, []);

  const handlePlayerNameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddPlayer();
    }
  }, []);

  const handleAddPlayer = useCallback(() => {
    if (newPlayer.name.trim()) {
      const newPlayerData = {
        id: `player${Date.now()}`,
        name: newPlayer.name.trim(),
        city: newPlayer.city,
        rating: 1200,
        tournaments: 0,
        wins: 0,
        losses: 0,
        draws: 0
      };
      
      addPlayer(newPlayerData);
      setNewPlayer({ name: '', city: '' });
      
      setTimeout(() => {
        playerNameInputRef.current?.focus();
      }, 0);
    }
  }, [newPlayer, addPlayer]);

  // City management handlers
  const startEditCity = useCallback((city: any) => {
    setEditingCityId(city.id);
    setEditingCityName(city.name);
  }, []);

  const handleEditCityNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditingCityName(e.target.value);
  }, []);

  const handleNewCityNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewCityName(e.target.value);
  }, []);

  const handleCityNameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddCity();
    }
  }, []);

  const handleAddCity = useCallback(() => {
    if (newCityName.trim()) {
      addCity({
        id: `city${Date.now()}`,
        name: newCityName.trim()
      });
      setNewCityName('');
      setTimeout(() => {
        cityNameInputRef.current?.focus();
      }, 0);
    }
  }, [newCityName, addCity]);

  const saveEditCity = useCallback(() => {
    if (editingCityId && editingCityName.trim()) {
      updateCity(editingCityId, { name: editingCityName.trim() });
      setEditingCityId(null);
      setEditingCityName('');
    }
  }, [editingCityId, editingCityName, updateCity]);

  const cancelEditCity = useCallback(() => {
    setEditingCityId(null);
    setEditingCityName('');
  }, []);

  // Tournament management handlers

  const startEditTournament = useCallback((tournament: Tournament) => {
    setEditingTournament(tournament);
    navigateTo('tournamentEdit');
  }, [navigateTo]);

  const goToCreateTournament = useCallback(() => {
    navigateTo('create-tournament');
  }, [navigateTo]);

  // Tournament Edit Page Component (kept inline due to complexity)
  const TournamentEditPage = () => {
    if (!editingTournament) return null;

    const tournament = appState.tournaments.find(t => t.id === editingTournament.id) || editingTournament;
    const totalRounds = tournament.swissRounds + tournament.topRounds;

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Trophy" size={20} />
              {tournament.name}
            </CardTitle>
            <CardDescription>
              {tournament.date} • {tournament.city} • {tournament.format}
            </CardDescription>
          </CardHeader>
        </Card>

        {tournament.rounds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Туры турнира</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.rounds.map((round) => (
                <div key={round.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Тур {round.number}</h3>
                    <Badge variant={round.isCompleted ? "default" : "secondary"}>
                      {round.isCompleted ? 'Завершён' : 'В процессе'}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {round.matches.map((match) => {
                      const player1 = appState.users.find(u => u.id === match.player1Id);
                      const player2 = match.player2Id ? appState.users.find(u => u.id === match.player2Id) : null;
                      
                      return (
                        <div key={match.id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-4">
                            <div className="font-medium">Стол {match.tableNumber || 'БАЙ'}</div>
                            <div className="flex items-center gap-2">
                              <span>{player1?.name || 'Неизвестный игрок'}</span>
                              <span className="text-gray-500">vs</span>
                              <span>{player2?.name || 'БАЙ'}</span>
                            </div>
                          </div>
                          
                          {match.result ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {match.result === 'win1' && (player1?.name || 'Игрок 1')}
                                {match.result === 'win2' && (player2?.name || 'Игрок 2')}
                                {match.result === 'draw' && 'Ничья'}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {match.points1}:{match.points2}
                              </span>
                            </div>
                          ) : (
                            !match.player2Id ? (
                              <Badge variant="secondary">БАЙ</Badge>
                            ) : (
                              <Badge variant="outline">Ожидает результата</Badge>
                            )
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tournament Management Controls */}
        {(appState.currentUser?.role === 'admin' || appState.currentUser?.role === 'judge') && (
          <Card>
            <CardHeader>
              <CardTitle>Управление турниром</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {tournament.currentRound < totalRounds && tournament.status === 'active' && (
                  <Button 
                    onClick={() => {
                      const pairings = generatePairings(tournament.id);
                      if (pairings.success) {
                        addTournamentRound(tournament.id, pairings.matches);
                      } else {
                        alert(pairings.error);
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <Icon name="Plus" size={16} />
                    Создать {tournament.currentRound + 1} тур
                  </Button>
                )}
                
                {tournament.rounds.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex items-center gap-2">
                        <Icon name="Trash2" size={16} />
                        Удалить последний тур
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Подтвердите действие</AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите удалить последний тур? Все результаты тура будут потеряны.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteLastRound(tournament.id)}>
                          Удалить тур
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {tournament.currentRound === totalRounds && 
                 tournament.rounds.length > 0 && 
                 tournament.rounds[tournament.rounds.length - 1]?.isCompleted && 
                 tournament.status === 'active' && (
                  <Button
                    onClick={() => finishTournament(tournament.id)}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <Icon name="Flag" size={16} />
                    Завершить турнир
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tournament Table */}
        <Card>
          <CardHeader>
            <CardTitle>Турнирная таблица</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Место</th>
                    <th className="text-left p-2 font-medium">Игрок</th>
                    <th className="text-left p-2 font-medium">Очки</th>
                    <th className="text-left p-2 font-medium">Коэффициент Бухгольца</th>
                    <th className="text-left p-2 font-medium">П-Н-П</th>
                  </tr>
                </thead>
                <tbody>
                  {tournament.participants
                    .map(participantId => {
                      const user = appState.users.find(u => u.id === participantId);
                      if (!user) return null;

                      let points = 0;
                      let wins = 0;
                      let losses = 0;
                      let draws = 0;
                      let opponentIds: string[] = [];

                      tournament.rounds.forEach(round => {
                        const match = round.matches.find(m => 
                          m.player1Id === participantId || m.player2Id === participantId
                        );
                        if (match) {
                          if (!match.player2Id) {
                            points += 3;
                            wins += 1;
                          } else if (match.result) {
                            const isPlayer1 = match.player1Id === participantId;
                            const opponentId = isPlayer1 ? match.player2Id : match.player1Id;
                            opponentIds.push(opponentId);

                            if (match.result === 'draw') {
                              points += 1;
                              draws += 1;
                            } else if (
                              (match.result === 'win1' && isPlayer1) ||
                              (match.result === 'win2' && !isPlayer1)
                            ) {
                              points += 3;
                              wins += 1;
                            } else {
                              losses += 1;
                            }
                          }
                        }
                      });

                      const buchholz = opponentIds.reduce((acc, opponentId) => {
                        let opponentPoints = 0;
                        tournament.rounds.forEach(round => {
                          const opponentMatch = round.matches.find(m => 
                            m.player1Id === opponentId || m.player2Id === opponentId
                          );
                          if (opponentMatch) {
                            if (!opponentMatch.player2Id) {
                              opponentPoints += 3;
                            } else if (opponentMatch.result) {
                              const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                              if (opponentMatch.result === 'draw') {
                                opponentPoints += 1;
                              } else if (
                                (opponentMatch.result === 'win1' && isOpponentPlayer1) ||
                                (opponentMatch.result === 'win2' && !isOpponentPlayer1)
                              ) {
                                opponentPoints += 3;
                              }
                            }
                          }
                        });
                        return acc + opponentPoints;
                      }, 0);

                      return {
                        user,
                        points,
                        buchholz,
                        wins,
                        losses,
                        draws
                      };
                    })
                    .filter(Boolean)
                    .sort((a, b) => {
                      if (b!.points !== a!.points) return b!.points - a!.points;
                      return b!.buchholz - a!.buchholz;
                    })
                    .map((participant, index) => (
                      <tr key={participant!.user.id} className="border-b hover:bg-gray-50">
                        <td className="p-2">
                          <Badge variant="outline">{index + 1}</Badge>
                        </td>
                        <td className="p-2 font-medium">{participant!.user.name}</td>
                        <td className="p-2">{participant!.points}</td>
                        <td className="p-2">{participant!.buchholz}</td>
                        <td className="p-2 text-sm text-gray-600">
                          {participant!.wins}-{participant!.draws}-{participant!.losses}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Show login form if user is not authenticated
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

  // Main application render
  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationHeader
        appState={appState}
        navigateTo={navigateTo}
        logout={logout}
        showLoginForm={showLoginForm}
      />

      <main className="container mx-auto px-4 py-8">
        {appState.currentPage === 'rating' && <RatingPage appState={appState} />}
        
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
            startEditProfile={startEditProfile}
            handleProfileNameChange={handleProfileNameChange}
            handleProfilePasswordChange={handleProfilePasswordChange}
            handleProfileCityChange={handleProfileCityChange}
            saveProfile={saveProfile}
            cancelEditProfile={cancelEditProfile}
          />
        )}

        {appState.currentPage === 'tournaments' && (
          <TournamentsPage
            appState={appState}
            createTournament={goToCreateTournament}
            startEditTournament={startEditTournament}
            confirmTournament={confirmTournamentWithPlayerUpdates}
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
            editingCityId={editingCityId}
            editingCityName={editingCityName}
            newCityName={newCityName}
            startEditCity={startEditCity}
            handleEditCityNameChange={handleEditCityNameChange}
            handleNewCityNameChange={handleNewCityNameChange}
            handleCityNameKeyPress={handleCityNameKeyPress}
            handleAddCity={handleAddCity}
            saveEditCity={saveEditCity}
            cancelEditCity={cancelEditCity}
            deleteCity={deleteCity}
            cityNameInputRef={cityNameInputRef}
          />
        )}

        {appState.currentPage === 'formats' && (
          <FormatsPage
            appState={appState}
            editingFormatId={editingFormatId}
            editingFormat={editingFormat}
            newFormat={newFormat}
            setEditingFormatId={setEditingFormatId}
            setEditingFormat={setEditingFormat}
            setNewFormat={setNewFormat}
            addTournamentFormat={addTournamentFormat}
            updateTournamentFormat={updateTournamentFormat}
            deleteTournamentFormat={deleteTournamentFormat}
            formatNameInputRef={formatNameInputRef}
          />
        )}

        {appState.currentPage === 'create-tournament' && (
          <CreateTournamentPage
            appState={appState}
            tournamentForm={tournamentForm}
            setTournamentForm={setTournamentForm}
            navigateTo={navigateTo}
            addTournament={addTournament}
          />
        )}

        {appState.currentPage === 'tournamentEdit' && <TournamentEditPage />}
      </main>
    </div>
  );
};

export default Index;