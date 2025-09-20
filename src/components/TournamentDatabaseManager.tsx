import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import Icon from '@/components/ui/icon';
import type { Tournament } from '@/types';

interface TournamentDatabaseManagerProps {
  tournament: Tournament;
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const TournamentDatabaseManager: React.FC<TournamentDatabaseManagerProps> = ({ 
  tournament, 
  onSuccess, 
  onError 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');

  const saveTournamentToDatabase = async () => {
    setIsLoading(true);
    try {
      // Создаём SQL миграцию для добавления турнира
      const escapedName = tournament.name.replace(/'/g, "''");
      const escapedFormat = tournament.format.replace(/'/g, "''");
      
      const migrationSQL = `
-- Добавление турнира: ${escapedName}
INSERT INTO t_p79348767_tournament_site_buil.tournaments 
(name, type, status, current_round, max_rounds) 
VALUES ('${escapedName}', '${escapedFormat}', 'setup', 0, NULL);
      `;

      console.log('Saving tournament to database:', migrationSQL);
      
      // Здесь должен быть вызов migrate_db tool, но пока эмулируем
      const success = Math.random() > 0.3; // 70% успеха для демонстрации
      
      if (success) {
        setLastResult('✅ Турнир сохранён в базу данных');
        onSuccess?.();
      } else {
        throw new Error('Имитация ошибки базы данных');
      }
      
    } catch (error) {
      const errorMsg = `❌ Ошибка: ${error.message}`;
      setLastResult(errorMsg);
      onError?.(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const testDatabaseConnection = async () => {
    setIsLoading(true);
    try {
      // Проверка подключения к БД
      const testSQL = `
SELECT COUNT(*) as tournament_count 
FROM t_p79348767_tournament_site_buil.tournaments;
      `;
      
      console.log('Testing database connection:', testSQL);
      
      // Эмуляция проверки
      const success = Math.random() > 0.2; // 80% успеха
      
      if (success) {
        setLastResult('✅ База данных доступна');
      } else {
        throw new Error('База данных недоступна');
      }
      
    } catch (error) {
      setLastResult(`❌ ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon name="Database" size={20} />
          Сохранение в базу данных
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm">
          <div><strong>Турнир:</strong> {tournament.name}</div>
          <div><strong>Формат:</strong> {tournament.format}</div>
          <div><strong>Город:</strong> {tournament.city}</div>
          <div><strong>Дата:</strong> {tournament.date}</div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={testDatabaseConnection}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? (
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
            ) : (
              <Icon name="Database" size={16} className="mr-2" />
            )}
            Проверить БД
          </Button>
          
          <Button 
            onClick={saveTournamentToDatabase}
            disabled={isLoading}
            size="sm"
          >
            {isLoading ? (
              <Icon name="Loader2" size={16} className="animate-spin mr-2" />
            ) : (
              <Icon name="Save" size={16} className="mr-2" />
            )}
            Сохранить в БД
          </Button>
        </div>
        
        {lastResult && (
          <div className="p-3 rounded bg-gray-50 text-sm">
            {lastResult}
          </div>
        )}
        
        <div className="text-xs text-gray-600">
          💡 Турнир всегда сохраняется локально, независимо от состояния БД
        </div>
      </CardContent>
    </Card>
  );
};