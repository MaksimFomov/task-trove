/**
 * Утилита для сохранения и восстановления состояния в localStorage
 * Сохраняет состояние при изменении и восстанавливает при загрузке страницы
 */

/**
 * Сохраняет значение в localStorage с ключом, специфичным для страницы
 */
export function saveState<T>(pageKey: string, key: string, value: T): void {
  try {
    const storageKey = `${pageKey}_${key}`;
    localStorage.setItem(storageKey, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save state for ${pageKey}_${key}:`, error);
  }
}

/**
 * Восстанавливает значение из localStorage
 */
export function loadState<T>(pageKey: string, key: string, defaultValue: T): T {
  try {
    const storageKey = `${pageKey}_${key}`;
    const item = localStorage.getItem(storageKey);
    if (item === null) {
      return defaultValue;
    }
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Failed to load state for ${pageKey}_${key}:`, error);
    return defaultValue;
  }
}

/**
 * Удаляет сохраненное состояние
 */
export function clearState(pageKey: string, key: string): void {
  try {
    const storageKey = `${pageKey}_${key}`;
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Failed to clear state for ${pageKey}_${key}:`, error);
  }
}

/**
 * Сохраняет несколько значений одновременно
 */
export function saveMultipleStates(pageKey: string, states: Record<string, any>): void {
  Object.entries(states).forEach(([key, value]) => {
    saveState(pageKey, key, value);
  });
}

/**
 * Восстанавливает несколько значений одновременно
 */
export function loadMultipleStates<T extends Record<string, any>>(
  pageKey: string,
  defaults: T
): T {
  const result = { ...defaults };
  Object.keys(defaults).forEach((key) => {
    result[key] = loadState(pageKey, key, defaults[key]);
  });
  return result;
}

