import { writable } from 'svelte/store';

export type User = {
  id: string;
  username: string;
  email: string;
  token: string; 
} | null;

export const user = writable<User>(null);

export const setUser = (userData: User) => {
  user.set(userData);
};

export const clearUser = () => {
  user.set(null);
};

export const updateUser = (updatedData: Partial<User>) => {
  user.update(currentUser => {
    if (currentUser) {
      return { ...currentUser, ...updatedData };
    }
    return currentUser;
  });
};

const userStore = {
  subscribe: user.subscribe,
  setUser,
  clearUser,
  updateUser
};

export default userStore;