import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import type { AppState } from '@/types';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
}

interface TournamentManagementPageProps {
  appState: AppState;
}

export const TournamentManagementPage: React.FC<TournamentManagementPageProps> = ({ appState }) => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await fetch(
        'https://functions.poehali.dev/8a52c439-d181-4ec4-a56f-98614012bf45'
      );
      const data = await response.json();
      setTournaments(data);
    } catch (error) {
      console.error('Load error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить турниры',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tournamentId: number, tournamentName: string) => {
    if (!confirm(`Вы уверены, что хотите удалить турнир "${tournamentName}"? Все паринги будут удалены.`)) {
      return;
    }

    try {
      const response = await fetch(
        'https://functions.poehali.dev/04b06a3d-149f-4a4c-8754-defa21ff87f3',
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'X-User-Id': appState.currentUser?.id || '',
          },
          body: JSON.stringify({ tournament_id: tournamentId }),
        }
      );

      if (response.ok) {
        toast({
          title: 'Успешно',
          description: `Турнир "${tournamentName}" удалён`,
        });
        loadTournaments();
      } else {
        const error = await response.json();
        toast({
          title: 'Ошибка',
          description: error.error || 'Не удалось удалить турнир',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить турнир',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Управление турнирами</h1>

      <Card>
        <CardHeader>
          <CardTitle>Список турниров</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tournaments.length === 0 ? (
              <p className="text-muted-foreground">Нет турниров</p>
            ) : (
              tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border"
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">
                      {tournament.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(tournament.date).toLocaleDateString('ru-RU')} • 
                      Статус: {tournament.status === 'confirmed' ? 'Подтверждён' : tournament.status === 'completed' ? 'Завершён' : 'Черновик'}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleDelete(tournament.id, tournament.name)}
                    variant="destructive"
                    size="sm"
                  >
                    <Icon name="Trash2" size={16} className="mr-2" />
                    Удалить
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
