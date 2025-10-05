import { useCallback } from "react";
import type { AppState } from "@/types";

export const useCityHandlers = (
  editingCityId: string | null,
  editingCityName: string,
  newCityName: string,
  setEditingCityId: React.Dispatch<React.SetStateAction<string | null>>,
  setEditingCityName: React.Dispatch<React.SetStateAction<string>>,
  setNewCityName: React.Dispatch<React.SetStateAction<string>>,
  appState: AppState,
  updateCity: (id: string, updates: any) => void,
  addCity: (city: any) => void,
  cityNameInputRef: React.RefObject<HTMLInputElement>,
) => {
  const startEditCity = useCallback((city: any) => {
    setEditingCityId(city.id);
    setEditingCityName(city.name);
  }, []);

  const handleEditCityNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditingCityName(e.target.value);
    },
    [],
  );

  const handleNewCityNameChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewCityName(e.target.value);
    },
    [],
  );

  const handleCityNameKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddCity();
    }
  }, []);

  const handleAddCity = useCallback(() => {
    if (newCityName.trim()) {
      const isDuplicate = appState.cities.some(
        city => city.name.toLowerCase() === newCityName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        alert("Город с таким названием уже существует");
        return;
      }
      
      addCity({
        id: `city${Date.now()}`,
        name: newCityName.trim(),
      });
      setNewCityName("");
      setTimeout(() => {
        cityNameInputRef.current?.focus();
      }, 0);
    }
  }, [newCityName, addCity, appState.cities]);

  const saveEditCity = useCallback(() => {
    if (editingCityId && editingCityName.trim()) {
      const isDuplicate = appState.cities.some(
        city => city.id !== editingCityId && city.name.toLowerCase() === editingCityName.trim().toLowerCase()
      );
      
      if (isDuplicate) {
        alert("Город с таким названием уже существует");
        return;
      }
      
      updateCity(editingCityId, { name: editingCityName.trim() });
      setEditingCityId(null);
      setEditingCityName("");
    }
  }, [editingCityId, editingCityName, updateCity, appState.cities]);

  const cancelEditCity = useCallback(() => {
    setEditingCityId(null);
    setEditingCityName("");
  }, []);

  return {
    startEditCity,
    handleEditCityNameChange,
    handleNewCityNameChange,
    handleCityNameKeyPress,
    handleAddCity,
    saveEditCity,
    cancelEditCity,
  };
};
