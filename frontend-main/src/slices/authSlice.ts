// src/slices/authSlice.ts
import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface AuthState {
  token: string | null;
  role: 'hr' | 'employee' | null;
  name: string | null;
  email: string | null;
}

// Load saved auth from localStorage
const storedAuth = localStorage.getItem('auth');
const parsedAuth = storedAuth ? JSON.parse(storedAuth) : null;

const initialState: AuthState = {
  token: parsedAuth?.token || null,
  role: parsedAuth?.role || null,
  name: parsedAuth?.name || null,
  email: parsedAuth?.email || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (
      state,
      action: PayloadAction<{
        token: string;
        role: 'hr' | 'employee';
        name: string;
        email: string;
      }>
    ) => {
      const { token, role, name, email } = action.payload;
      state.token = token;
      state.role = role;
      state.name = name;
      state.email = email;

      // Save to localStorage
      localStorage.setItem('auth', JSON.stringify({ token, role, name, email }));
    },

    logout: (state) => {
      state.token = null;
      state.role = null;
      state.name = null;
      state.email = null;

      // Clear localStorage
      localStorage.removeItem('auth');
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
