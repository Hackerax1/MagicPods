import { writable } from 'svelte/store';

export type User = {
  id: string;
  username: string;
  email: string;
} | null;

export const user = writable<User>(null);

export const setUser = (userData: User) => {
  user.set(userData);
};

export const clearUser = () => {
  user.set(null);
};