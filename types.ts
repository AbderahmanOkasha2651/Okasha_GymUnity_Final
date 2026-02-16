export interface NavItem {
  label: string;
  href: string;
  hasNotification?: boolean;
}

export type UserRole = 'member' | 'coach' | 'seller';

export interface Product {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  sellerId?: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  password: string;
}
