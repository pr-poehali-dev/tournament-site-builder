import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';

interface LoginFormProps {
  loginForm: {
    username: string;
    password: string;
  };
  handleLoginUsernameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleLoginPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  login: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  loginForm,
  handleLoginUsernameChange,
  handleLoginPasswordChange,
  login
}) => (
  <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-center">
          <Icon name="Shield" size={20} className="mr-2" />
          Вход в систему
        </CardTitle>
        <CardDescription className="text-center">
          Войдите для доступа к турнирной системе
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="username">Имя пользователя</Label>
          <Input
            id="username"
            value={loginForm.username}
            onChange={handleLoginUsernameChange}
            placeholder="admin"
          />
        </div>
        <div>
          <Label htmlFor="password">Пароль</Label>
          <Input
            id="password"
            type="password"
            value={loginForm.password}
            onChange={handleLoginPasswordChange}
            placeholder="admin"
            onKeyPress={(e) => e.key === 'Enter' && login()}
          />
        </div>
        <Button onClick={login} className="w-full">
          <Icon name="LogIn" size={16} className="mr-2" />
          Войти
        </Button>
        <div className="text-xs text-muted-foreground text-center">
          Для тестирования: admin / admin
        </div>
      </CardContent>
    </Card>
  </div>
);