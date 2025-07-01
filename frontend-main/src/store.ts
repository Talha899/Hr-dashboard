// File: src/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import empReducer from './slices/empSlice'; 


const store = configureStore({
  reducer: {
    auth: authReducer,
    emp: empReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export default store;
