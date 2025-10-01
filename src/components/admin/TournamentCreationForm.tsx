import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import Icon from "@/components/ui/icon";

interface TournamentCreationFormProps {
  newTournamentName: string;
  setNewTournamentName: (value: string) => void;
  newTournamentType: 'top' | 'swiss';
  setNewTournamentType: (value: 'top' | 'swiss') => void;
  createTournament: () => void;
  loading: boolean;
}

export const TournamentCreationForm: React.FC<TournamentCreationFormProps> = ({
  newTournamentName,
  setNewTournamentName,
  newTournamentType,
  setNewTournamentType,
  createTournament,
  loading,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Plus" size={20} />
          Создать турнир (БД)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label>Название турнира</Label>
            <Input
              value={newTournamentName}
              onChange={(e) => setNewTournamentName(e.target.value)}
              placeholder="Введите название..."
            />
          </div>
          <div>
            <Label>Тип</Label>
            <Select
              value={newTournamentType}
              onValueChange={(value: 'top' | 'swiss') => setNewTournamentType(value)}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">TOP</SelectItem>
                <SelectItem value="swiss">Swiss</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={createTournament} disabled={loading}>
            Создать
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
