import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import Icon from '@/components/ui/icon';
import type { City } from '@/types';

interface Club {
  id: number;
  name: string;
  city: string;
  created_at: string;
}

interface ClubsManagementProps {
  cities: City[];
}

export const ClubsManagement: React.FC<ClubsManagementProps> = ({ cities }) => {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [newClub, setNewClub] = useState({
    name: '',
    city: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        'https://functions.poehali.dev/2adee2e5-a74d-4e01-b240-228c00c11820'
      );
      
      if (!response.ok) {
        throw new Error('Failed to load clubs');
      }
      
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('Load clubs error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить список клубов',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddClub = async () => {
    if (!newClub.name.trim() || !newClub.city) {
      toast({
        title: 'Ошибка',
        description: 'Заполните все поля',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(
        'https://functions.poehali.dev/10326b0a-e045-4216-aa29-bc5affe080e7',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: newClub.name.trim(),
            city: newClub.city,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to add club');
      }

      toast({
        title: 'Успешно',
        description: 'Клуб добавлен',
      });

      setNewClub({ name: '', city: '' });
      setIsDialogOpen(false);
      loadClubs();
    } catch (error) {
      console.error('Add club error:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось добавить клуб',
        variant: 'destructive',
      });
    }
  };

  const filteredClubs = clubs.filter((club) => {
    const matchesSearch = club.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCity = selectedCity === 'all' || club.city === selectedCity;
    return matchesSearch && matchesCity;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Загрузка клубов...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Управление клубами</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить клуб
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Добавить новый клуб</DialogTitle>
                  <DialogDescription>
                    Заполните информацию о новом клубе
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div>
                    <Label htmlFor="club-name">Название клуба</Label>
                    <Input
                      id="club-name"
                      value={newClub.name}
                      onChange={(e) =>
                        setNewClub({ ...newClub, name: e.target.value })
                      }
                      placeholder="Введите название клуба"
                    />
                  </div>
                  <div>
                    <Label htmlFor="club-city">Город</Label>
                    <Select
                      value={newClub.city}
                      onValueChange={(value) =>
                        setNewClub({ ...newClub, city: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите город" />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.name}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button onClick={handleAddClub} className="flex-1">
                      Добавить
                    </Button>
                    <Button
                      onClick={() => setIsDialogOpen(false)}
                      variant="outline"
                      className="flex-1"
                    >
                      Отмена
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Input
                placeholder="Поиск по названию..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={selectedCity} onValueChange={setSelectedCity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Все города" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все города</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city.id} value={city.name}>
                    {city.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredClubs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery || selectedCity !== 'all'
                ? 'Клубы не найдены'
                : 'Нет клубов'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClubs.map((club) => (
                <div
                  key={club.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Icon name="Building2" size={24} className="text-primary" />
                    <div>
                      <div className="font-semibold">{club.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {club.city}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Добавлен: {new Date(club.created_at).toLocaleDateString('ru-RU')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};