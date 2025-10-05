import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AppState } from "@/types";

interface PairingsEditorProps {
  isEditingPairings: boolean;
  editingRoundId: string | null;
  tempMatches: any[];
  appState: AppState;
  setIsEditingPairings: React.Dispatch<React.SetStateAction<boolean>>;
  setEditingRoundId: React.Dispatch<React.SetStateAction<string | null>>;
  setTempMatches: React.Dispatch<React.SetStateAction<any[]>>;
  updateRoundMatches: (tournamentId: string, roundId: string, matches: any[]) => void;
}

export const PairingsEditor: React.FC<PairingsEditorProps> = ({
  isEditingPairings,
  editingRoundId,
  tempMatches,
  appState,
  setIsEditingPairings,
  setEditingRoundId,
  setTempMatches,
  updateRoundMatches,
}) => {
  if (!isEditingPairings) return null;

  const tournament = appState.tournaments.find((t) =>
    t.rounds?.some((r) => r.id === editingRoundId),
  );
  const editingRound = tournament?.rounds?.find(
    (r) => r.id === editingRoundId,
  );

  if (!tournament || !editingRound) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="w-full max-w-4xl">
          <CardContent className="text-center py-4">
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
          </CardContent>
        </Card>
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
        </CardContent>
      </Card>
    </div>
  );
};
