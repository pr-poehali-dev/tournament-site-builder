import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';

interface Tournament {
  id: number;
  name: string;
  date: string;
  status: string;
  games_count?: number;
}

const Admin = () => {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      navigate('/');
      return;
    }

    try {
      const response = await fetch(
        `https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${userId}`
      );
      const data = await response.json();
      
      if (data.role !== 'admin') {
        toast({
          title: 'Доступ запрещён',
          description: 'Только администраторы могут управлять турнирами',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setCurrentUser(data);
      loadTournaments();
    } catch (error) {
      console.error('Auth error:', error);
      navigate('/');
    }
  };

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
            'X-User-Id': localStorage.getItem('userId') || '',
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Загрузка...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Управление турнирами</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <Icon name="Home" size={20} className="mr-2" />
            На главную
          </Button>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Список турниров</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tournaments.length === 0 ? (
                <p className="text-white/60">Нет турниров</p>
              ) : (
                tournaments.map((tournament) => (
                  <div
                    key={tournament.id}
                    className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
                  >
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {tournament.name}
                      </h3>
                      <p className="text-sm text-white/60">
                        {new Date(tournament.date).toLocaleDateString('ru-RU')} • 
                        Статус: {tournament.status === 'confirmed' ? 'Подтверждён' : 'Завершён'}
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
    </div>
  );
};

export default Admin;
