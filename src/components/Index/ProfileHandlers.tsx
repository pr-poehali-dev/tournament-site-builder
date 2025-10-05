import { useCallback } from "react";
import type { AppState } from "@/types";

interface ProfileEdit {
  isEditing: boolean;
  name: string;
  password: string;
  city: string;
}

export const useProfileHandlers = (
  profileEdit: ProfileEdit,
  setProfileEdit: React.Dispatch<React.SetStateAction<ProfileEdit>>,
  appState: AppState,
) => {
  const startEditProfile = useCallback(() => {
    if (appState.currentUser) {
      setProfileEdit({
        isEditing: true,
        name: appState.currentUser.name,
        password: "",
        city: appState.currentUser.city || "",
      });
    }
  }, [appState.currentUser]);

  const handleProfileNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileEdit((prev) => ({ ...prev, name: e.target.value }));
    },
    [],
  );

  const handleProfilePasswordChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setProfileEdit((prev) => ({ ...prev, password: e.target.value }));
    },
    [],
  );

  const handleProfileCityChange = useCallback((value: string) => {
    setProfileEdit((prev) => ({ ...prev, city: value }));
  }, []);

  const saveProfile = useCallback(async () => {
    if (!appState.currentUser) return;

    try {
      const updateData: any = {
        city: profileEdit.city || null,
      };

      if (profileEdit.password && profileEdit.password.trim()) {
        updateData.password = profileEdit.password;
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(
        `https://functions.poehali.dev/d3e14bd8-3da2-4652-b8d2-e10a3f83e792?id=${appState.currentUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'X-Auth-Token': token || '',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const data = await response.json();
      console.log('✅ Профиль обновлён в БД:', data.user);

      const updatedUser = {
        ...appState.currentUser,
        city: profileEdit.city,
        ...(profileEdit.password && { password: profileEdit.password }),
      };

      const userIndex = appState.users.findIndex(
        (u) => u.id === appState.currentUser!.id,
      );
      if (userIndex !== -1) {
        appState.users[userIndex] = updatedUser;
        appState.currentUser = updatedUser;
      }

      setProfileEdit((prev) => ({ ...prev, isEditing: false }));
      alert('Профиль успешно обновлён!');
    } catch (error: any) {
      console.error('❌ Ошибка обновления профиля:', error);
      alert(`Ошибка обновления профиля: ${error.message}`);
    }
  }, [appState.currentUser, appState.users, profileEdit]);

  const cancelEditProfile = useCallback(() => {
    setProfileEdit((prev) => ({ ...prev, isEditing: false }));
  }, []);

  return {
    startEditProfile,
    handleProfileNameChange,
    handleProfilePasswordChange,
    handleProfileCityChange,
    saveProfile,
    cancelEditProfile,
  };
};
