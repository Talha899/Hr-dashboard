import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

// This file does not use React hooks, so the "Invalid hook call" error is not caused by this slice.
// Make sure you are not calling hooks (like useSelector, useDispatch, useState, etc.) outside of React function components or custom hooks.
// Also, check for multiple React versions or mismatched React/ReactDOM versions in your project as per the error message.

interface EmpState {
  emp: any; // Replace 'any' with your actual Employee type/interface
}

const initialState: EmpState = {
  emp: null,
};

const empSlice = createSlice({
  name: 'emp',
  initialState,
  reducers: {
    setEmp(state, action: PayloadAction<any>) {
      state.emp = action.payload;
    },
    clearEmp(state) {
      state.emp = null;
    },
  },
});

export const { setEmp, clearEmp } = empSlice.actions;
export default empSlice.reducer;
