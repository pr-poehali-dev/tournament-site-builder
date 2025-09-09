import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import type { AppState, Page } from '@/types';

interface NavigationHeaderProps {
  appState: AppState;
  navigateTo: (page: Page) => void;
  logout: () => void;
  showLoginForm: () => void;
}

export const NavigationHeader: React.FC<NavigationHeaderProps> = ({
  appState,
  navigateTo,
  logout,
  showLoginForm
}) => (
  <div className="flex items-center justify-between mb-8 bg-card p-4 rounded-lg shadow-sm border">
    <div className="flex items-center gap-4">
      <Icon name="Trophy" size={24} className="text-primary" />
      <h1 className="text-2xl font-bold text-foreground">Турнирная система</h1>
    </div>
    <div className="flex items-center gap-4">
      {appState.currentUser ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              <span>{appState.currentUser.name}</span>
              <Badge variant="outline" className="text-xs">
                {appState.currentUser.role === 'admin' ? 'Админ' : 
                 appState.currentUser.role === 'judge' ? 'Судья' : 'Игрок'}
              </Badge>
              <Icon name="ChevronDown" size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={() => navigateTo('rating')}>
              <Icon name="Award" size={16} className="mr-2" />
              Рейтинг
            </DropdownMenuItem>
            {appState.currentUser.role === 'admin' && (
              <DropdownMenuItem onClick={() => navigateTo('admin')}>
                <Icon name="Settings" size={16} className="mr-2" />
                Админка
              </DropdownMenuItem>
            )}
            {appState.currentUser.role === 'admin' && (
              <DropdownMenuItem onClick={() => navigateTo('cities')}>
                <Icon name="MapPin" size={16} className="mr-2" />
                Города
              </DropdownMenuItem>
            )}
            {appState.currentUser.role === 'admin' && (
              <DropdownMenuItem onClick={() => navigateTo('formats')}>
                <Icon name="Layers" size={16} className="mr-2" />
                Форматы турниров
              </DropdownMenuItem>
            )}
            {(appState.currentUser.role === 'admin' || appState.currentUser.role === 'judge') && (
              <DropdownMenuItem onClick={() => navigateTo('tournaments')}>
                <Icon name="Trophy" size={16} className="mr-2" />
                Турниры
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => navigateTo('my-tournaments')}>
              <Icon name="User" size={16} className="mr-2" />
              Мои турниры
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigateTo('profile')}>
              <Icon name="UserCog" size={16} className="mr-2" />
              Профиль
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-red-600">
              <Icon name="LogOut" size={16} className="mr-2" />
              Выход
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={showLoginForm} variant="default">
          <Icon name="LogIn" size={16} className="mr-2" />
          Вход
        </Button>
      )}
    </div>
  </div>
);