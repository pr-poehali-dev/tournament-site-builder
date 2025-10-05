import { useCallback } from "react";
import type { AppState, User } from "@/types";

interface LoginForm {
  username: string;
  password: string;
}

export const useLoginHandlers = (
  loginForm: LoginForm,
  setLoginForm: React.Dispatch<React.SetStateAction<LoginForm>>,
  appState: AppState,
  hideLoginForm: () => void,
) => {
  const handleLoginUsernameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((prev) => ({ ...prev, username: e.target.value }));
    },
    [],
  );

  const handleLoginPasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setLoginForm((prev) => ({ ...prev, password: e.target.value }));
    },
    [],
  );

  const login = useCallback(async () => {
    try {
      const response = await fetch('https://functions.poehali.dev/c8519cb6-9df9-4faf-a146-2fedd66d1623', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (data.token) {
          localStorage.setItem('auth_token', data.token);
        }
        
        const authenticatedUser = {
          id: data.user.id.toString(),
          username: data.user.username,
          name: data.user.name,
          role: data.user.role,
          city: data.user.city || '',
          isActive: data.user.isActive,
          password: '***'
        };
        appState.currentUser = authenticatedUser;
        hideLoginForm();
        setLoginForm({ username: "", password: "" });
      } else {
        alert(data.error || "Неверные учетные данные или пользователь заблокирован");
      }
    } catch (error) {
      console.error('Login error:', error);
      alert("Ошибка подключения к серверу");
    }
  }, [loginForm, hideLoginForm]);

  return {
    handleLoginUsernameChange,
    handleLoginPasswordChange,
    login,
  };
};
