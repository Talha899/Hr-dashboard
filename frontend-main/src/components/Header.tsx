import React from 'react';
import { useDispatch } from 'react-redux';
import { logout } from '../slices/authSlice';

import { ContactRound  } from 'lucide-react';
const Header: React.FC = () => {
  const dispatch = useDispatch();

  const authString = localStorage.getItem('auth');
  let name = '';
  let email = '';
  let role = '';

  if (authString) {
    try {
      const auth = JSON.parse(authString);
      name = auth.name || '';
      email = auth.email || '';
      role = auth.role || '';
    } catch (e) {
    }
  }

  const handleLogout = () => {
    dispatch(logout());
    window.location.href = '/';
  };

  return (
    <header
      className="bg-gradient-to-r from-[#4e54c8] to-[#8f94fb] text-white px-4 py-4 md:px-8 md:py-6 flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg rounded-b-2xl mb-8"
      style={{
        boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
      }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 w-full md:w-auto">
        <div className="flex items-center gap-2 sm:gap-3 font-bold text-xl sm:text-2xl md:text-[1.7rem] tracking-wide">
          <ContactRound className="w-7 h-7" />
          HR Dashboard
        </div>
        <div className="hidden sm:block border-l-2 border-white/20 h-8 mx-4" />
        <div className="mt-2 sm:mt-0">
          <div className="font-medium text-base sm:text-lg">{name}</div>
          <div className="text-sm sm:text-base opacity-85">{email}</div>
          <div
            className="text-xs sm:text-sm mt-1 rounded px-2 py-1 inline-block"
            style={{
              color: '#e0e0e0',
              background: '#ffffff22',
              borderRadius: '8px',
              marginTop: '2px'
            }}
          >
            {role && role.toUpperCase()}
          </div>
        </div>
      </div>
      <div className="w-full md:w-auto flex justify-end md:justify-normal mt-4 md:mt-0">
        <button
          onClick={handleLogout}
          className="rounded bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 shadow transition"
          style={{
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          }}
        >
          Logout
        </button>
      </div>
    </header>
  );
}

export default Header;
