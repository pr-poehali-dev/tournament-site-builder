import React, { useState, useMemo, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { User, City } from '@/types';

interface SimpleJudgeSearchProps {
  users: User[];
  cities: City[];
  selectedJudgeId: string;
  onJudgeChange: (judgeId: string) => void;
  placeholder?: string;
  defaultCityFilter?: string;
}

export const SimpleJudgeSearch: React.FC<SimpleJudgeSearchProps> = ({
  users,
  cities,
  selectedJudgeId,
  onJudgeChange,
  placeholder = "Поиск судьи...",
  defaultCityFilter
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState(defaultCityFilter || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Обновляем фильтр города при изменении defaultCityFilter
  useEffect(() => {
    if (defaultCityFilter !== undefined) {
      setCityFilter(defaultCityFilter);
    }
  }, [defaultCityFilter]);

  const availableJudges = useMemo(() => {
    let filtered = users.filter(u => 
      u.role === 'judge' || u.role === 'admin'
    );
    
    if (cityFilter) {
      filtered = filtered.filter(u => u.city === cityFilter);
    }
    
    return filtered;
  }, [users, cityFilter]);

  const filteredJudges = useMemo(() => 
    availableJudges.filter(judge =>
      judge.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (judge.city && judge.city.toLowerCase().includes(searchTerm.toLowerCase()))
    ),
    [availableJudges, searchTerm]
  );

  const selectedJudge = useMemo(() => 
    users.find(u => u.id === selectedJudgeId),
    [users, selectedJudgeId]
  );

  const handleSelectJudge = (judge: User) => {
    onJudgeChange(judge.id);
    setSearchTerm('');
    setIsDropdownOpen(false);
  };

  const handleClearJudge = () => {
    onJudgeChange('');
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Поисковая строка и фильтр городов */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={selectedJudge ? selectedJudge.name : placeholder}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setIsDropdownOpen(e.target.value.length > 0);
            }}
            onFocus={() => setIsDropdownOpen(searchTerm.length > 0)}
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
            const judgesInCity = users.filter(u => 
              (u.role === 'judge' || u.role === 'admin') && 
              u.city === city.name
            ).length;
            
            return (
              <option key={city.id} value={city.name}>
                {city.name} ({judgesInCity})
              </option>
            );
          })}
        </select>
      </div>

      {/* Результаты поиска */}
      {isDropdownOpen && searchTerm.length > 0 && (
        <div className="border rounded-lg max-h-48 overflow-y-auto relative z-10">
          {filteredJudges.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              <Icon name="Search" size={24} className="mx-auto mb-2 opacity-50" />
              <p>Судьи не найдены</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredJudges.slice(0, 10).map((judge) => (
                <button
                  key={judge.id}
                  type="button"
                  className="w-full p-3 text-left hover:bg-accent rounded transition-colors"
                  onClick={() => handleSelectJudge(judge)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{judge.name}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <span>{judge.city || 'Город не указан'}</span>
                        <span>•</span>
                        <span>{judge.username}</span>
                        <Badge 
                          variant={judge.role === 'admin' ? 'default' : 'secondary'} 
                          className="text-xs px-1 py-0 ml-2"
                        >
                          {judge.role === 'admin' ? 'Админ' : 'Судья'}
                        </Badge>
                      </div>
                    </div>
                    <Icon name="Check" size={16} className="text-muted-foreground" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Выбранный судья */}
      {selectedJudge && (
        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">
            Судья турнира:
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="default" 
              className="flex items-center gap-2 pr-1 pl-3 py-2"
            >
              <Icon name="Gavel" size={14} className="text-primary" />
              <span className="font-medium">{selectedJudge.name}</span>
              {selectedJudge.city && (
                <span className="text-xs opacity-75">• {selectedJudge.city}</span>
              )}
              <Badge 
                variant={selectedJudge.role === 'admin' ? 'secondary' : 'outline'} 
                className="text-xs ml-1"
              >
                {selectedJudge.role === 'admin' ? 'Админ' : 'Судья'}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground ml-2"
                onClick={handleClearJudge}
              >
                <Icon name="X" size={12} />
              </Button>
            </Badge>
          </div>
        </div>
      )}
    </div>
  );
};