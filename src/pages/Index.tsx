import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { AppState, Tournament, Page } from "@/types";
import { useAppState } from "@/hooks/useAppState";
import { NavigationHeader } from "@/components/shared/NavigationHeader";
import { LoginForm } from "@/components/shared/LoginForm";
import { PageRouter } from "@/components/Index/PageRouter";
import { PairingsEditor } from "@/components/Index/PairingsEditor";
import { useLoginHandlers } from "@/components/Index/LoginHandlers";
import { useProfileHandlers } from "@/components/Index/ProfileHandlers";
import { useCityHandlers } from "@/components/Index/CityHandlers";
import { useTournamentHandlers } from "@/components/Index/TournamentHandlers";

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
    createSeatingRound,
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
      tSeating: false,
    };
  });

  const [editingTournament, setEditingTournament] = useState<Tournament | null>(
    null,
  );
  const [matchResults, setMatchResults] = useState<{
    [matchId: string]: string;
  }>({});

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

  const loginHandlers = useLoginHandlers(
    loginForm,
    setLoginForm,
    appState,
    hideLoginForm,
  );

  const profileHandlers = useProfileHandlers(
    profileEdit,
    setProfileEdit,
    appState,
  );

  const cityHandlers = useCityHandlers(
    editingCityId,
    editingCityName,
    newCityName,
    setEditingCityId,
    setEditingCityName,
    setNewCityName,
    appState,
    updateCity,
    addCity,
    cityNameInputRef,
  );

  const tournamentHandlers = useTournamentHandlers(
    appState,
    setTournamentForm,
    setEditingTournament,
    navigateTo,
    loadTournamentWithGames,
  );

  if (appState.showLogin) {
    return (
      <LoginForm
        loginForm={loginForm}
        handleLoginUsernameChange={loginHandlers.handleLoginUsernameChange}
        handleLoginPasswordChange={loginHandlers.handleLoginPasswordChange}
        login={loginHandlers.login}
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
        <PageRouter
          appState={appState}
          navigateTo={navigateTo}
          profileEdit={profileEdit}
          startEditProfile={profileHandlers.startEditProfile}
          handleProfileNameChange={profileHandlers.handleProfileNameChange}
          handleProfilePasswordChange={profileHandlers.handleProfilePasswordChange}
          handleProfileCityChange={profileHandlers.handleProfileCityChange}
          saveProfile={profileHandlers.saveProfile}
          cancelEditProfile={profileHandlers.cancelEditProfile}
          startEditTournament={tournamentHandlers.startEditTournament}
          goToCreateTournament={tournamentHandlers.goToCreateTournament}
          deleteTournament={deleteTournament}
          confirmTournament={confirmTournament}
          editingCityId={editingCityId}
          editingCityName={editingCityName}
          newCityName={newCityName}
          handleEditCityNameChange={cityHandlers.handleEditCityNameChange}
          handleNewCityNameChange={cityHandlers.handleNewCityNameChange}
          handleCityNameKeyPress={cityHandlers.handleCityNameKeyPress}
          startEditCity={cityHandlers.startEditCity}
          saveEditCity={cityHandlers.saveEditCity}
          cancelEditCity={cityHandlers.cancelEditCity}
          handleAddCity={cityHandlers.handleAddCity}
          deleteCity={deleteCity}
          cityNameInputRef={cityNameInputRef}
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
          tournamentForm={tournamentForm}
          setTournamentForm={setTournamentForm}
          addTournament={addTournament}
          syncDbUsersToPlayers={syncDbUsersToPlayers}
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
          confirmTournamentWithPlayerUpdates={confirmTournamentWithPlayerUpdates}
          updateTournament={updateTournament}
          createSeatingRound={createSeatingRound}
          loadTournamentWithGames={loadTournamentWithGames}
          toggleUserStatus={toggleUserStatus}
          updateUserRole={updateUserRole}
          deleteUser={deleteUser}
          addUser={addUser}
          addPlayer={addPlayer}
          resetToInitialState={resetToInitialState}
        />
      </main>

      <PairingsEditor
        isEditingPairings={isEditingPairings}
        editingRoundId={editingRoundId}
        tempMatches={tempMatches}
        appState={appState}
        setIsEditingPairings={setIsEditingPairings}
        setEditingRoundId={setEditingRoundId}
        setTempMatches={setTempMatches}
        updateRoundMatches={updateRoundMatches}
      />
    </div>
  );
};

export default Index;
