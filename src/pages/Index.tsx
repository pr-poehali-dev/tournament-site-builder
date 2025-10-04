import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppState, Tournament, Page } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { NavigationHeader } from "@/components/shared/NavigationHeader";
import { LoginForm } from "@/components/shared/LoginForm";
import { RatingPage } from "@/components/pages/RatingPage";
import { CombinedAdminPage } from "@/components/pages/CombinedAdminPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { TournamentsPage } from "@/components/pages/TournamentsPage";
import { MyTournamentsPage } from "@/components/pages/MyTournamentsPage";
import { CitiesPage } from "@/components/pages/CitiesPage";
import { FormatsPage } from "@/components/pages/FormatsPage";
import { CreateTournamentPage } from "@/components/pages/CreateTournamentPage";
import { TournamentViewPage } from "@/components/pages/TournamentViewPage";
import { TournamentEditPage } from "@/components/pages/TournamentEditPage";
import { TournamentManagementPage } from "@/components/pages/TournamentManagementPage";
import BackendApiTest from "@/components/debug/BackendApiTest";

const Index = () => {
  const { tournamentId } = useParams<{ tournamentId: string }>();
  const navigate = useNavigate();
  const {
    appState,
    navigateTo: navigateToState,
    logout,
    showLoginForm,
    hideLoginForm,
    addUser,
    deleteUser,
    toggleUserStatus,
    updateUserRole,
    addPlayer,
    deletePlayer,
    updatePlayer,
    syncDbUsersToPlayers,
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
    togglePlayerDrop,
    updateRoundMatches,
    deleteLastRound,
    finishTournament,
    confirmTournament,
    confirmTournamentWithPlayerUpdates,
    resetToInitialState,
    generatePairings,
    loadTournamentWithGames,
  } = useAppState();

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  const [profileEdit, setProfileEdit] = useState({
    isEditing: false,
    name: "",
    password: "",
    city: "",
  });

  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState("");

  const navigateTo = useCallback((page: Page) => {
    if (typeof page === 'object' && page.page === 'tournament-view') {
      navigate(`/tournament/${page.tournamentId}`);
    } else if (page !== appState.currentPage) {
      navigate('/');
    }
    navigateToState(page);
  }, [navigate, navigateToState, appState.currentPage]);

  useEffect(() => {
    console.log('🔍 URL tournamentId:', tournamentId);
    console.log('🔍 Tournaments:', appState.tournaments.map(t => ({ id: t.id, name: t.name })));
    
    if (tournamentId && appState.tournaments.length > 0) {
      const tournament = appState.tournaments.find(t => t.id === tournamentId);
      console.log('🔍 Found tournament:', tournament);
      
      if (tournament) {
        if (typeof appState.currentPage !== 'object' || appState.currentPage.page !== 'tournament-view' || appState.currentPage.tournamentId !== tournamentId) {
          console.log('✅ Navigating to tournament view');
          navigateToState({ page: "tournament-view", tournamentId });
        }
      } else {
        console.log('❌ Tournament not found, redirecting to home');
        navigate('/');
        navigateToState("rating");
      }
    }
  }, [tournamentId, appState.tournaments, appState.currentPage, navigateToState, navigate]);
  const [newCityName, setNewCityName] = useState("");
  const cityNameInputRef = useRef<HTMLInputElement>(null);

  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [editingFormat, setEditingFormat] = useState({
    name: "",
    coefficient: 1,
  });
  const [newFormat, setNewFormat] = useState({ name: "", coefficient: 1 });
  const formatNameInputRef = useRef<HTMLInputElement>(null);

  const [isEditingPairings, setIsEditingPairings] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [tempMatches, setTempMatches] = useState<any[]>([]);

  const [tournamentForm, setTournamentForm] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    const userCity = appState.currentUser?.city || "";

    return {
      name: "",
      date: today,
      city: userCity,
      format: "sealed",
      description: "",
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: [] as string[],
      judgeId: "",
    };
  });

  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );
  const [matchResults, setMatchResults] = useState<{
    [matchId: string]: string;
  }>({});

  const handleLoginUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((prev) => ({ ...prev, username: e.target.value }));
    },
    [],
  );

  const handleLoginPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((prev) => ({ ...prev, password: e.target.value }));
    },
    [],
  );

  const login = useCallback(async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/c8519cb6-9df9-4faf-a146-2fedd66d1623', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const authenticatedUser = {
          id: data.user.id.toString(),
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          city: data.user.city || '',
          isActive: data.user.isActive,
          password: '***'
        };
        appState.currentUser = authenticatedUser;
        hideLoginForm();
        setLoginForm({ username: "", password: "" });
      } else {
        alert(data.error || "Неверные учетные данные или пользователь заблокирован");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Ошибка подключения к серверу");
    }
  }, [loginForm, hideLoginForm]);

  const startEditProfile = useCallback(() => {
    if (appState.currentUser) {
      setProfileEdit({
        isEditing: true,
        name: appState.currentUser.name,
        password: "",
        city: appState.currentUser.city || "",
      });
    }
  }, [appState.currentUser]);

  const handleProfileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileEdit((prev) => ({ ...prev, name: e.target.value }));
    },
    [],
  );

  const handleProfilePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileEdit((prev) => ({ ...prev, password: e.target.value }));
    },
    [],
  );

  const handleProfileCityChange = useCallback((value: string) => {
    setProfileEdit((prev) => ({ ...prev, city: value }));
  }, []);

  const saveProfile = useCallback(async () => {
    if (!appState.currentUser) return;

    try {
      // Prepare update data
      const updateData: any = {
        name: profileEdit.name,
        city: profileEdit.city || null,
      };

      // Add password only if it's not empty
      if (profileEdit.password && profileEdit.password.trim()) {
        updateData.password = profileEdit.password;
      }

      // Update user in database
      const response = await fetch(
        `https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${appState.currentUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('✅ Профиль обновлён в БД:', data.user);

      // Update local state
      const updatedUser = {
        ...appState.currentUser,
        name: profileEdit.name,
        city: profileEdit.city,
        ...(profileEdit.password && { password: profileEdit.password }),
      };

      const userIndex = appState.users.findIndex(
        (u) => u.id === appState.currentUser!.id,
      );
      if (userIndex !== -1) {
        appState.users[userIndex] = updatedUser;
        appState.currentUser = updatedUser;
      }

      setProfileEdit((prev) => ({ ...prev, isEditing: false }));
      alert('Профиль успешно обновлён!');
    } catch (error) {
      console.error('❌ Ошибка обновления профиля:', error);
      alert(`Ошибка обновления профиля: ${error.message}`);
    }
  }, [appState.currentUser, appState.users, profileEdit]);

  const cancelEditProfile = useCallback(() => {
    setProfileEdit((prev) => ({ ...prev, isEditing: false }));
  }, []);

  const startEditCity = useCallback((city: any) => {
    setEditingCityId(city.id);
    setEditingCityName(city.name);
  }, []);

  const handleEditCityNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingCityName(e.target.value);
    },
    [],
  );

  const handleNewCityNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCityName(e.target.value);
    },
    [],
  );

  const handleCityNameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCity();
    }
  }, []);

  const handleAddCity = useCallback(() => {
    if (newCityName.trim()) {
      const isDuplicate = appState.cities.some(
        city => city.name.toLowerCase() === newCityName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        alert("Город с таким названием уже существует");
        return;
      }
      
      addCity({
        id: `city${Date.now()}`,
        name: newCityName.trim(),
      });
      setNewCityName("");
      setTimeout(() => {
        cityNameInputRef.current?.focus();
      }, 0);
    }
  }, [newCityName, addCity, appState.cities]);

  const saveEditCity = useCallback(() => {
    if (editingCityId && editingCityName.trim()) {
      const isDuplicate = appState.cities.some(
        city => city.id !== editingCityId && city.name.toLowerCase() === editingCityName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        alert("Город с таким названием уже существует");
        return;
      }
      
      updateCity(editingCityId, { name: editingCityName.trim() });
      setEditingCityId(null);
      setEditingCityName("");
    }
  }, [editingCityId, editingCityName, updateCity, appState.cities]);

  const cancelEditCity = useCallback(() => {
    setEditingCityId(null);
    setEditingCityName("");
  }, []);

  const startEditTournament = useCallback(
    async (tournament: Tournament) => {
      setEditingTournament(tournament);
      // Load full tournament data from database
      await loadTournamentWithGames(tournament.id);
      navigateTo("tournamentEdit");
    },
    [navigateTo, loadTournamentWithGames],
  );

  const goToCreateTournament = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const userCity = appState.currentUser?.city || "";

    setTournamentForm({
      name: "",
      date: today,
      city: userCity,
      format: "sealed",
      description: "",
      isRated: true,
      swissRounds: 3,
      topRounds: 1,
      participants: [],
      judgeId: "",
    });

    navigateTo("create-tournament");
  }, [navigateTo, appState.currentUser?.city]);

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

  return (
    <div className="min-h-screen bg-gray-100">
      <NavigationHeader
        appState={appState}
        navigateTo={navigateTo}
        logout={logout}
        showLoginForm={showLoginForm}
      />

      <main className="container mx-auto px-4 py-8">
        {appState.currentPage === "rating" && (
          <RatingPage appState={appState} />
        )}

        {appState.currentPage === "admin" && (
          <CombinedAdminPage
            appState={appState}
            toggleUserStatus={toggleUserStatus}
            updateUserRole={updateUserRole}
            deleteUser={deleteUser}
            addUser={addUser}
            addPlayer={addPlayer}
            resetToInitialState={resetToInitialState}
          />
        )}

        {appState.currentPage === "profile" && (
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

        {appState.currentPage === "tournaments" && (
          <TournamentsPage
            appState={appState}
            startEditTournament={startEditTournament}
            goToCreateTournament={goToCreateTournament}
            deleteTournament={deleteTournament}
            confirmTournament={confirmTournament}
            navigateTo={navigateTo}
          />
        )}

        {appState.currentPage === "my-tournaments" && (
          <MyTournamentsPage
            appState={appState}
            navigateTo={navigateTo}
          />
        )}

        {appState.currentPage === "cities" && (
          <CitiesPage
            appState={appState}
            editingCityId={editingCityId}
            editingCityName={editingCityName}
            newCityName={newCityName}
            handleEditCityNameChange={handleEditCityNameChange}
            handleNewCityNameChange={handleNewCityNameChange}
            handleCityNameKeyPress={handleCityNameKeyPress}
            startEditCity={startEditCity}
            saveEditCity={saveEditCity}
            cancelEditCity={cancelEditCity}
            handleAddCity={handleAddCity}
            deleteCity={deleteCity}
            cityNameInputRef={cityNameInputRef}
          />
        )}

        {appState.currentPage === "formats" && (
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

        {appState.currentPage === "create-tournament" && (
          <CreateTournamentPage
            appState={appState}
            tournamentForm={tournamentForm}
            setTournamentForm={setTournamentForm}
            navigateTo={navigateTo}
            addTournament={addTournament}
            startEditTournament={startEditTournament}
            syncDbUsersToPlayers={syncDbUsersToPlayers}
          />
        )}

        {appState.currentPage === "tournamentEdit" && (
          <TournamentEditPage
            appState={appState}
            editingTournament={editingTournament}
            setEditingRoundId={setEditingRoundId}
            setTempMatches={setTempMatches}
            setIsEditingPairings={setIsEditingPairings}
            updateMatchResult={updateMatchResult}
            togglePlayerDrop={togglePlayerDrop}
            generatePairings={generatePairings}
            addTournamentRound={addTournamentRound}
            deleteLastRound={deleteLastRound}
            finishTournament={finishTournament}
            confirmTournament={confirmTournament}
          />
        )}

        {typeof appState.currentPage === "object" &&
          appState.currentPage.page === "tournament-view" && (
            <TournamentViewPage
              appState={appState}
              tournamentId={appState.currentPage.tournamentId}
              navigateTo={navigateTo}
              loadTournamentWithGames={loadTournamentWithGames}
            />
          )}

        {appState.currentPage === "tournament-management" && (
          <TournamentManagementPage appState={appState} />
        )}
      </main>

      {isEditingPairings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Изменить пары тура</CardTitle>
              <CardDescription>
                Отладка: editingRoundId = {editingRoundId}, tempMatches.length ={" "}
                {tempMatches.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const tournament = appState.tournaments.find((t) =>
                  t.rounds?.some((r) => r.id === editingRoundId),
                );
                const editingRound = tournament?.rounds?.find(
                  (r) => r.id === editingRoundId,
                );

                if (!tournament || !editingRound) {
                  return (
                    <div className="text-center py-4">
                      <p>Ошибка: тур не найден</p>
                      <Button
                        onClick={() => {
                          setIsEditingPairings(false);
                          setEditingRoundId(null);
                          setTempMatches([]);
                        }}
                      >
                        Закрыть
                      </Button>
                    </div>
                  );
                }

                const availablePlayers = tournament.participants
                  .filter(
                    (playerId) =>
                      !(tournament.droppedPlayerIds || []).includes(playerId),
                  )
                  .map((playerId) => ({
                    id: playerId,
                    name:
                      appState.users.find((u) => u.id === playerId)?.name ||
                      "Неизвестный",
                  }));

                const handlePlayerChange = (
                  matchIndex: number,
                  playerSlot: "player1Id" | "player2Id",
                  playerId: string | null,
                ) => {
                  setTempMatches((prev) =>
                    prev.map((match, idx) =>
                      idx === matchIndex
                        ? {
                            ...match,
                            [playerSlot]:
                              playerId === "BYE" ? undefined : playerId,
                          }
                        : match,
                    ),
                  );
                };

                const savePairings = () => {
                  const usedPlayerIds = new Set<string>();
                  let isValid = true;

                  for (const match of tempMatches) {
                    if (match.player1Id && usedPlayerIds.has(match.player1Id)) {
                      alert("Игрок не может играть в двух парах одновременно");
                      isValid = false;
                      break;
                    }
                    if (match.player2Id && usedPlayerIds.has(match.player2Id)) {
                      alert("Игрок не может играть в двух парах одновременно");
                      isValid = false;
                      break;
                    }
                    if (match.player1Id) usedPlayerIds.add(match.player1Id);
                    if (match.player2Id) usedPlayerIds.add(match.player2Id);
                  }

                  if (isValid) {
                    updateRoundMatches(
                      tournament.id,
                      editingRoundId!,
                      tempMatches,
                    );
                    setIsEditingPairings(false);
                    setEditingRoundId(null);
                    setTempMatches([]);
                  }
                };

                return (
                  <div className="space-y-4">
                    {tempMatches.map((match, matchIndex) => (
                      <div
                        key={match.id}
                        className="flex items-center gap-4 p-3 border rounded-lg"
                      >
                        <div className="font-medium min-w-[80px]">
                          Стол {match.tableNumber}
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                          <Select
                            value={match.player1Id || "BYE"}
                            onValueChange={(value) =>
                              handlePlayerChange(
                                matchIndex,
                                "player1Id",
                                value === "BYE" ? null : value,
                              )
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Выберите игрока 1" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BYE">БАЙ</SelectItem>
                              {availablePlayers.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-gray-500">VS</span>
                          <Select
                            value={match.player2Id || "BYE"}
                            onValueChange={(value) =>
                              handlePlayerChange(
                                matchIndex,
                                "player2Id",
                                value === "BYE" ? null : value,
                              )
                            }
                          >
                            <SelectTrigger className="flex-1">
                              <SelectValue placeholder="Выберите игрока 2" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="BYE">БАЙ</SelectItem>
                              {availablePlayers.map((player) => (
                                <SelectItem key={player.id} value={player.id}>
                                  {player.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingPairings(false);
                          setEditingRoundId(null);
                          setTempMatches([]);
                        }}
                      >
                        Отмена
                      </Button>
                      <Button onClick={savePairings}>
                        Сохранить изменения
                      </Button>
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Index;