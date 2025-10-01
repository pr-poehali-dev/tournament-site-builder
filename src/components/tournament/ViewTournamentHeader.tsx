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
  const judge = appState.users.find((u) => u.id === tournament.judgeId);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Icon name="Trophy" size={20} />
              {tournament.name}
              {tournament.confirmed && (
                <Badge variant="secondary">Подтверждён</Badge>
              )}
            </CardTitle>
            <CardDescription>
              {tournament.date} • {tournament.city} •{" "}
              {tournament.participants.length} участников
            </CardDescription>
          </div>
          <Button
            variant="outline"
            onClick={() => navigateTo("my-tournaments")}
          >
            <Icon name="ArrowLeft" size={16} className="mr-2" />
            Назад
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Формат</div>
            <div className="font-medium">
              {tournament.swissRounds > 0 && tournament.topRounds > 0
                ? `Швейцарка ${tournament.swissRounds} + Топ ${tournament.topRounds}`
                : tournament.swissRounds > 0
                  ? `Швейцарка ${tournament.swissRounds} туров`
                  : `Плей-офф ${tournament.topRounds} туров`}
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
                tournament.status === "completed" ? "secondary" : "default"
              }
            >
              {tournament.status === "completed"
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
          <div>
            <div className="text-muted-foreground">Туров проведено</div>
            <div className="font-medium">
              {tournament.rounds?.length || 0}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
