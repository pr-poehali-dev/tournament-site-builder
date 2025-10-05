import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Icon from '@/components/ui/icon';
import type { AppState } from '@/types';

interface ProfilePageProps {
  appState: AppState;
  profileEdit: {
    isEditing: boolean;
    name: string;
    password: string;
    city: string;
  };
  startEditProfile: () => void;
  handleProfileNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfilePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfileCityChange: (value: string) => void;
  saveProfile: () => void;
  cancelEditProfile: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  appState,
  profileEdit,
  startEditProfile,
  handleProfileNameChange,
  handleProfilePasswordChange,
  handleProfileCityChange,
  saveProfile,
  cancelEditProfile
}) => (
  <div className="max-w-2xl mx-auto space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Icon name="User" size={20} className="mr-2" />
          Профиль пользователя
        </CardTitle>
        <CardDescription>Управление личной информацией и настройками</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg bg-muted/50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Логин</div>
              <div className="font-medium">@{appState.currentUser?.username}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Имя</div>
              <div className="font-medium">{appState.currentUser?.name}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Город</div>
              <div className="font-medium">{appState.currentUser?.city || '—'}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Рейтинг</div>
              <div className="font-medium">
                {appState.players.find(p => p.id === appState.currentUser?.id)?.rating || 1200}
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Роль</div>
              <Badge variant="outline">
                {appState.currentUser?.role === 'admin' ? 'Администратор' : 
                 appState.currentUser?.role === 'judge' ? 'Судья' : 'Игрок'}
              </Badge>
            </div>
            <div>
              <div className="text-muted-foreground">Статус</div>
              <Badge variant={appState.currentUser?.isActive ? 'default' : 'secondary'}>
                {appState.currentUser?.isActive ? 'Активен' : 'Неактивен'}
              </Badge>
            </div>
          </div>
        </div>

        <Separator />

        {!profileEdit.isEditing ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Редактирование профиля</h3>
              <Button onClick={startEditProfile}>
                <Icon name="Edit" size={16} className="mr-2" />
                Редактировать
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Редактирование профиля</h3>
            </div>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="city">Город</Label>
                <Select value={profileEdit.city} onValueChange={handleProfileCityChange}>
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
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium">Изменить пароль</h4>
                <div>
                  <Label htmlFor="password">Новый пароль</Label>
                  <Input
                    id="password"
                    type="password"
                    value={profileEdit.password}
                    onChange={handleProfilePasswordChange}
                    placeholder="Оставьте пустым, чтобы не менять"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button onClick={saveProfile} className="w-fit">
                  <Icon name="Save" size={16} className="mr-2" />
                  Сохранить изменения
                </Button>
                <Button variant="outline" onClick={cancelEditProfile} className="w-fit">
                  Отмена
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);