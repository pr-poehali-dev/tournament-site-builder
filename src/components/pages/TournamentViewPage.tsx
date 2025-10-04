import React, { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Icon from "@/components/ui/icon";
import type { AppState, Page } from "@/types";
import { ViewTournamentHeader } from "@/components/tournament/ViewTournamentHeader";
import { StandingsTab } from "@/components/tournament/StandingsTab";
import { RoundsTab } from "@/components/tournament/RoundsTab";

interface TournamentViewPageProps {
  appState: AppState;
  tournamentId: string;
  navigateTo: (page: Page) => void;
  loadTournamentWithGames: (tournamentId: string) => void;
}

export const TournamentViewPage: React.FC<TournamentViewPageProps> = ({
  appState,
  tournamentId,
  navigateTo,
  loadTournamentWithGames,
}) => {
  const currentUserId = appState.currentUser?.id || "";
  const tournament = appState.tournaments.find((t) => t.id === tournamentId);

  useEffect(() => {
    if (tournament && (!tournament.rounds || tournament.rounds.length === 0)) {
      loadTournamentWithGames(tournamentId);
    }
  }, [tournamentId, tournament, loadTournamentWithGames]);

  if (!tournament) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="text-center py-12">
            <Icon name="Search" size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">Турнир не найден</p>
            <Button
              onClick={() => navigateTo("my-tournaments")}
              className="mt-4"
            >
              Вернуться к моим турнирам
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ViewTournamentHeader
        tournament={tournament}
        appState={appState}
        navigateTo={navigateTo}
      />

      <Tabs defaultValue="standings" className="space-y-4">
        <TabsList>
          <TabsTrigger value="standings">Турнирная таблица</TabsTrigger>
          <TabsTrigger value="rounds">Туры</TabsTrigger>
        </TabsList>

        <TabsContent value="standings">
          <StandingsTab
            tournament={tournament}
            appState={appState}
            currentUserId={currentUserId}
          />
        </TabsContent>

        <TabsContent value="rounds">
          <RoundsTab
            tournament={tournament}
            appState={appState}
            currentUserId={currentUserId}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};