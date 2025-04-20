export type UserRole = 'admin' | 'volunteer' | 'kitchen';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}
