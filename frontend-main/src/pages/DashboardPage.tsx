import React from 'react';
import { useSelector } from 'react-redux';
import type{ RootState } from '../store';
import Employees from '../components/Employees';
import Payroll from '../components/Payroll';
import Header from '../components/Header';
import { Navigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  // Check if user is logged in by checking token in Redux state
  const token = useSelector((state: RootState) => state.auth.token);

  if (!token) {
    // Not logged in, redirect to login page
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Header />
      <Payroll />
      <Employees />
    </>
  );
};

export default Dashboard;
