import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Icon from '@/components/ui/icon';
import type { AppState, City } from '@/types';

interface CitiesPageProps {
  appState: AppState;
  editingCityId: string | null;
  editingCityName: string;
  newCityName: string;
  startEditCity: (city: City) => void;
  deleteCity: (cityId: string) => void;
  handleEditCityNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleNewCityNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleCityNameKeyPress: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handleAddCity: () => void;
  saveEditCity: () => void;
  cancelEditCity: () => void;
  cityNameInputRef: React.RefObject<HTMLInputElement>;
}

export const CitiesPage: React.FC<CitiesPageProps> = ({
  appState,
  editingCityId,
  editingCityName,
  newCityName,
  startEditCity,
  deleteCity,
  handleEditCityNameChange,
  handleNewCityNameChange,
  handleCityNameKeyPress,
  handleAddCity,
  saveEditCity,
  cancelEditCity,
  cityNameInputRef
}) => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon name="MapPin" size={20} />
            Управление городами
          </CardTitle>
          <CardDescription>
            Добавляйте и редактируйте города для турнирной системы
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Форма добавления города */}
          <div className="flex gap-2">
            <input
              ref={cityNameInputRef}
              type="text"
              placeholder="Название нового города"
              value={newCityName}
              onChange={handleNewCityNameChange}
              onKeyPress={handleCityNameKeyPress}
              className="flex-1 px-3 py-2 border border-input bg-background rounded-md text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Button onClick={handleAddCity}>
              <Icon name="Plus" size={16} className="mr-2" />
              Добавить
            </Button>
          </div>

          {/* Список городов */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-muted-foreground">
              Всего городов: {appState.cities.length}
            </div>
            
            {appState.cities.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Icon name="MapPin" size={48} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">Нет городов</p>
                <p className="text-sm">Добавьте первый город выше</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {appState.cities.map((city) => (
                  <div key={city.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon name="MapPin" size={16} className="text-muted-foreground" />
                      <div>
                        <div className="font-medium">{city.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {appState.users.filter(u => u.role === 'player' && u.city === city.name).length} игроков
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => startEditCity(city)}>
                        <Icon name="Edit" size={14} />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive">
                            <Icon name="Trash2" size={14} />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Удалить город</AlertDialogTitle>
                            <AlertDialogDescription>
                              Удалить город "{city.name}"? Это действие необратимо.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteCity(city.id)} className="bg-destructive hover:bg-destructive/90">
                              Удалить
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Модальное окно редактирования */}
          {editingCityId && (
            <Card className="border-primary/50 bg-primary/5">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm font-medium">Редактирование города</div>
                  <div className="flex gap-2">
                    <Input
                      value={editingCityName}
                      onChange={handleEditCityNameChange}
                      onKeyPress={handleCityNameKeyPress}
                      placeholder="Название города"
                      className="flex-1"
                    />
                    <Button onClick={saveEditCity}>
                      <Icon name="Check" size={16} className="mr-2" />
                      Сохранить
                    </Button>
                    <Button variant="outline" onClick={cancelEditCity}>
                      <Icon name="X" size={16} className="mr-2" />
                      Отмена
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};