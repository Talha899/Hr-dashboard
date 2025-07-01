import React, { useState, useEffect, useRef } from 'react';
import type { Employee, EmployeeStatus } from '../interfaces/employee';
import { useDispatch } from 'react-redux';
import { setEmp } from '../slices/empSlice';

import { IdCardLanyard ,UserPlus,UserRoundPen,TentTree,X,History} from 'lucide-react';
type Raise = {
  date: string; 
  amount: number;
  currency: string; 
};

type Holiday = {
  date: string; 
  kind: 'paid' | 'unpaid' | 'sick';
};

type Rate = {
  amount: number;
  currency: string;
};

const defaultDepartments = [
  'Engineering',
  'Sales',
  'Marketing',
  'HR',
  'Finance',
  'Support',
  'Operations',
  'Legal',
  'Product',
  'Design',
];

const defaultEmployee: Employee & {
  password?: string;
  hireDate?: string;
  raises?: Raise[];
  createdAt?: string;
  expenseRate?: Rate;
} = {
  _id: '',
  name: '',
  email: '',
  password: '',
  dept: '',
  title: '',
  hourlyRate: { amount: 0, currency: 'USD' },
  expenseRate: { amount: 0, currency: 'USD' },
  status: 'active',
  daysOff: 0,
  hireDate: '',
  raises: [],
  createdAt: '',
};

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<typeof defaultEmployee[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<typeof defaultEmployee | null>(null);
  const [formData, setFormData] = useState<Partial<typeof defaultEmployee>>({
    hourlyRate: { amount: 0, currency: 'USD' },
    expenseRate: { amount: 0, currency: 'USD' },
    raises: [],
    status: 'active',
    hireDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Timer ref for auto-hiding message
  const messageTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Effect to auto-hide message after 5 seconds
  useEffect(() => {
    if (message) {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
      messageTimerRef.current = setTimeout(() => {
        setMessage(null);
      }, 5000);
    }
    return () => {
      if (messageTimerRef.current) {
        clearTimeout(messageTimerRef.current);
      }
    };
  }, [message]);

  const [filterDept, setFilterDept] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const [holidaysModal, setHolidaysModal] = useState<{
    open: boolean;
    employee: typeof defaultEmployee | null;
  }>({ open: false, employee: null });

  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [holidaysYear, setHolidaysYear] = useState<number>(new Date().getFullYear());
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysMessage, setHolidaysMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [addHoliday, setAddHoliday] = useState<{ date: string; kind: 'paid' | 'unpaid' | 'sick' }>({
    date: '',
    kind: 'paid',
  });

  const [salaryHistoryModal, setSalaryHistoryModal] = useState<{
    open: boolean;
    employee: typeof defaultEmployee | null;
    raises: Raise[];
    loading: boolean;
    error: string | null;
  }>({
    open: false,
    employee: null,
    raises: [],
    loading: false,
    error: null,
  });

  const [role, setRole] = useState<'hr' | 'employee'>(() => {
    if (typeof window !== 'undefined') {
      const authString = localStorage.getItem('auth');
      if (authString) {
        try {
          const auth = JSON.parse(authString);
          if (auth.role === 'hr' || auth.role === 'employee') {
            return auth.role;
          }
        } catch (e) {
          
        }
      }
    }
    return 'hr';
  });

  useEffect(() => {
    const handleStorage = () => {
      const authString = localStorage.getItem('auth');
      if (authString) {
        try {
          const auth = JSON.parse(authString);
          if (auth.role === 'hr' || auth.role === 'employee') {
            setRole(auth.role);
            return;
          }
        } catch (e) {
        
        }
      }
      setRole('hr');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

 
  const dispatch = useDispatch();

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/listEmployees`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch employees.');
      }
      const data = await response.json();
      setEmployees(data);

      dispatch(setEmp(data));
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleAddClick = () => {
    setFormData({
      hourlyRate: { amount: 0, currency: 'USD' },
      expenseRate: { amount: 0, currency: 'USD' },
      raises: [],
      status: 'active',
      hireDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      name: '',
      email: '',
      password: '',
      dept: '',
      title: '',
      daysOff: 0,
    });
    setEditingEmployee(null);
    setFormVisible(true);
    setMessage(null);
  };

  // REWRITE: Allow editing all fields for employee
  const handleEditClick = (employee: typeof defaultEmployee) => {
    setFormData({
      _id: employee._id,
      name: employee.name,
      email: employee.email,
      password: '', // Don't prefill password for security, but allow changing
      dept: employee.dept,
      title: employee.title,
      hourlyRate: { ...employee.hourlyRate },
      expenseRate: employee.expenseRate ? { ...employee.expenseRate } : { amount: 0, currency: 'USD' },
      status: employee.status,
      hireDate: employee.hireDate,
      createdAt: employee.createdAt,
      daysOff: employee.daysOff,
    });
    setEditingEmployee(employee);
    setFormVisible(true);
    setMessage(null);
  };

  const fetchHolidays = async (employeeId: string, year: number) => {
    setHolidaysLoading(true);
    setHolidaysMessage(null);
    try {
      const url = `${import.meta.env.VITE_API_URL}/listholidays?employeeId=${encodeURIComponent(employeeId)}&year=${encodeURIComponent(year)}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch holidays.');
      }
      const data = await response.json();
      setHolidays(data.holidays || []);
      setHolidaysYear(data.year || year);
    } catch (err: any) {
      setHolidays([]);
      setHolidaysMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handlelistholidays = (employee: typeof defaultEmployee) => {
    setHolidaysModal({ open: true, employee });
    setAddHoliday({ date: '', kind: 'paid' });
    setHolidaysYear(new Date().getFullYear());
    setHolidays([]);
    setHolidaysMessage(null);
    if (employee._id) {
      fetchHolidays(employee._id, new Date().getFullYear());
    }
  };

  const handleAddHoliday = async () => {
    if (!holidaysModal.employee?._id || !addHoliday.date || !addHoliday.kind) {
      setHolidaysMessage({ type: 'error', text: 'Please select date and kind.' });
      return;
    }
    setHolidaysLoading(true);
    setHolidaysMessage(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/addholidays/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: holidaysModal.employee._id,
          date: addHoliday.date,
          kind: addHoliday.kind,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add holiday.');
      }
      setHolidaysMessage({ type: 'success', text: data.message || 'Holiday added.' });
      if (Array.isArray(data.holidays)) {
        setHolidays(data.holidays);
      } else {
        fetchHolidays(holidaysModal.employee._id, holidaysYear);
      }
      setAddHoliday({ date: '', kind: 'paid' });
    } catch (err: any) {
      setHolidaysMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleDeleteHoliday = async (date: string) => {
    if (!holidaysModal.employee?._id || !date) return;
    setHolidaysLoading(true);
    setHolidaysMessage(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/deleteholidays/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: holidaysModal.employee._id,
          date,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete holiday.');
      }
      setHolidaysMessage({ type: 'success', text: data.message || 'Holiday deleted.' });
      fetchHolidays(holidaysModal.employee._id, holidaysYear);
    } catch (err: any) {
      setHolidaysMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleDeleteClick = async (employeeId: string) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/deleteemployee/${employeeId}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        await fetchEmployees();
        setMessage({ type: 'success', text: 'Employee deleted successfully.' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.error || 'Failed to delete employee.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Network error.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSalaryHistoryClick = async (employeeId: string) => {
    setSalaryHistoryModal({
      open: true,
      employee: employees.find(e => e._id === employeeId) || null,
      raises: [],
      loading: true,
      error: null,
    });

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/get-raise?employeeId=${encodeURIComponent(employeeId)}`
      );
      if (!response.ok) {
        const errorData = await response.json();
        setSalaryHistoryModal(prev => ({
          ...prev,
          loading: false,
          error: errorData.error || 'Failed to fetch salary history.',
        }));
        return;
      }
      const data = await response.json();
      setSalaryHistoryModal(prev => ({
        ...prev,
        raises: Array.isArray(data.raises) ? data.raises : [],
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setSalaryHistoryModal(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Network error.',
      }));
    }
  };

  const closeSalaryHistoryModal = () => {
    setSalaryHistoryModal({
      open: false,
      employee: null,
      raises: [],
      loading: false,
      error: null,
    });
  };

  // REWRITE: Allow editing all fields for employee
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (editingEmployee && editingEmployee._id) {
      // Allow editing all fields
      if (
        !formData.name ||
        !formData.email ||
        !formData.dept ||
        !formData.title ||
        !formData.status ||
        !formData.hourlyRate ||
        typeof formData.hourlyRate.amount !== 'number' ||
        !formData.hourlyRate.currency ||
        !formData.hireDate ||
        !formData.expenseRate ||
        typeof formData.expenseRate.amount !== 'number' ||
        !formData.expenseRate.currency
      ) {
        setMessage({ type: 'error', text: 'Please fill all required fields.' });
        return;
      }
      setLoading(true);
      try {
        // Only send password if it's not empty (i.e., user wants to change it)
        const patchBody: any = {
          name: formData.name,
          email: formData.email,
          dept: formData.dept,
          title: formData.title,
          status: formData.status,
          hourlyRate: formData.hourlyRate,
          expenseRate: {
            amount: formData.expenseRate.amount,
            currency: formData.expenseRate.currency.toUpperCase(),
          },
          hireDate: formData.hireDate,
          daysOff: formData.daysOff ?? 0,
        };
        if (formData.password && formData.password.length >= 6) {
          patchBody.password = formData.password;
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/updateEmployee/${editingEmployee._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(patchBody),
        });

        if (response.ok) {
          await fetchEmployees();
          setFormVisible(false);
          setMessage({ type: 'success', text: 'Employee updated successfully.' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.error || 'Failed to update employee.' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Network error.' });
      } finally {
        setLoading(false);
      }
    } else {
      // Add new employee (all fields except holidays)
      if (
        !formData.name ||
        !formData.email ||
        !formData.password ||
        !formData.dept ||
        !formData.title ||
        !formData.status ||
        !formData.hourlyRate ||
        typeof formData.hourlyRate.amount !== 'number' ||
        !formData.hourlyRate.currency ||
        !formData.hireDate ||
        !formData.expenseRate ||
        typeof formData.expenseRate.amount !== 'number' ||
        !formData.expenseRate.currency
      ) {
        setMessage({ type: 'error', text: 'Please fill all required fields.' });
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/createEmployee`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            dept: formData.dept,
            title: formData.title,
            status: formData.status,
            hourlyRate: formData.hourlyRate,
            expenseRate: {
              amount: formData.expenseRate.amount,
              currency: formData.expenseRate.currency.toUpperCase(),
            },
            hireDate: formData.hireDate,
            createdAt: formData.createdAt,
          }),
        });
        if (response.status === 201) {
          await fetchEmployees();
          setFormVisible(false);
          setMessage({ type: 'success', text: 'Employee created successfully.' });
        } else {
          const errorData = await response.json();
          setMessage({ type: 'error', text: errorData.error || 'Failed to create employee.' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Network error.' });
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtering logic: only filter by Department and Status
  const filteredEmployees = employees.filter(emp => {
    // Department filter
    if (filterDept && emp.dept !== filterDept) return false;
    // Status filter
    if (filterStatus && emp.status !== filterStatus) return false;
    return true;
  });

  // Get a list of years for which holidays can be filtered (e.g., 5 years back and 2 years forward)
  const getYearOptions = () => {
    const current = new Date().getFullYear();
    const years = [];
    for (let y = current - 5; y <= current + 2; y++) years.push(y);
    return years;
  };

  return (
    <div className="p-4 flex flex-row h-[calc(100vh-0px)] bg-gradient-to-br from-blue-50 via-white to-indigo-50 transition-colors duration-500">
      <div
        className={`flex-1 transition-all duration-500 ${
          formVisible || holidaysModal.open || salaryHistoryModal.open ? 'pr-0 md:pr-8 blur-sm md:blur-none' : ''
        } overflow-auto`}
      >
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-extrabold text-blue-800 tracking-tight flex items-center gap-2 animate-fade-in">
            <IdCardLanyard className="w-8 h-8 text-blue-500 animate-bounce" />
            Employees
          </h1>
          {role !== 'employee' && (
            <button
              onClick={handleAddClick}
              className="rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold px-4 py-2 sm:px-5 sm:py-2 shadow transition flex items-center gap-2 text-base sm:text-lg"
            >
              <span className="text-xl sm:text-2xl">+</span>
              <span className="hidden xs:inline sm:inline">Add Employee</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-6 p-6 bg-white/80 rounded-2xl border border-gray-200 shadow-md animate-fade-in">
          <div className="flex flex-wrap gap-6">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Department</label>
              <select
                value={filterDept}
                onChange={e => setFilterDept(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              >
                <option value="">All</option>
                {defaultDepartments.map(dep => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="resigned">Resigned</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="rounded bg-blue-200 hover:bg-blue-300 text-blue-900 font-semibold px-5 py-2 shadow transition"
                onClick={() => {
                  setFilterDept('');
                  setFilterStatus('');
                }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-2 rounded-lg shadow animate-fade-in ${
              message.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-300'
                : 'bg-red-100 text-red-800 border border-red-300'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="overflow-x-auto animate-fade-in">
          <table className="w-full border border-gray-200 min-w-[1200px] rounded-xl overflow-hidden shadow-lg bg-white/90">
            <thead className="bg-gradient-to-r from-blue-100 to-indigo-100">
              <tr>
                <th className="p-3 text-left font-semibold text-gray-700">Name</th>
                <th className="p-3 text-left font-semibold text-gray-700">Email</th>
                <th className="p-3 text-left font-semibold text-gray-700">Department</th>
                <th className="p-3 text-left font-semibold text-gray-700">Title</th>
                <th className="p-3 text-left font-semibold text-gray-700">Hourly Rate</th>
                <th className="p-3 text-left font-semibold text-gray-700">Currency</th>
                <th className="p-3 text-left font-semibold text-gray-700">Expense Rate</th>
                <th className="p-3 text-left font-semibold text-gray-700">Expense Currency</th>
                <th className="p-3 text-left font-semibold text-gray-700">Status</th>
                <th className="p-3 text-left font-semibold text-gray-700">Hire Date</th>
                {role !== 'employee' && (
                  <th className="p-3 text-left font-semibold text-gray-700">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, idx) => (
                <tr
                  key={emp._id}
                  className={`border-t transition-colors duration-200 ${
                    idx % 2 === 0 ? 'bg-white/80' : 'bg-blue-50/60'
                  } hover:bg-blue-100/70`}
                >
                  <td className="p-3 font-medium text-gray-800">{emp.name}</td>
                  <td className="p-3 text-gray-700">{emp.email}</td>
                  <td className="p-3 text-gray-700">{emp.dept}</td>
                  <td className="p-3 text-gray-700">{emp.title}</td>
                  <td className="p-3 text-gray-700">{emp.hourlyRate.amount}</td>
                  <td className="p-3 text-gray-700">{emp.hourlyRate.currency}</td>
                  <td className="p-3 text-gray-700">{emp.expenseRate?.amount ?? 'N/A'}</td>
                  <td className="p-3 text-gray-700">{emp.expenseRate?.currency ?? 'N/A'}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-bold ${
                      emp.status === 'active'
                        ? 'bg-green-100 text-green-700 animate-pulse'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {emp.status.charAt(0).toUpperCase() + emp.status.slice(1)}
                    </span>
                  </td>
                  <td className="p-3 text-gray-700">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : ''}</td>
                  {role !== 'employee' && (
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => handleEditClick(emp)}
                        className="text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 rounded transition-all duration-150 font-semibold"
                      >
                        <span className="inline-block align-middle">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"></path></svg>
                        </span>
                        Edit
                      </button>
                      <button
                        onClick={() => emp._id && handleDeleteClick(emp._id)}
                        className="text-red-600 hover:bg-red-100 hover:text-red-800 px-2 py-1 rounded transition-all duration-150 font-semibold"
                        disabled={loading || !emp._id}
                      >
                        <span className="inline-block align-middle">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
                        </span>
                        Delete
                      </button>
                      <button
                        onClick={() => handlelistholidays(emp)}
                        className="text-blue-600 hover:bg-blue-100 hover:text-blue-800 px-2 py-1 rounded transition-all duration-150 font-semibold"
                      >
                        <span className="inline-block align-middle">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 112.828 2.828L11.828 15.828a4 4 0 01-1.414.828l-4.243 1.414 1.414-4.243a4 4 0 01.828-1.414z"></path></svg>
                        </span>
                        Holidays
                      </button>
                      <button
                        onClick={() => emp._id && handleSalaryHistoryClick(emp._id)}
                        className="rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold px-3 py-2 md:px-5 md:py-2 shadow transition flex items-center justify-center w-full md:w-auto text-sm md:text-base"
                        disabled={loading || !emp._id}
                      >
                        <span className="inline-block align-middle">
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                          </svg>
                        </span>
                        <span className="hidden sm:inline">Salary History</span>
                        <span className="inline sm:hidden">Salary</span>
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={role !== 'employee' ? 13 : 12} className="p-6 text-center text-gray-500 animate-fade-in">
                    No employees found matching the filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side form drawer */}
      {formVisible && role !== 'employee' && (
        <div className="fixed md:static right-0 top-0 h-full w-full md:w-[500px] z-50 flex justify-end items-stretch bg-black/30 md:bg-transparent animate-fade-in">
          <div className="relative w-full md:w-[500px] h-full bg-white shadow-2xl animate-slide-in-right rounded-l-2xl flex flex-col border-l-4 border-blue-400">
            <button
              type="button"
              onClick={() => setFormVisible(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl focus:outline-none transition-transform duration-200 hover:scale-125"
              aria-label="Close"
            >
              <X/>
            </button>
            <form
              onSubmit={handleFormSubmit}
              className="flex-1 overflow-y-auto p-8 animate-fade-in"
            >
              <h2 className="text-2xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">
                <span className="inline-block">
                  {editingEmployee ? (
                    <UserRoundPen className="w-7 h-7 text-blue-500 animate-bounce" />
                  ) : (
                    <UserPlus className="w-7 h-7 text-green-500 animate-bounce" />
                  )}
                </span>
                {editingEmployee ? 'Edit' : 'Add'} Employee
              </h2>
              <div className="space-y-6">
                {/* Allow all fields in both add and edit */}
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Name</label>
                  <input
                    value={formData.name || ''}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                    placeholder="Enter full name"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email || ''}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                    placeholder="Enter email address"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                  <input
                    type="password"
                    value={formData.password || ''}
                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    minLength={6}
                    placeholder={editingEmployee ? "Leave blank to keep current password" : "Password (min 6 chars)"}
                    required={!editingEmployee}
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                  <select
                    value={formData.dept || ''}
                    onChange={e => setFormData({ ...formData, dept: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                  >
                    <option value="" disabled>
                      Select department
                    </option>
                    {defaultDepartments.map(dep => (
                      <option key={dep} value={dep}>
                        {dep}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Title</label>
                  <input
                    value={formData.title || ''}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                    placeholder="Job Title"
                  />
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Hire Date</label>
                  <input
                    type="date"
                    value={formData.hireDate ? formData.hireDate.slice(0, 10) : ''}
                    onChange={e => setFormData({ ...formData, hireDate: e.target.value })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                  />
                </div>
                <div className="flex gap-4 animate-fade-in">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expense Rate</label>
                    <input
                      type="number"
                      value={formData.expenseRate?.amount ?? ''}
                      onChange={e => setFormData({
                        ...formData,
                        expenseRate: {
                          ...formData.expenseRate!,
                          amount: parseFloat(e.target.value),
                        },
                      })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      required
                      min={0}
                      placeholder="Amount"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Expense Currency</label>
                    <select
                      value={formData.expenseRate?.currency || 'USD'}
                      onChange={e => setFormData({
                        ...formData,
                        expenseRate: {
                          ...formData.expenseRate!,
                          currency: e.target.value.toUpperCase() as 'USD' | 'EUR' | 'PKR',
                        },
                      })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="PKR">PKR</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-4 animate-fade-in">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hourly Rate</label>
                    <input
                      type="number"
                      value={formData.hourlyRate?.amount ?? ''}
                      onChange={e => setFormData({
                        ...formData,
                        hourlyRate: {
                          ...formData.hourlyRate!,
                          amount: parseFloat(e.target.value),
                        },
                      })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      required
                      min={0}
                      placeholder="Amount"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Currency</label>
                    <select
                      value={formData.hourlyRate?.currency || 'USD'}
                      onChange={e => setFormData({
                        ...formData,
                        hourlyRate: {
                          ...formData.hourlyRate!,
                          currency: e.target.value as 'USD' | 'EUR' | 'PKR',
                        },
                      })}
                      className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      required
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="PKR">PKR</option>
                    </select>
                  </div>
                </div>
                <div className="animate-fade-in">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status || 'active'}
                    onChange={e => setFormData({ ...formData, status: e.target.value as EmployeeStatus })}
                    className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="resigned">Resigned</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end space-x-4 mt-10 animate-fade-in">
                <button
                  type="button"
                  onClick={() => setFormVisible(false)}
                  className="rounded bg-white hover:bg-gray-100 text-gray-800 font-semibold px-5 py-2 shadow transition border border-gray-300"
                  disabled={loading}
                >
                  Cancel
                </button>
                <span className="w-4" /> {/* Add horizontal space between buttons */}
                <button
                  type="submit"
                  className="rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 shadow transition"
                  disabled={loading}
                >
                  {loading ? (editingEmployee ? 'Updating...' : 'Adding...') : (editingEmployee ? 'Update' : 'Add')}
                </button>
              </div>
            </form>
          </div>
          <style>
            {`
              @keyframes slide-in-right {
                0% {
                  transform: translateX(100%);
                  opacity: 0;
                }
                100% {
                  transform: translateX(0);
                  opacity: 1;
                }
              }
              .animate-slide-in-right {
                animation: slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
              }
              @keyframes fade-in {
                0% { opacity: 0; transform: translateY(16px);}
                100% { opacity: 1; transform: translateY(0);}
              }
              .animate-fade-in {
                animation: fade-in 0.6s cubic-bezier(0.4,0,0.2,1);
              }
            `}
          </style>
        </div>
      )}

      {/* Holidays Modal */}
      {holidaysModal.open && holidaysModal.employee && (
        <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-black/30 animate-fade-in">
          <div className="relative w-full md:w-[500px] h-full bg-white shadow-2xl animate-slide-in-right rounded-l-2xl flex flex-col border-l-4 border-blue-400">
            <button
              type="button"
              onClick={() => setHolidaysModal({ open: false, employee: null })}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-5xl focus:outline-none transition-transform duration-200 hover:scale-125"
              aria-label="Close"
              style={{ width: '3rem', height: '3rem', lineHeight: '3rem' }}
            >
              <X />
            </button>
            <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
              <h2 className="text-2xl font-extrabold mb-8 text-blue-700 flex items-center gap-2">
                <span className="inline-block">
                  <TentTree className="w-7 h-7 text-blue-500 animate-bounce" />
                </span>
                Holidays for {holidaysModal.employee.name}
              </h2>
              <div className="mb-6 flex gap-4 items-end">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Year</label>
                  <select
                    value={holidaysYear}
                    onChange={e => {
                      const year = parseInt(e.target.value, 10);
                      setHolidaysYear(year);
                      if (holidaysModal.employee?._id) {
                        fetchHolidays(holidaysModal.employee._id, year);
                      }
                    }}
                    className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                  >
                    {getYearOptions().map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1"></div>
              </div>
              {holidaysMessage && (
                <div
                  className={`mb-4 px-4 py-2 rounded-lg shadow animate-fade-in ${
                    holidaysMessage.type === 'success'
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {holidaysMessage.text}
                </div>
              )}
              <div className="mb-6">
                <h3 className="font-bold text-lg mb-2">Add Holiday</h3>
                <div className="flex gap-4 items-end">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={addHoliday.date}
                      onChange={e => setAddHoliday({ ...addHoliday, date: e.target.value })}
                      className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Kind</label>
                    <select
                      value={addHoliday.kind}
                      onChange={e => setAddHoliday({ ...addHoliday, kind: e.target.value as 'paid' | 'unpaid' | 'sick' })}
                      className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-400 focus:outline-none transition"
                    >
                      <option value="paid">Paid</option>
                      <option value="unpaid">Unpaid</option>
                      <option value="sick">Sick</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddHoliday}
                    className="rounded bg-blue-500 hover:bg-blue-600 text-white font-semibold px-5 py-2 shadow transition"
                    disabled={holidaysLoading || role === 'employee'}
                  >
                    Add
                  </button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Holidays in {holidaysYear}</h3>
                {holidaysLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : holidays.length === 0 ? (
                  <div className="text-gray-500">No holidays found for this year.</div>
                ) : (
                  <table className="w-full border border-gray-200 rounded-xl overflow-hidden shadow bg-white/90 mb-4">
                    <thead>
                      <tr>
                        <th className="p-2 text-left font-semibold text-gray-700">Date</th>
                        <th className="p-2 text-left font-semibold text-gray-700">Kind</th>
                        {role !== 'employee' && (
                          <th className="p-2 text-left font-semibold text-gray-700">Actions</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {holidays
                        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                        .map((h, idx) => (
                        <tr key={h.date + h.kind + idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-blue-50'}>
                          <td className="p-2">{new Date(h.date).toLocaleDateString()}</td>
                          <td className="p-2 capitalize">{h.kind}</td>
                          {role !== 'employee' && (
                            <td className="p-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteHoliday(h.date)}
                                className="text-red-600 hover:bg-red-100 hover:text-red-800 px-2 py-1 rounded transition-all duration-150 font-semibold"
                                disabled={holidaysLoading}
                              >
                                Delete
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
            <style>
              {`
                @keyframes slide-in-right {
                  0% {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  100% {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
                .animate-slide-in-right {
                  animation: slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fade-in {
                  0% { opacity: 0; transform: translateY(16px);}
                  100% { opacity: 1; transform: translateY(0);}
                }
                .animate-fade-in {
                  animation: fade-in 0.6s cubic-bezier(0.4,0,0.2,1);
                }
              `}
            </style>
          </div>
        </div>
      )}

      {/* Salary History Modal */}
      {salaryHistoryModal.open && salaryHistoryModal.employee && (
        <div className="fixed inset-0 z-50 flex justify-end items-stretch bg-black/30 animate-fade-in">
          <div className="relative w-full md:w-[500px] h-full bg-white shadow-2xl animate-slide-in-right rounded-l-2xl flex flex-col border-l-4 border-purple-400">
            <button
              type="button"
              onClick={closeSalaryHistoryModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl focus:outline-none transition-transform duration-200 hover:scale-125"
              aria-label="Close"
            >
              <X/>
            </button>
            <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
              <h2 className="text-2xl font-extrabold mb-8 text-purple-700 flex items-center gap-2">
                <span className="inline-block">
                  <History />
                </span>
                Salary History for {salaryHistoryModal.employee.name}
              </h2>
              {salaryHistoryModal.loading ? (
                <div className="text-gray-500">Loading...</div>
              ) : salaryHistoryModal.error ? (
                <div className="mb-4 px-4 py-2 rounded-lg shadow bg-red-100 text-red-800 border border-red-300 animate-fade-in">
                  {salaryHistoryModal.error}
                </div>
              ) : (
                <div>
                  {salaryHistoryModal.raises.length === 0 ? (
                    <div className="text-gray-500">No salary history found.</div>
                  ) : (
                    <table className="w-full border border-gray-200 rounded-xl overflow-hidden shadow bg-white/90 mb-4">
                      <thead>
                        <tr>
                          <th className="p-2 text-left font-semibold text-gray-700">Date</th>
                          <th className="p-2 text-left font-semibold text-gray-700">Amount</th>
                          <th className="p-2 text-left font-semibold text-gray-700">Currency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salaryHistoryModal.raises
                          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                          .map((raise, idx) => (
                            <tr key={raise.date + raise.amount + raise.currency + idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-purple-50'}>
                              <td className="p-2">{new Date(raise.date).toLocaleDateString()}</td>
                              <td className="p-2">{raise.amount}</td>
                              <td className="p-2">{raise.currency}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  )}
                </div>
              )}
            </div>
            <style>
              {`
                @keyframes slide-in-right {
                  0% {
                    transform: translateX(100%);
                    opacity: 0;
                  }
                  100% {
                    transform: translateX(0);
                    opacity: 1;
                  }
                }
                .animate-slide-in-right {
                  animation: slide-in-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
                }
                @keyframes fade-in {
                  0% { opacity: 0; transform: translateY(16px);}
                  100% { opacity: 1; transform: translateY(0);}
                }
                .animate-fade-in {
                  animation: fade-in 0.6s cubic-bezier(0.4,0,0.2,1);
                }
              `}
            </style>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
