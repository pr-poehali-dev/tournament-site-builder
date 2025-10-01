export const saveToLocalStorage = <T>(key: string, data: T): void => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
  } catch {
    // Silent fail - localStorage not available
  }
};

export const loadFromLocalStorage = <T>(
  key: string,
  defaultValue: T,
): T => {
  try {
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    return JSON.parse(serializedData) as T;
  } catch {
    return defaultValue;
  }
};