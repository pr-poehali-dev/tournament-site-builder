import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { User, City } from '@/types';

interface PlayerSearchProps {
  players: User[];
  cities: City[];
  selectedPlayerIds: string[];
  onPlayersChange: (playerIds: string[]) => void;
  placeholder?: string;
  defaultCityFilter?: string;
}

export const PlayerSearch: React.FC<PlayerSearchProps> = ({
  players,
  cities,
  selectedPlayerIds,
  onPlayersChange,
  placeholder = "Поиск игроков...",
  defaultCityFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [cityFilter, setCityFilter] = useState(defaultCityFilter || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const availablePlayers = useMemo(() => {
    let filtered = players.filter(p => 
      (p.role === 'player' || p.role === 'judge') && 
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обновляем фильтр города при изменении defaultCityFilter
  useEffect(() => {
    if (defaultCityFilter !== undefined) {
      setCityFilter(defaultCityFilter);
    }
  }, [defaultCityFilter]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    setIsOpen(value.length > 0);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => Math.min(prev + 1, filteredPlayers.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => Math.max(prev - 1, -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && filteredPlayers[focusedIndex]) {
          handleAddPlayer(filteredPlayers[focusedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setFocusedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  const handleAddPlayer = (player: User) => {
    onPlayersChange([...selectedPlayerIds, player.id]);
    setSearchTerm('');
    setIsOpen(false);
    setFocusedIndex(-1);
    inputRef.current?.focus();
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(selectedPlayerIds.filter(id => id !== playerId));
  };

  const handleInputFocus = () => {
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  return (
    <div className="space-y-3">
      {/* Поисковая строка с фильтром городов */}
      <div className="flex gap-2">
        <div ref={containerRef} className="relative flex-1">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={searchTerm}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyDown={handleKeyDown}
              className="pl-10"
              autoComplete="off"
            />
            <Icon 
              name="Search" 
              size={16} 
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" 
            />
          </div>

          {/* Выпадающий список */}
          {isOpen && filteredPlayers.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg max-h-64 overflow-y-auto">
              {filteredPlayers.map((player, index) => (
                <button
                  key={player.id}
                  type="button"
                  className={`w-full px-4 py-3 text-left hover:bg-accent focus:bg-accent focus:outline-none transition-colors ${
                    index === focusedIndex ? 'bg-accent' : ''
                  }`}
                  onClick={() => handleAddPlayer(player)}
                  onMouseEnter={() => setFocusedIndex(index)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{player.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{player.city || 'Город не указан'}</span>
                        <span>•</span>
                        <span>{player.username}</span>
                        <span>•</span>
                        <Badge 
                          variant={player.role === 'judge' ? 'secondary' : 'outline'} 
                          className="text-xs px-1 py-0"
                        >
                          {player.role === 'judge' ? 'Судья' : 'Игрок'}
                        </Badge>
                      </div>
                    </div>
                    <Icon name="Plus" size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Сообщение если никого не найдено */}
          {isOpen && searchTerm.length > 0 && filteredPlayers.length === 0 && (
            <div className="absolute z-50 w-full mt-1 bg-background border border-input rounded-md shadow-lg p-4 text-center text-muted-foreground">
              <Icon name="Search" size={24} className="mx-auto mb-2 opacity-50" />
              <p>Игроки не найдены</p>
              <p className="text-sm mt-1">Попробуйте изменить поисковый запрос или город</p>
            </div>
          )}
        </div>

        {/* Фильтр по городам */}
        <Select value={cityFilter} onValueChange={setCityFilter}>
          <SelectTrigger className="w-48">
            <Icon name="MapPin" size={16} className="mr-2" />
            <SelectValue placeholder="Все города" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">
              <div className="flex items-center">
                <Icon name="Globe" size={14} className="mr-2" />
                Все города
              </div>
            </SelectItem>
            {cities.map(city => {
              const playersInCity = players.filter(p => 
                (p.role === 'player' || p.role === 'judge') && 
                p.city === city.name && 
                !selectedPlayerIds.includes(p.id)
              ).length;
              
              return (
                <SelectItem key={city.id} value={city.name}>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center">
                      <Icon name="MapPin" size={14} className="mr-2" />
                      {city.name}
                    </div>
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {playersInCity}
                    </Badge>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>

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
                  variant={player.role === 'judge' ? 'secondary' : 'outline'} 
                  className="text-xs ml-1"
                >
                  {player.role === 'judge' ? 'Судья' : 'Игрок'}
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