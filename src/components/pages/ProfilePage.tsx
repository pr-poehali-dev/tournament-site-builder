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
    city: string;
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  };
  handleProfileCityChange: (value: string) => void;
  handleProfileCurrentPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfileNewPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleProfileConfirmPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  updateProfile: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  appState,
  profileEdit,
  handleProfileCityChange,
  handleProfileCurrentPasswordChange,
  handleProfileNewPasswordChange,
  handleProfileConfirmPasswordChange,
  updateProfile
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
              <div className="text-muted-foreground">Имя пользователя</div>
              <div className="font-medium">@{appState.currentUser?.username}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Полное имя</div>
              <div className="font-medium">{appState.currentUser?.name}</div>
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

        <div className="space-y-4">
          <h3 className="text-lg font-medium">Редактирование профиля</h3>
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
                <Label htmlFor="current-password">Текущий пароль</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={profileEdit.currentPassword}
                  onChange={handleProfileCurrentPasswordChange}
                  placeholder="Введите текущий пароль"
                />
              </div>
              <div>
                <Label htmlFor="new-password">Новый пароль</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={profileEdit.newPassword}
                  onChange={handleProfileNewPasswordChange}
                  placeholder="Введите новый пароль"
                />
              </div>
              <div>
                <Label htmlFor="confirm-password">Подтвердите пароль</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={profileEdit.confirmPassword}
                  onChange={handleProfileConfirmPasswordChange}
                  placeholder="Повторите новый пароль"
                />
              </div>
            </div>
            
            <Button onClick={updateProfile} className="w-fit">
              <Icon name="Save" size={16} className="mr-2" />
              Сохранить изменения
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);