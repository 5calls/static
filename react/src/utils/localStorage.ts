/**
 * Checks if a value is JSON serializable.
 * @param value - The value to check.
 * @returns True if the value is JSON serializable, false otherwise.
 */
export function isJSONSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}
/**
 * Retrieves a value from localStorage by key.
 * @param key - The key of the item to retrieve.
 * @returns The parsed value from localStorage, or null if the key does not exist.
 */
export function getFromLocalStorage<T>(key: string): T | null {
  const item = localStorage.getItem(key);
  if (!item) return null;
  try {
    return JSON.parse(item);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return item as unknown as T;
  }
}

/**
 * Saves a value to localStorage under the specified key.
 * @param key - The key under which to store the value.
 * @param value - The value to store. If it's an object, it will be stringified before saving.
 */
export function setToLocalStorage<T>(key: string, value: T): void {
  const storedValue = isJSONSerializable(value)
    ? (value as unknown as string)
    : JSON.stringify(value);
  localStorage.setItem(key, storedValue);
}
