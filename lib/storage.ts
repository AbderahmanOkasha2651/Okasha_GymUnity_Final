import { Product, User, UserRole } from '../types';

const USERS_KEY = 'gymunity_users';
const CURRENT_USER_KEY = 'gymunity_current_user';
const PRODUCTS_KEY = 'gymunity_products';

const isBrowser = typeof window !== 'undefined';

const defaultProducts: Product[] = [
  {
    id: 'p-1',
    name: 'Performance Training Plan',
    price: 29,
    imageUrl:
      'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'p-2',
    name: 'GymUnity Protein Pack',
    price: 39,
    imageUrl:
      'https://images.unsplash.com/photo-1517838277536-f5f99be5013c?q=80&w=1200&auto=format&fit=crop',
  },
  {
    id: 'p-3',
    name: 'Mobility Session Bundle',
    price: 19,
    imageUrl:
      'https://images.unsplash.com/photo-1599058918144-1ffabb6ab9a0?q=80&w=1200&auto=format&fit=crop',
  },
];

const readJSON = <T,>(key: string, fallback: T): T => {
  if (!isBrowser) {
    return fallback;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const writeJSON = <T,>(key: string, value: T) => {
  if (!isBrowser) {
    return;
  }
  window.localStorage.setItem(key, JSON.stringify(value));
};

export const loadUsers = (): User[] => readJSON<User[]>(USERS_KEY, []);

export const saveUsers = (users: User[]) => {
  writeJSON(USERS_KEY, users);
};

export const getCurrentUser = (): User | null =>
  readJSON<User | null>(CURRENT_USER_KEY, null);

export const setCurrentUser = (user: User | null) => {
  writeJSON(CURRENT_USER_KEY, user);
};

export const registerUser = (payload: {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: UserRole;
}): User => {
  const users = loadUsers();
  const existing = users.find(
    (user) => user.email.toLowerCase() === payload.email.toLowerCase()
  );
  if (existing) {
    throw new Error('Email already registered.');
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
    email: payload.email.trim(),
    role: payload.role,
    password: payload.password,
  };

  const nextUsers = [newUser, ...users];
  saveUsers(nextUsers);
  setCurrentUser(newUser);
  return newUser;
};

export const authenticateUser = (email: string, password: string): User => {
  const users = loadUsers();
  const user = users.find(
    (item) =>
      item.email.toLowerCase() === email.toLowerCase() &&
      item.password === password
  );

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  setCurrentUser(user);
  return user;
};

export const logoutUser = () => {
  setCurrentUser(null);
};

export const loadProducts = (): Product[] => {
  const stored = readJSON<Product[]>(PRODUCTS_KEY, []);
  if (stored.length > 0) {
    return stored;
  }
  writeJSON(PRODUCTS_KEY, defaultProducts);
  return defaultProducts;
};

export const saveProducts = (products: Product[]) => {
  writeJSON(PRODUCTS_KEY, products);
};
