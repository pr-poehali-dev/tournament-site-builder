import React, { useState, useCallback, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import Icon from "@/components/ui/icon";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
import type { AppState, Tournament, Page, Match, Round } from "@/types";

// Hook
import { useAppState } from "@/hooks/useAppState";

// Shared Components
import { NavigationHeader } from "@/components/shared/NavigationHeader";
import { LoginForm } from "@/components/shared/LoginForm";

// Page Components
import { RatingPage } from "@/components/pages/RatingPage";
import { AdminPage } from "@/components/pages/AdminPage";
import { ProfilePage } from "@/components/pages/ProfilePage";
import { TournamentsPage } from "@/components/pages/TournamentsPage";
import { MyTournamentsPage } from "@/components/pages/MyTournamentsPage";

import { CitiesPage } from "@/components/pages/CitiesPage";
import { FormatsPage } from "@/components/pages/FormatsPage";
import { CreateTournamentPage } from "@/components/pages/CreateTournamentPage";
import { TournamentViewPage } from "@/components/pages/TournamentViewPage";

// Helper function to get player's TOP status
const getTopStatus = (tournament: any, playerId: string): string => {
  if (
    tournament.topRounds === 0 ||
    tournament.currentRound <= tournament.swissRounds
  ) {
    return "";
  }

  // Find the furthest TOP round the player reached
  let furthestRound = 0;
  let isStillActive = false;
  let wonLastMatch = false;

  tournament.rounds?.forEach((round: any) => {
    if (round.number > tournament.swissRounds) {
      const match = round.matches?.find(
        (m: any) => m.player1Id === playerId || m.player2Id === playerId,
      );

      if (match) {
        furthestRound = round.number;

        if (match.result) {
          const isPlayer1 = match.player1Id === playerId;
          wonLastMatch =
            (match.result === "win1" && isPlayer1) ||
            (match.result === "win2" && !isPlayer1);
          isStillActive = wonLastMatch;
        } else {
          isStillActive = true; // Match not played yet
          wonLastMatch = false;
        }
      }
    }
  });

  if (furthestRound === 0) {
    return "-";
  }

  // Determine status based on furthest round reached and current status
  const topRoundNumber = furthestRound - tournament.swissRounds;
  const totalTopRounds = tournament.topRounds;

  // If player won their last match or match not played yet, they're still active
  if (isStillActive) {
    if (totalTopRounds - topRoundNumber + 1 === 2) {
      return "🏆 Финалист";
    } else if (totalTopRounds - topRoundNumber + 1 === 4) {
      return "🏆 Финалист";
    } else {
      const playersInThisRound = Math.pow(
        2,
        totalTopRounds - topRoundNumber + 1,
      );
      return `🏆 Финалист`;
    }
  } else {
    // Player lost their last match
    const playersInPreviousRound = Math.pow(
      2,
      totalTopRounds - topRoundNumber + 2,
    );
    if (playersInPreviousRound === 4) {
      return "🥉 Полуфиналист";
    } else if (playersInPreviousRound === 2) {
      return "🥈 Вице-чемпион";
    } else {
      return `ТОП-${playersInPreviousRound / 2}`;
    }
  }
};

// Helper function to sort players by TOP tournament results
const sortByTopResults = (a: any, b: any, tournament: any, users: any[]) => {
  // Find the furthest TOP round each player reached and their status
  const getTopPerformance = (playerId: string) => {
    let furthestRound = 0;
    let isStillActive = false;
    let wonLastMatch = false;

    // Find the furthest round the player participated in
    tournament.rounds?.forEach((round: any) => {
      if (round.number > tournament.swissRounds) {
        const match = round.matches?.find(
          (m: any) => m.player1Id === playerId || m.player2Id === playerId,
        );

        if (match) {
          furthestRound = round.number;

          if (match.result) {
            const isPlayer1 = match.player1Id === playerId;
            wonLastMatch =
              (match.result === "win1" && isPlayer1) ||
              (match.result === "win2" && !isPlayer1);
            isStillActive = wonLastMatch;
          } else {
            isStillActive = true; // Match not played yet
            wonLastMatch = false;
          }
        }
      }
    });

    // If player never played in TOP rounds, they didn't make it to TOP
    if (furthestRound === 0) {
      return {
        furthestRound: tournament.swissRounds, // Use Swiss rounds as baseline
        isStillActive: false,
        madeToTop: false,
      };
    }

    return { furthestRound, isStillActive, madeToTop: true };
  };

  const playerA = getTopPerformance(a.user.id);
  const playerB = getTopPerformance(b.user.id);

  // 1. Players who made it to TOP rank higher than those who didn't
  if (playerA.madeToTop !== playerB.madeToTop) {
    return playerB.madeToTop ? 1 : -1;
  }

  // 2. If both made to TOP, player who went further ranks higher
  if (playerA.madeToTop && playerB.madeToTop) {
    if (playerA.furthestRound !== playerB.furthestRound) {
      return playerB.furthestRound - playerA.furthestRound;
    }

    // 3. If same round reached, active player (still in tournament) ranks higher
    if (playerA.isStillActive !== playerB.isStillActive) {
      return playerB.isStillActive ? 1 : -1;
    }
  }

  // 4. If same TOP performance (or both didn't make TOP), use Swiss standings
  if (a.points !== b.points) {
    return b.points - a.points;
  }

  // 5. If same points, use Buchholz
  if (b.buchholz !== a.buchholz) return b.buchholz - a.buchholz;
  
  // 6. If same Buchholz, use Sum Buchholz
  return b.sumBuchholz - a.sumBuchholz;
};

// Helper function to get round name
const getRoundName = (tournament: any, roundNumber: number): string => {
  if (roundNumber <= tournament.swissRounds) {
    return `${roundNumber} тур`;
  } else {
    const topRoundNumber = roundNumber - tournament.swissRounds;
    const totalTopRounds = tournament.topRounds;
    const playersInThisRound = Math.pow(2, totalTopRounds - topRoundNumber + 1);

    if (playersInThisRound === 2) {
      return "Финал";
    } else if (playersInThisRound === 4) {
      return "Полуфинал";
    } else {
      return `ТОП-${playersInThisRound}`;
    }
  }
};

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
    togglePlayerDrop,
    updateRoundMatches,
    deleteLastRound,
    finishTournament,
    confirmTournament,
    confirmTournamentWithPlayerUpdates,
    resetToInitialState,
    generatePairings,
  } = useAppState();

  // Login form state
  const [loginForm, setLoginForm] = useState({ username: "", password: "" });

  // Profile editing state
  const [profileEdit, setProfileEdit] = useState({
    isEditing: false,
    name: "",
    password: "",
    city: "",
  });

  // City form states
  const [editingCityId, setEditingCityId] = useState<string | null>(null);
  const [editingCityName, setEditingCityName] = useState("");
  const [newCityName, setNewCityName] = useState("");
  const cityNameInputRef = useRef<HTMLInputElement>(null);

  // Format form states
  const [editingFormatId, setEditingFormatId] = useState<string | null>(null);
  const [editingFormat, setEditingFormat] = useState({
    name: "",
    coefficient: 1,
  });
  const [newFormat, setNewFormat] = useState({ name: "", coefficient: 1 });
  const formatNameInputRef = useRef<HTMLInputElement>(null);

  // Pairing editing state
  const [isEditingPairings, setIsEditingPairings] = useState(false);
  const [editingRoundId, setEditingRoundId] = useState<string | null>(null);
  const [tempMatches, setTempMatches] = useState<any[]>([]);

  // Tournament creation form states and refs
  const [tournamentForm, setTournamentForm] = useState(() => {
    const today = new Date().toISOString().split("T")[0]; // Текущая дата в формате YYYY-MM-DD
    const userCity = appState.currentUser?.city || ""; // Город текущего пользователя

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
    };
  });

  // Tournament refs removed - now using controlled components

  // Tournament editing state
  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );
  const [matchResults, setMatchResults] = useState<{
    [matchId: string]: string;
  }>({});

  // Login handlers
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

  const login = useCallback(() => {
    const user = appState.users.find(
      (u) =>
        u.username === loginForm.username && u.password === loginForm.password,
    );
    if (user && user.isActive) {
      // Set current user through the hook's login mechanism
      appState.currentUser = user;
      hideLoginForm();
      setLoginForm({ username: "", password: "" });
    } else {
      alert("Неверные учетные данные или пользователь заблокирован");
    }
  }, [appState.users, loginForm, hideLoginForm]);

  // Profile handlers
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

  const saveProfile = useCallback(() => {
    if (!appState.currentUser) return;

    // Update user through the hook's mechanism
    const updatedUser = {
      ...appState.currentUser,
      name: profileEdit.name,
      city: profileEdit.city,
      ...(profileEdit.password && { password: profileEdit.password }),
    };

    // Update the user in state
    const userIndex = appState.users.findIndex(
      (u) => u.id === appState.currentUser!.id,
    );
    if (userIndex !== -1) {
      appState.users[userIndex] = updatedUser;
      appState.currentUser = updatedUser;
    }

    setProfileEdit((prev) => ({ ...prev, isEditing: false }));
  }, [appState.currentUser, appState.users, profileEdit]);

  const cancelEditProfile = useCallback(() => {
    setProfileEdit((prev) => ({ ...prev, isEditing: false }));
  }, []);

  // City management handlers
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
      addCity({
        id: `city${Date.now()}`,
        name: newCityName.trim(),
      });
      setNewCityName("");
      setTimeout(() => {
        cityNameInputRef.current?.focus();
      }, 0);
    }
  }, [newCityName, addCity]);

  const saveEditCity = useCallback(() => {
    if (editingCityId && editingCityName.trim()) {
      updateCity(editingCityId, { name: editingCityName.trim() });
      setEditingCityId(null);
      setEditingCityName("");
    }
  }, [editingCityId, editingCityName, updateCity]);

  const cancelEditCity = useCallback(() => {
    setEditingCityId(null);
    setEditingCityName("");
  }, []);

  // Tournament management handlers

  const startEditTournament = useCallback(
    (tournament: Tournament) => {
      setEditingTournament(tournament);
      navigateTo("tournamentEdit");
    },
    [navigateTo],
  );

  const goToCreateTournament = useCallback(() => {
    // Сбрасываем форму при открытии страницы создания турнира
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
    });

    navigateTo("create-tournament");
  }, [navigateTo, appState.currentUser?.city]);

  // Tournament Edit Page Component (kept inline due to complexity)
  const TournamentEditPage = () => {
    if (!editingTournament) return null;

    const tournament =
      appState.tournaments.find((t) => t.id === editingTournament.id) ||
      editingTournament;
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

        {tournament.rounds && tournament.rounds.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Туры турнира</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tournament.rounds?.map((round) => (
                <div key={round.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Тур {round.number}</h3>
                    <Badge
                      variant={round.isCompleted ? "default" : "secondary"}
                    >
                      {round.isCompleted ? "Завершён" : "В процессе"}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {round.matches.map((match) => {
                      const player1 = appState.users.find(
                        (u) => u.id === match.player1Id,
                      );
                      const player2 = match.player2Id
                        ? appState.users.find((u) => u.id === match.player2Id)
                        : null;

                      return (
                        <div
                          key={match.id}
                          className="flex items-center justify-between p-2 border rounded"
                        >
                          <div className="flex items-center gap-4">
                            <div className="font-medium">
                              Стол {match.tableNumber || "БАЙ"}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>
                                {player1?.name || "Неизвестный игрок"}
                              </span>
                              <span className="text-gray-500">vs</span>
                              <span>{player2?.name || "БАЙ"}</span>
                            </div>
                          </div>

                          {match.result ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {match.result === "win1" &&
                                  (player1?.name || "Игрок 1")}
                                {match.result === "win2" &&
                                  (player2?.name || "Игрок 2")}
                                {match.result === "draw" && "Ничья"}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {match.points1}:{match.points2}
                              </span>
                              {/* Allow editing result if it's the last round and no next round exists */}
                              {tournament.rounds &&
                                round.number === tournament.rounds.length && (
                                  <div className="flex gap-1 ml-2">
                                    <Button
                                      size="sm"
                                      variant={
                                        match.result === "win1"
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        updateMatchResult(
                                          tournament.id,
                                          round.id,
                                          match.id,
                                          "win1",
                                        )
                                      }
                                    >
                                      3-0
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        match.result === "draw"
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        updateMatchResult(
                                          tournament.id,
                                          round.id,
                                          match.id,
                                          "draw",
                                        )
                                      }
                                    >
                                      1-1
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant={
                                        match.result === "win2"
                                          ? "default"
                                          : "outline"
                                      }
                                      onClick={() =>
                                        updateMatchResult(
                                          tournament.id,
                                          round.id,
                                          match.id,
                                          "win2",
                                        )
                                      }
                                    >
                                      0-3
                                    </Button>
                                  </div>
                                )}
                            </div>
                          ) : !match.player2Id ? (
                            <Badge variant="secondary">БАЙ</Badge>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex gap-1 flex-wrap">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateMatchResult(
                                      tournament.id,
                                      round.id,
                                      match.id,
                                      "win1",
                                    )
                                  }
                                >
                                  3-0
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateMatchResult(
                                      tournament.id,
                                      round.id,
                                      match.id,
                                      "draw",
                                    )
                                  }
                                >
                                  1-1
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    updateMatchResult(
                                      tournament.id,
                                      round.id,
                                      match.id,
                                      "win2",
                                    )
                                  }
                                >
                                  0-3
                                </Button>
                              </div>
                              <div className="flex gap-3 items-center text-sm">
                                <div className="flex items-center gap-1">
                                  <Checkbox
                                    id={`drop-${match.id}-1`}
                                    checked={
                                      tournament.droppedPlayerIds?.includes(
                                        match.player1Id,
                                      ) || false
                                    }
                                    onCheckedChange={() =>
                                      togglePlayerDrop(
                                        tournament.id,
                                        match.player1Id,
                                      )
                                    }
                                  />
                                  <label
                                    htmlFor={`drop-${match.id}-1`}
                                    className="text-red-600 cursor-pointer"
                                  >
                                    Дроп{" "}
                                    {
                                      appState.players.find(
                                        (p) => p.id === match.player1Id,
                                      )?.username
                                    }
                                  </label>
                                </div>
                                {match.player2Id && (
                                  <div className="flex items-center gap-1">
                                    <Checkbox
                                      id={`drop-${match.id}-2`}
                                      checked={
                                        tournament.droppedPlayerIds?.includes(
                                          match.player2Id,
                                        ) || false
                                      }
                                      onCheckedChange={() =>
                                        togglePlayerDrop(
                                          tournament.id,
                                          match.player2Id,
                                        )
                                      }
                                    />
                                    <label
                                      htmlFor={`drop-${match.id}-2`}
                                      className="text-red-600 cursor-pointer"
                                    >
                                      Дроп{" "}
                                      {
                                        appState.players.find(
                                          (p) => p.id === match.player2Id,
                                        )?.username
                                      }
                                    </label>
                                  </div>
                                )}
                              </div>
                            </div>
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
        {(appState.currentUser?.role === "admin" ||
          appState.currentUser?.role === "judge") && (
          <Card>
            <CardHeader>
              <CardTitle>Управление турниром</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2 justify-center">
                {(() => {
                  const canCreateNextRound =
                    tournament.currentRound < totalRounds &&
                    (tournament.status === "active" ||
                      tournament.status === "draft");
                  const lastRound =
                    tournament.rounds && tournament.rounds.length > 0
                      ? tournament.rounds[tournament.rounds.length - 1]
                      : null;
                  const isLastRoundCompleted =
                    !lastRound ||
                    lastRound.matches?.every(
                      (match) => !match.player2Id || match.result,
                    ) ||
                    false;

                  return (
                    canCreateNextRound &&
                    (tournament.rounds?.length === 0 ||
                      !tournament.rounds?.length ||
                      isLastRoundCompleted) && (
                      <Button
                        onClick={() => {
                          const pairings = generatePairings(tournament.id);
                          if (pairings.success) {
                            const newRound: Round = {
                              id: `round-${Date.now()}`,
                              number: tournament.currentRound + 1,
                              matches: pairings.matches,
                              isCompleted: false,
                            };
                            addTournamentRound(tournament.id, newRound);
                          } else {
                            alert(pairings.error);
                          }
                        }}
                        className="flex items-center gap-2"
                      >
                        <Icon name="Plus" size={16} />
                        Создать{" "}
                        {getRoundName(tournament, tournament.currentRound + 1)}
                      </Button>
                    )
                  );
                })()}

                {/* Show message if can't create next round */}
                {tournament.currentRound < totalRounds &&
                  (tournament.status === "active" ||
                    tournament.status === "draft") &&
                  tournament.rounds &&
                  tournament.rounds.length > 0 &&
                  !tournament.rounds[
                    tournament.rounds.length - 1
                  ].matches?.every(
                    (match) => !match.player2Id || match.result,
                  ) && (
                    <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded">
                      <Icon name="Clock" size={16} className="inline mr-2" />
                      Завершите все матчи текущего тура для создания следующего
                    </div>
                  )}

                {/* Button to edit current round pairings */}
                {tournament.rounds &&
                  tournament.rounds.length > 0 &&
                  !tournament.rounds[tournament.rounds.length - 1]
                    ?.isCompleted && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        console.log("Button clicked!");
                        const lastRound =
                          tournament.rounds[tournament.rounds.length - 1];
                        console.log("Last round:", lastRound);
                        console.log("Setting states...");
                        setEditingRoundId(lastRound.id);
                        setTempMatches([...lastRound.matches]);
                        setIsEditingPairings(true);
                        console.log(
                          "States set - isEditingPairings should be true",
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <Icon name="RefreshCw" size={16} />
                      Изменить пары в рамках тура
                    </Button>
                  )}

                {tournament.rounds && tournament.rounds.length > 0 && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        className="flex items-center gap-2"
                      >
                        <Icon name="Trash2" size={16} />
                        Удалить последний тур
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Подтвердите действие
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Вы уверены, что хотите удалить последний тур? Все
                          результаты тура будут потеряны.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteLastRound(tournament.id)}
                        >
                          Удалить тур
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}

                {tournament.currentRound === totalRounds &&
                  tournament.rounds.length > 0 &&
                  tournament.rounds[tournament.rounds.length - 1]
                    ?.isCompleted &&
                  tournament.status === "active" && (
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
                    <th className="text-left p-2 font-medium">
                      Коэффициент Бухгольца
                    </th>
                    <th className="text-left p-2 font-medium">
                      Сум. коэф. Бухгольца
                    </th>
                    <th className="text-left p-2 font-medium">П-Н-П</th>
                    {tournament.topRounds > 0 &&
                      tournament.currentRound > tournament.swissRounds && (
                        <th className="text-left p-2 font-medium">
                          Статус в топе
                        </th>
                      )}
                  </tr>
                </thead>
                <tbody>
                  {tournament.participants
                    .map((participantId) => {
                      const user = appState.users.find(
                        (u) => u.id === participantId,
                      );
                      if (!user) return null;

                      let points = 0;
                      let wins = 0;
                      let losses = 0;
                      let draws = 0;
                      let opponentIds: string[] = [];

                      tournament.rounds?.forEach((round) => {
                        // Only count Swiss rounds for points and Buchholz
                        if (round.number <= tournament.swissRounds) {
                          const match = round.matches?.find(
                            (m) =>
                              m.player1Id === participantId ||
                              m.player2Id === participantId,
                          );
                          if (match) {
                            if (!match.player2Id) {
                              points += 3;
                              wins += 1;
                            } else if (match.result) {
                              const isPlayer1 =
                                match.player1Id === participantId;
                              const opponentId = isPlayer1
                                ? match.player2Id
                                : match.player1Id;
                              opponentIds.push(opponentId);

                              if (match.result === "draw") {
                                points += 1;
                                draws += 1;
                              } else if (
                                (match.result === "win1" && isPlayer1) ||
                                (match.result === "win2" && !isPlayer1)
                              ) {
                                points += 3;
                                wins += 1;
                              } else {
                                losses += 1;
                              }
                            }
                          }
                        }
                      });

                      // Calculate Buchholz coefficient (sum of opponent points)
                      const buchholz = opponentIds.reduce((acc, opponentId) => {
                        let opponentPoints = 0;
                        tournament.rounds?.forEach((round) => {
                          // Only count Swiss rounds for Buchholz coefficient
                          if (round.number <= tournament.swissRounds) {
                            const opponentMatch = round.matches?.find(
                              (m) =>
                                m.player1Id === opponentId ||
                                m.player2Id === opponentId,
                            );
                            if (opponentMatch) {
                              if (!opponentMatch.player2Id) {
                                opponentPoints += 3;
                              } else if (opponentMatch.result) {
                                const isOpponentPlayer1 =
                                  opponentMatch.player1Id === opponentId;
                                if (opponentMatch.result === "draw") {
                                  opponentPoints += 1;
                                } else if (
                                  (opponentMatch.result === "win1" &&
                                    isOpponentPlayer1) ||
                                  (opponentMatch.result === "win2" &&
                                    !isOpponentPlayer1)
                                ) {
                                  opponentPoints += 3;
                                }
                              }
                            }
                          }
                        });
                        return acc + opponentPoints;
                      }, 0);

                      // Calculate Sum Buchholz coefficient (sum of opponent Buchholz coefficients)
                      const sumBuchholz = opponentIds.reduce((acc, opponentId) => {
                        // Calculate this opponent's Buchholz coefficient
                        let opponentBuchholz = 0;
                        
                        // Get this opponent's opponents
                        let opponentOpponentIds: string[] = [];
                        tournament.rounds?.forEach((round) => {
                          if (round.number <= tournament.swissRounds) {
                            const opponentMatch = round.matches?.find(
                              (m) => m.player1Id === opponentId || m.player2Id === opponentId
                            );
                            if (opponentMatch && opponentMatch.result) {
                              if (!opponentMatch.player2Id) {
                                // BYE - no additional opponents
                              } else {
                                const isOpponentPlayer1 = opponentMatch.player1Id === opponentId;
                                const opponentOpponentId = isOpponentPlayer1 ? opponentMatch.player2Id : opponentMatch.player1Id;
                                opponentOpponentIds.push(opponentOpponentId);
                              }
                            }
                          }
                        });
                        
                        // Calculate opponent's Buchholz (sum of their opponent points)
                        opponentBuchholz = opponentOpponentIds.reduce((oppAcc, oppOppId) => {
                          let oppOppPoints = 0;
                          tournament.rounds?.forEach((round) => {
                            if (round.number <= tournament.swissRounds) {
                              const oppOppMatch = round.matches?.find(
                                (m) => m.player1Id === oppOppId || m.player2Id === oppOppId
                              );
                              if (oppOppMatch) {
                                if (!oppOppMatch.player2Id) {
                                  oppOppPoints += 3;
                                } else if (oppOppMatch.result) {
                                  const isOppOppPlayer1 = oppOppMatch.player1Id === oppOppId;
                                  if (oppOppMatch.result === "draw") {
                                    oppOppPoints += 1;
                                  } else if (
                                    (oppOppMatch.result === "win1" && isOppOppPlayer1) ||
                                    (oppOppMatch.result === "win2" && !isOppOppPlayer1)
                                  ) {
                                    oppOppPoints += 3;
                                  }
                                }
                              }
                            }
                          });
                          return oppAcc + oppOppPoints;
                        }, 0);
                        
                        return acc + opponentBuchholz;
                      }, 0);

                      return {
                        user,
                        points,
                        buchholz,
                        sumBuchholz,
                        wins,
                        losses,
                        draws,
                      };
                    })
                    .filter(Boolean)
                    .sort((a, b) => {
                      // Special sorting logic for tournaments with TOP rounds
                      if (
                        tournament.topRounds > 0 &&
                        tournament.currentRound > tournament.swissRounds
                      ) {
                        return sortByTopResults(
                          a!,
                          b!,
                          tournament,
                          appState.users,
                        );
                      }

                      // Standard Swiss system sorting
                      if (b!.points !== a!.points) return b!.points - a!.points;
                      if (b!.buchholz !== a!.buchholz) return b!.buchholz - a!.buchholz;
                      return b!.sumBuchholz - a!.sumBuchholz;
                    })
                    .map((participant, index) => (
                      <tr
                        key={participant!.user.id}
                        className="border-b hover:bg-gray-50"
                      >
                        <td className="p-2">
                          <Badge variant="outline">{index + 1}</Badge>
                        </td>
                        <td className="p-2 font-medium">
                          {participant!.user.name}
                        </td>
                        <td className="p-2">{participant!.points}</td>
                        <td className="p-2">{participant!.buchholz}</td>
                        <td className="p-2">{participant!.sumBuchholz}</td>
                        <td className="p-2 text-sm text-gray-600">
                          {participant!.wins}-{participant!.draws}-
                          {participant!.losses}
                        </td>
                        {tournament.topRounds > 0 &&
                          tournament.currentRound > tournament.swissRounds && (
                            <td className="p-2 text-sm">
                              <span className="font-medium">
                                {getTopStatus(tournament, participant!.user.id)}
                              </span>
                            </td>
                          )}
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
        {appState.currentPage === "rating" && (
          <RatingPage appState={appState} />
        )}

        {appState.currentPage === "admin" && (
          <AdminPage
            appState={appState}
            toggleUserStatus={toggleUserStatus}
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
            createTournament={goToCreateTournament}
            startEditTournament={startEditTournament}
            confirmTournament={confirmTournament}
          />
        )}

        {appState.currentPage === "my-tournaments" && (
          <MyTournamentsPage appState={appState} navigateTo={navigateTo} />
        )}

        {appState.currentPage === "cities" && (
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
          />
        )}

        {appState.currentPage === "tournamentEdit" && <TournamentEditPage />}

        {typeof appState.currentPage === "object" &&
          appState.currentPage.page === "tournament-view" && (
            <TournamentViewPage
              appState={appState}
              tournamentId={appState.currentPage.tournamentId}
              navigateTo={navigateTo}
            />
          )}
      </main>

      {/* Global Pairing Edit Dialog */}
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
                // Find the tournament and round
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
                  // Validate that no player appears twice
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