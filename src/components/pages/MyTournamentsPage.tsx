import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Icon from "@/components/ui/icon";
import type { AppState, Page, Tournament } from "@/types";
import { canManageTournament } from "@/utils/permissions";
import { calculateTournamentStandings } from "@/utils/tournamentHelpers";

interface MyTournamentsPageProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
}

export const MyTournamentsPage: React.FC<MyTournamentsPageProps> = ({
  appState,
  navigateTo,
}) => {
  const currentUserId = appState.currentUser?.id || "";
  const [tournamentResults, setTournamentResults] = React.useState<Map<string, number>>(new Map());

  // Filter only confirmed tournaments where current user participated
  const myConfirmedTournaments = appState.tournaments.filter(
    (tournament) =>
      tournament.participants.includes(currentUserId) && tournament.status === 'confirmed',
  );

  // Load tournament results from database
  React.useEffect(() => {
    const loadTournamentResults = async () => {
      try {
        const response = await fetch('https://functions.poehali.dev/14e205c3-5a13-45c5-a7ab-d2b8ed973b65');
        if (response.ok) {
          const data = await response.json();
          const resultsMap = new Map<string, number>();
          
          console.log('📊 Загружены результаты турниров:', data.results);
          
          data.results?.forEach((result: any) => {
            // Создаем ключ с числовым tournament_id и строковым player_id
            const key = `${result.tournament_id}-${result.player_id}`;
            resultsMap.set(key, result.place);
            console.log(`  Турнир ${result.tournament_id}, игрок ${result.player_id}: место ${result.place}`);
          });
          
          console.log('🗺️ Карта результатов создана:', Array.from(resultsMap.entries()));
          setTournamentResults(resultsMap);
        }
      } catch (error) {
        console.warn('⚠️ Не удалось загрузить результаты турниров:', error);
      }
    };
    
    loadTournamentResults();
  }, []);

  // Function to get player's place in tournament
  const getPlayerPlace = (tournament: Tournament, playerId: string): number => {
    if (tournament.status !== 'confirmed') return 0;

    // Try to get place from saved results first
    if (tournament.dbId) {
      const key = `${tournament.dbId}-${playerId}`;
      console.log(`🔍 Ищу результат для турнира ${tournament.dbId} (${tournament.name}), игрока ${playerId}, ключ: ${key}`);
      console.log(`📋 Доступные ключи в карте:`, Array.from(tournamentResults.keys()));
      
      const savedPlace = tournamentResults.get(key);
      if (savedPlace) {
        console.log(`✅ Найдено сохранённое место: ${savedPlace}`);
        return savedPlace;
      } else {
        console.log(`❌ Место не найдено в сохранённых результатах`);
      }
    } else {
      console.log(`⚠️ У турнира ${tournament.name} нет dbId`);
    }

    // Fallback: calculate from tournament data
    console.log(`🔄 Пересчитываю место из данных турнира`);
    const standings = calculateTournamentStandings(tournament, appState.users);
    const playerIndex = standings.findIndex(
      (standing) => standing.user.id === playerId,
    );
    
    return playerIndex + 1;
  };

  // Format tournament type
  const formatTournamentType = (tournament: Tournament): string => {
    const swiss = tournament.swissRounds;
    const top = tournament.topRounds;

    if (swiss > 0 && top > 0) {
      return `${swiss} тура(ов) + Топ-${2 ** top}`;
    } else if (swiss > 0) {
      return `${swiss} тура(ов)`;
    }
    return "Обычный турнир";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Icon name="Trophy" size={20} className="mr-2" />
            Мои турниры
          </CardTitle>
          <CardDescription>
            Подтверждённые турниры, в которых вы участвовали (
            {myConfirmedTournaments.length})
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myConfirmedTournaments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icon
                name="Trophy"
                size={48}
                className="mx-auto mb-4 opacity-50"
              />
              <p>Пока нет завершённых турниров</p>
              <p className="text-sm mt-2">
                Участвуйте в турнирах, чтобы они появились в истории
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название турнира</TableHead>
                  <TableHead>Клуб</TableHead>
                  <TableHead>Формат</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-center">Участников</TableHead>
                  <TableHead className="text-center">Место</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {myConfirmedTournaments.map((tournament) => {
                  const place = getPlayerPlace(tournament, currentUserId);
                  const placeColor =
                    place === 1
                      ? "text-yellow-600"
                      : place === 2
                        ? "text-gray-500"
                        : place === 3
                          ? "text-orange-600"
                          : "text-muted-foreground";

                  return (
                    <TableRow
                      key={tournament.id}
                      className="cursor-pointer hover:bg-muted/80"
                      onClick={() =>
                        navigateTo({
                          page: "tournament-view",
                          tournamentId: tournament.id,
                        })
                      }
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {tournament.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        {tournament.club ? (
                          <div className="flex items-center gap-1 text-sm">
                            <Icon name="Users" size={14} />
                            {tournament.club}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>{formatTournamentType(tournament)}</TableCell>
                      <TableCell>{tournament.date ? new Date(tournament.date).toLocaleDateString('ru-RU') : 'Дата не указана'}</TableCell>
                      <TableCell className="text-center">
                        {tournament.participants.length}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`font-semibold ${placeColor}`}>
                          {place === 1
                            ? "🥇 1"
                            : place === 2
                              ? "🥈 2"
                              : place === 3
                                ? "🥉 3"
                                : place}
                          {place <= 3 && place > 0 ? "" : " место"}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};