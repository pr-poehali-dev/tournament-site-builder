import React, { useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { AppState, Player } from '@/types';

interface PlayersPageProps {
  appState: AppState;
  newPlayer: {
    name: string;
    city: string;
  };
  addPlayer: () => void;
  deletePlayer: (playerId: string) => void;
  handleNewPlayerNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNewPlayerCityChange: (value: string) => void;
  handlePlayerNameKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  playerNameInputRef: React.RefObject<HTMLInputElement>;
}

export const PlayersPage: React.FC<PlayersPageProps> = ({
  appState,
  newPlayer,
  addPlayer,
  deletePlayer,
  handleNewPlayerNameChange,
  handleNewPlayerCityChange,
  handlePlayerNameKeyPress,
  playerNameInputRef
}) => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Icon name="Users" size={20} className="mr-2" />
            Управление игроками ({appState.players.length})
          </div>
          <Button onClick={() => playerNameInputRef.current?.focus()}>
            <Icon name="UserPlus" size={16} className="mr-2" />
            Добавить игрока
          </Button>
        </CardTitle>
        <CardDescription>Создание и управление игроками</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 p-3 border rounded-lg">
          <div className="font-medium">Добавить нового игрока</div>
          <div className="flex gap-2">
            <Input
              ref={playerNameInputRef}
              placeholder="Имя игрока"
              value={newPlayer.name}
              onChange={handleNewPlayerNameChange}
              onKeyPress={handlePlayerNameKeyPress}
            />
            <Select value={newPlayer.city} onValueChange={handleNewPlayerCityChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите город" />
              </SelectTrigger>
              <SelectContent>
                {appState.cities.map(city => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={addPlayer}>
              <Icon name="Plus" size={16} />
            </Button>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {appState.players.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-3 rounded border">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[60px]">
                  <div className="text-lg font-bold text-primary">{player.rating}</div>
                  <div className="text-xs text-muted-foreground">рейтинг</div>
                </div>
                <div>
                  <div className="font-medium">{player.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {player.city && `${player.city} • `}
                    {player.tournaments} турниров • {player.wins}П/{player.losses}Пр/{player.draws}Н
                  </div>
                </div>
              </div>
              {appState.currentUser?.role === 'admin' && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="sm" variant="destructive">
                      <Icon name="Trash2" size={14} />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Удалить игрока</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы уверены что хотите удалить игрока {player.name}? Это действие нельзя отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={() => deletePlayer(player.id)}>
                        Удалить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          ))}
          {appState.players.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Icon name="Users" size={48} className="mx-auto mb-4 opacity-50" />
              <p>Пока нет игроков</p>
              <p className="text-sm mt-2">Добавьте игроков для участия в турнирах</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
);