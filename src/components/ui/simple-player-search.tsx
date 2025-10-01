import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { User, City } from '@/types';

interface SimplePlayerSearchProps {
  players: User[];
  cities: City[];
  selectedPlayerIds: string[];
  onPlayersChange: (playerIds: string[]) => void;
  placeholder?: string;
  defaultCityFilter?: string;
}

export const SimplePlayerSearch: React.FC<SimplePlayerSearchProps> = ({
  players,
  cities,
  selectedPlayerIds,
  onPlayersChange,
  placeholder = "Поиск игроков...",
  defaultCityFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState(defaultCityFilter || '');

  // Обновляем фильтр города при изменении defaultCityFilter
  useEffect(() => {
    if (defaultCityFilter !== undefined) {
      setCityFilter(defaultCityFilter);
    }
  }, [defaultCityFilter]);

  const availablePlayers = useMemo(() => {
    let filtered = players.filter(p => 
      (p.role === 'player' || p.role === 'judge' || p.role === 'admin') && 
      !selectedPlayerIds.includes(p.id)
    );
    
    if (cityFilter) {
      filtered = filtered.filter(p => p.city === cityFilter);
    }
    
    return filtered;
  }, [players, selectedPlayerIds, cityFilter]);

  const filteredPlayers = useMemo(() => 
    availablePlayers.filter(player =>
      player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.city && player.city.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [availablePlayers, searchTerm]
  );

  const selectedPlayers = useMemo(() => 
    players.filter(p => selectedPlayerIds.includes(p.id)),
    [players, selectedPlayerIds]
  );

  const handleAddPlayer = (player: User) => {
    onPlayersChange([...selectedPlayerIds, player.id]);
    setSearchTerm('');
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(selectedPlayerIds.filter(id => id !== playerId));
  };

  return (
    <div className="space-y-4">
      {/* Поисковая строка и фильтр городов */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            autoComplete="off"
          />
          <Icon 
            name="Search" 
            size={16} 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
          />
        </div>

        {/* Простой селект городов */}
        <select
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
          className="w-48 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Все города</option>
          {cities.map(city => {
            const playersInCity = players.filter(p => 
              (p.role === 'player' || p.role === 'judge' || p.role === 'admin') && 
              p.city === city.name && 
              !selectedPlayerIds.includes(p.id)
            ).length;
            
            return (
              <option key={city.id} value={city.name}>
                {city.name} ({playersInCity})
              </option>
            );
          })}
        </select>
      </div>

      {/* Результаты поиска */}
      {searchTerm.length > 0 && (
        <div className="border rounded-lg max-h-48 overflow-y-auto">
          {filteredPlayers.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Icon name="Search" size={24} className="mx-auto mb-2 opacity-50" />
              <p>Игроки не найдены</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredPlayers.slice(0, 10).map((player) => (
                <button
                  key={player.id}
                  type="button"
                  className="w-full p-3 text-left hover:bg-accent rounded transition-colors"
                  onClick={() => handleAddPlayer(player)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{player.city || 'Город не указан'}</span>
                        <span>•</span>
                        <span>{player.username}</span>
                        <Badge 
                          variant={player.role === 'player' ? 'outline' : 'secondary'} 
                          className="text-xs px-1 py-0 ml-2"
                        >
                          {player.role === 'judge' ? 'Судья' : player.role === 'admin' ? 'Админ' : 'Игрок'}
                        </Badge>
                      </div>
                    </div>
                    <Icon name="Plus" size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Выбранные игроки */}
      {selectedPlayers.length > 0 && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Выбранные участники ({selectedPlayers.length}):
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedPlayers.map((player) => (
              <Badge 
                key={player.id} 
                variant="secondary" 
                className="flex items-center gap-2 pr-1 pl-3 py-1"
              >
                <span className="font-medium">{player.name}</span>
                {player.city && (
                  <span className="text-xs opacity-75">• {player.city}</span>
                )}
                <Badge 
                  variant={player.role === 'player' ? 'outline' : 'secondary'} 
                  className="text-xs ml-1"
                >
                  {player.role === 'judge' ? 'Судья' : player.role === 'admin' ? 'Админ' : 'Игрок'}
                </Badge>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => handleRemovePlayer(player.id)}
                >
                  <Icon name="X" size={12} />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Быстрые действия */}
      {selectedPlayerIds.length > 0 && (
        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPlayersChange([])}
            className="text-xs"
          >
            <Icon name="X" size={12} className="mr-1" />
            Очистить все
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => onPlayersChange([...selectedPlayerIds, ...availablePlayers.map(p => p.id)])}
            className="text-xs"
            disabled={availablePlayers.length === 0}
          >
            <Icon name="Users" size={12} className="mr-1" />
            Добавить всех ({availablePlayers.length})
          </Button>
        </div>
      )}
    </div>
  );
};