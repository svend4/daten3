/**
 * User Test Fixtures
 */

export const validUserData = {
  email: 'test@example.com',
  username: 'testuser',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
};

export const adminUserData = {
  email: 'admin@example.com',
  username: 'adminuser',
  password: 'AdminPassword123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
};

export const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  role: 'user',
  isEmailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockAdmin = {
  id: 'admin-123',
  email: 'admin@example.com',
  username: 'adminuser',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin',
  isEmailVerified: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

export const mockUsers = [
  mockUser,
  mockAdmin,
  {
    id: 'user-456',
    email: 'user2@example.com',
    username: 'testuser2',
    firstName: 'Test2',
    lastName: 'User2',
    role: 'user',
    isEmailVerified: false,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
  },
];
