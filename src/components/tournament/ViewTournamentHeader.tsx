import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Icon from "@/components/ui/icon";
import type { AppState, Tournament, Page } from "@/types";

interface ViewTournamentHeaderProps {
  tournament: Tournament;
  appState: AppState;
  navigateTo: (page: Page) => void;
}

export const ViewTournamentHeader: React.FC<ViewTournamentHeaderProps> = ({
  tournament,
  appState,
  navigateTo,
}) => {
  console.log('🏢 ViewTournamentHeader - клуб турнира:', tournament.club, 'полный объект:', { id: tournament.id, name: tournament.name, club: tournament.club });
  const judge = appState.users.find((u) => u.id === tournament.judgeId);

  const getRoundsLabel = (count: number): string => {
    if (count === 1) return `${count} тур`;
    if (count >= 2 && count <= 4) return `${count} тура`;
    return `${count} туров`;
  };

  const handleShare = () => {
    const url = `${window.location.origin}/tournament/${tournament.id}`;
    navigator.clipboard.writeText(url);
    alert("Ссылка скопирована в буфер обмена!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Trophy" size={20} />
              {tournament.name}
            </CardTitle>
            <CardDescription>
              {tournament.date ? new Date(tournament.date).toLocaleDateString('ru-RU') : 'Дата не указана'} • {tournament.city} •{" "}
              {tournament.participants.length} участников
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShare}
            >
              <Icon name="Share2" size={16} className="mr-2" />
              Поделиться
            </Button>
            <Button
              variant="outline"
              onClick={() => navigateTo("my-tournaments")}
            >
              <Icon name="ArrowLeft" size={16} className="mr-2" />
              Назад
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Формат</div>
            <div className="font-medium">
              {tournament.status === "confirmed" 
                ? (appState.tournamentFormats.find(f => f.id === tournament.format)?.name || tournament.format)
                : (tournament.swissRounds > 0 && tournament.topRounds > 0
                    ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
                    : tournament.swissRounds > 0
                      ? `Швейцарка ${tournament.swissRounds} туров`
                      : `Плей-офф ${tournament.topRounds} туров`)}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Рейтинговый</div>
            <div className="font-medium">
              {tournament.isRated ? "Да" : "Нет"}
            </div>
          </div>
          <div>
            <div className="text-muted-foreground">Статус</div>
            <Badge
              variant={
                tournament.status === "completed" || tournament.status === "confirmed" ? "secondary" : "default"
              }
            >
              {tournament.status === "confirmed"
                ? "Подтверждён"
                : tournament.status === "completed"
                  ? "Завершён"
                  : tournament.status === "active"
                    ? "Активный"
                    : "Черновик"}
            </Badge>
          </div>
          <div>
            <div className="text-muted-foreground">Судья</div>
            <div className="font-medium">
              {judge ? judge.name : "Не указан"}
            </div>
          </div>
          {tournament.club && (
            <div>
              <div className="text-muted-foreground">Клуб</div>
              <div className="font-medium flex items-center gap-1">
                <Icon name="Users" size={14} />
                {tournament.club}
              </div>
            </div>
          )}
          <div>
            <div className="text-muted-foreground">Туров проведено</div>
            <div className="font-medium">
              {tournament.status === "confirmed"
                ? (tournament.swissRounds > 0 && tournament.topRounds > 0
                    ? `${getRoundsLabel(tournament.swissRounds)} + Топ-${Math.pow(2, tournament.topRounds)}`
                    : tournament.swissRounds > 0
                      ? getRoundsLabel(tournament.swissRounds)
                      : `Топ-${Math.pow(2, tournament.topRounds)}`)
                : (tournament.rounds?.length || 0)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};