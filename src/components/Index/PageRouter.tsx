import React from "react";
import type { AppState, Page, Tournament } from "@/types";
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

interface ProfileEdit {
  isEditing: boolean;
  name: string;
  password: string;
  city: string;
}

interface TournamentForm {
  name: string;
  date: string;
  city: string;
  format: string;
  description: string;
  isRated: boolean;
  swissRounds: number;
  topRounds: number;
  participants: string[];
  judgeId: string;
  tSeating?: boolean;
}

interface PageRouterProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
  profileEdit: ProfileEdit;
  startEditProfile: () => void;
  handleProfileNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfilePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfileCityChange: (value: string) => void;
  saveProfile: () => void;
  cancelEditProfile: () => void;
  startEditTournament: (tournament: Tournament) => Promise<void>;
  goToCreateTournament: () => void;
  deleteTournament: (id: string) => void;
  confirmTournament: (tournamentId: string) => void;
  editingCityId: string | null;
  editingCityName: string;
  newCityName: string;
  handleEditCityNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNewCityNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCityNameKeyPress: (e: React.KeyboardEvent) => void;
  startEditCity: (city: any) => void;
  saveEditCity: () => void;
  cancelEditCity: () => void;
  handleAddCity: () => void;
  deleteCity: (id: string) => void;
  cityNameInputRef: React.RefObject<HTMLInputElement>;
  editingFormatId: string | null;
  editingFormat: { name: string; coefficient: number };
  newFormat: { name: string; coefficient: number };
  setEditingFormatId: React.Dispatch<React.SetStateAction<string | null>>;
  setEditingFormat: React.Dispatch<React.SetStateAction<{ name: string; coefficient: number }>>;
  setNewFormat: React.Dispatch<React.SetStateAction<{ name: string; coefficient: number }>>;
  addTournamentFormat: (format: any) => void;
  updateTournamentFormat: (id: string, updates: any) => void;
  deleteTournamentFormat: (id: string) => void;
  formatNameInputRef: React.RefObject<HTMLInputElement>;
  tournamentForm: TournamentForm;
  setTournamentForm: React.Dispatch<React.SetStateAction<TournamentForm>>;
  addTournament: (tournament: any) => void;
  syncDbUsersToPlayers: () => void;
  editingTournament: Tournament | null;
  setEditingRoundId: React.Dispatch<React.SetStateAction<string | null>>;
  setTempMatches: React.Dispatch<React.SetStateAction<any[]>>;
  setIsEditingPairings: React.Dispatch<React.SetStateAction<boolean>>;
  updateMatchResult: (tournamentId: string, roundId: string, matchId: string, result: string) => void;
  togglePlayerDrop: (tournamentId: string, playerId: string) => void;
  generatePairings: (tournamentId: string) => void;
  addTournamentRound: (tournamentId: string) => void;
  deleteLastRound: (tournamentId: string) => void;
  finishTournament: (tournamentId: string) => void;
  confirmTournamentWithPlayerUpdates: (tournamentId: string) => void;
  updateTournament: (id: string, updates: any) => void;
  createSeatingRound: (tournamentId: string) => void;
  loadTournamentWithGames: (tournamentId: string) => void;
  toggleUserStatus: (id: string) => void;
  updateUserRole: (id: string, role: string) => void;
  deleteUser: (id: string) => void;
  addUser: (user: any) => void;
  addPlayer: (player: any) => void;
  resetToInitialState: () => void;
}

export const PageRouter: React.FC<PageRouterProps> = ({
  appState,
  navigateTo,
  profileEdit,
  startEditProfile,
  handleProfileNameChange,
  handleProfilePasswordChange,
  handleProfileCityChange,
  saveProfile,
  cancelEditProfile,
  startEditTournament,
  goToCreateTournament,
  deleteTournament,
  confirmTournament,
  editingCityId,
  editingCityName,
  newCityName,
  handleEditCityNameChange,
  handleNewCityNameChange,
  handleCityNameKeyPress,
  startEditCity,
  saveEditCity,
  cancelEditCity,
  handleAddCity,
  deleteCity,
  cityNameInputRef,
  editingFormatId,
  editingFormat,
  newFormat,
  setEditingFormatId,
  setEditingFormat,
  setNewFormat,
  addTournamentFormat,
  updateTournamentFormat,
  deleteTournamentFormat,
  formatNameInputRef,
  tournamentForm,
  setTournamentForm,
  addTournament,
  syncDbUsersToPlayers,
  editingTournament,
  setEditingRoundId,
  setTempMatches,
  setIsEditingPairings,
  updateMatchResult,
  togglePlayerDrop,
  generatePairings,
  addTournamentRound,
  deleteLastRound,
  finishTournament,
  confirmTournamentWithPlayerUpdates,
  updateTournament,
  createSeatingRound,
  loadTournamentWithGames,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  addUser,
  addPlayer,
  resetToInitialState,
}) => {
  return (
    <>
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
          updateTournament={updateTournament}
          createSeatingRound={createSeatingRound}
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
    </>
  );
};
