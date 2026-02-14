// User type for Supabase (maps to 'users' table)
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

// Type for creating a new user (without auto-generated fields)
export interface CreateUserInput {
  name: string;
  email: string;
}

// Type for API responses (camelCase for frontend compatibility)
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

// Transform DB row to API response format
export function toUserResponse(user: User): UserResponse {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.created_at
  };
}
