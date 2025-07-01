import React, { useEffect, useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import type { Employee } from '../interfaces/employee';
import axios from 'axios';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts';

import { HandCoins,BanknoteArrowDown,UserRoundPen,TypeOutline } from 'lucide-react';
// Add expenseRate to DeptSummary
interface DeptSummary {
  dept: string;
  headCount: number;
  billableHours: number;
  monthlyCost: number;
  expenseRate?: {
    amount: number;
    currency: string;
  };
}

// Add expenseRate to PayrollData
interface PayrollData {
  byDept: DeptSummary[];
  totalHeadCount: number;
  totalBillableHours: number;
  totalMonthlyCost: number;
  // Optionally, you could add totalExpenseRate if you want a global value
}

type Raise = {
  date: string; // ISO string
  amount: number;
  currency: string; // e.g., 'USD'
};

type Holiday = {
  date: string; // ISO string
  kind: 'paid' | 'unpaid' | 'sick';
};

// Add expenseRate to defaultEmployee
const defaultEmployee: Employee & {
  password?: string;
  hireDate?: string;
  raises?: Raise[];
  holidays?: Holiday[];
  createdAt?: string;
  expenseRate?: {
    amount: number;
    currency: string;
  };
} = {
  _id: '',
  name: '',
  email: '',
  password: '',
  dept: '',
  title: '',
  hourlyRate: { amount: 0, currency: 'USD' },
  status: 'active',
  daysOff: 0,
  hireDate: '',
  raises: [],
  holidays: [],
  createdAt: '',
  expenseRate: { amount: 0, currency: 'USD' },
};

const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: '$',
  EUR: '€',
  PKR: '₨',
};

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD ($)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'PKR', label: 'PKR (₨)' },
];

function getBurnForecast(
  base: number,
  months: number = 3,
  inflation: number = 0.03
): number[] {
  const arr: number[] = [];
  let current = base;
  for (let i = 0; i < months; ++i) {
    arr.push(current);
    current = current * (1 + inflation);
  }
  return arr;
}

// New: getExpenseRateForecast (average expenseRate for all employees, projected)
function getExpenseRateForecast(
  base: number,
  months: number = 3,
  inflation: number = 0.03
): number[] {
  const arr: number[] = [];
  let current = base;
  for (let i = 0; i < months; ++i) {
    arr.push(current);
    current = current * (1 + inflation);
  }
  return arr;
}

// For the financial projection graph, let's project 12 months ahead
function getFinancialProjection(
  base: number,
  months: number = 12,
  inflation: number = 0.03
): { month: string; cost: number }[] {
  const arr: { month: string; cost: number }[] = [];
  let current = base;
  const now = new Date();
  for (let i = 0; i < months; ++i) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push({
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      cost: current,
    });
    current = current * (1 + inflation);
  }
  return arr;
}

// New: getExpenseRateProjection (for 12 months)
function getExpenseRateProjection(
  base: number,
  months: number = 12,
  inflation: number = 0.03
): { month: string; expenseRate: number }[] {
  const arr: { month: string; expenseRate: number }[] = [];
  let current = base;
  const now = new Date();
  for (let i = 0; i < months; ++i) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    arr.push({
      month: date.toLocaleString('default', { month: 'short', year: '2-digit' }),
      expenseRate: current,
    });
    current = current * (1 + inflation);
  }
  return arr;
}

const monthNames = Array.from({ length: 3 }, (_, i) => {
  const date = new Date();
  date.setMonth(date.getMonth() + i);
  return date.toLocaleString('default', { month: 'long', year: 'numeric' });
});

// Add expenseRate to CSV export
function convertEmployeesToCSV(employees: typeof defaultEmployee[]): string {
  if (!employees.length) return '';
  // Flatten raises and holidays for CSV
  const header = [
    'Name', 'Email', 'Dept', 'Title', 'Status', 'HourlyRateAmount', 'HourlyRateCurrency',
    'HireDate', 'CreatedAt', 'Raises', 'Holidays', 'ExpenseRateAmount', 'ExpenseRateCurrency'
  ];
  const rows = employees.map(emp => {
    const raises = (emp.raises || [])
      .map(r => `${r.date}:${r.amount}:${r.currency}`)
      .join('|');
    const holidays = (emp.holidays || [])
      .map(h => `${h.date}:${h.kind}`)
      .join('|');
    return [
      emp.name,
      emp.email,
      emp.dept,
      emp.title,
      emp.status,
      emp.hourlyRate?.amount ?? '',
      emp.hourlyRate?.currency ?? '',
      emp.hireDate ?? '',
      emp.createdAt ?? '',
      raises,
      holidays,
      emp.expenseRate?.amount ?? '',
      emp.expenseRate?.currency ?? ''
    ].map(val =>
      typeof val === 'string' && (val.includes(',') || val.includes('"') || val.includes('\n'))
        ? `"${val.replace(/"/g, '""')}"`
        : val
    ).join(',');
  });
  return [header.join(','), ...rows].join('\r\n');
}

// --- Currency conversion rates (for demo, static) ---
const CURRENCY_CONVERSION: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  PKR: 278,
};

const Payroll: React.FC = () => {
  const [data, setData] = useState<PayrollData | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'EUR' | 'PKR'>('USD');
  const [loading, setLoading] = useState(false);

  const [employees, setEmployees] = useState<typeof defaultEmployee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const emp = useSelector((state: RootState) => state.emp.emp);
  const COLORS = [
    "#6366F1", "#3B82F6", "#06B6D4", "#10B981", "#F59E42", "#F43F5E", "#A78BFA", "#FBBF24"
  ];

  // Fetch payroll summary when currency or emp changes
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${import.meta.env.VITE_API_URL}/payroll/summary?month=2025-06&currency=${currency}`)
      .then(res => setData(res.data))
      .catch(err => {
        setData(null);
        console.error('Failed to fetch payroll data', err);
      })
      .finally(() => setLoading(false));
  }, [emp, currency]);

  // Fetch employees when emp changes
  useEffect(() => {
    setEmpLoading(true);
    fetch(`${import.meta.env.VITE_API_URL}/listEmployees`)
      .then(async response => {
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch employees.');
        }
        return response.json();
      })
      .then(data => setEmployees(data))
      .catch(_err => {
        setEmployees([]);
        // Optionally show error
      })
      .finally(() => setEmpLoading(false));
  }, [emp]);

  // --- Currency conversion helper ---
  function convertAmount(amount: number, from: string, to: string): number {
    if (!CURRENCY_CONVERSION[from] || !CURRENCY_CONVERSION[to]) return amount;
    // Convert to USD, then to target
    const usd = amount / CURRENCY_CONVERSION[from];
    return usd * CURRENCY_CONVERSION[to];
  }

  // --- Filtered employees for expenseRate, always convert to selected currency ---
  const filteredEmployees = useMemo(() => {
    return employees
      .filter(e => e.expenseRate && typeof e.expenseRate.amount === 'number')
      .map(e => ({
        ...e,
        expenseRate: {
          amount: convertAmount(e.expenseRate!.amount, e.expenseRate!.currency, currency),
          currency,
        }
      }));
  }, [employees, currency]);

  // Calculate average expenseRate for all employees in selected currency
  const getAvgExpenseRate = () => {
    if (!filteredEmployees.length) return 0;
    return filteredEmployees.reduce((sum, e) => sum + (e.expenseRate?.amount || 0), 0) / filteredEmployees.length;
  };

  // For forecast panel: expenseRate forecast
  const avgExpenseRate = useMemo(() => getAvgExpenseRate(), [filteredEmployees]);
  const expenseRateForecast = useMemo(
    () => getExpenseRateForecast(avgExpenseRate, 3, 0.03),
    [avgExpenseRate]
  );

  // For 12-month projection: expenseRate projection
  const expenseRateProjection = useMemo(
    () => getExpenseRateProjection(avgExpenseRate, 12, 0.03),
    [avgExpenseRate]
  );

  // For burn forecast and financial projection, use data from API (already in correct currency)
  const burnForecast = useMemo(
    () => getBurnForecast(data?.totalMonthlyCost ?? 0, 3, 0.03),
    [data?.totalMonthlyCost]
  );
  const financialProjection = useMemo(
    () => getFinancialProjection(data?.totalMonthlyCost ?? 0, 12, 0.03),
    [data?.totalMonthlyCost]
  );

  // For department-level charts, recalculate expenseRate/hourlyRate in selected currency
  const byDeptWithRates = useMemo(() => {
    return data?.byDept.map(d => {
      // Employees in this dept
      const emps = employees.filter(e => e.dept === d.dept);
      // Hourly Rate: convert all to selected currency
      const empsWithHourly = emps.filter(e => e.hourlyRate && typeof e.hourlyRate.amount === 'number');
      let avgHourlyRate = 0;
      if (empsWithHourly.length) {
        avgHourlyRate =
          empsWithHourly.reduce(
            (sum, e) => sum + convertAmount(e.hourlyRate.amount, e.hourlyRate.currency, currency),
            0
          ) / empsWithHourly.length;
      }
      // Expense Rate: convert all to selected currency
      const empsWithExpense = emps.filter(e => e.expenseRate && typeof e.expenseRate.amount === 'number');
      let avgExpenseRate = 0;
      if (empsWithExpense.length) {
        avgExpenseRate =
          empsWithExpense.reduce(
            (sum, e) => sum + convertAmount(e.expenseRate!.amount, e.expenseRate!.currency, currency),
            0
          ) / empsWithExpense.length;
      }
      // For the pie chart, we want the *total* expenseRate for the department, not the average
      let totalExpenseRate = 0;
      if (empsWithExpense.length) {
        totalExpenseRate =
          empsWithExpense.reduce(
            (sum, e) => sum + convertAmount(e.expenseRate!.amount, e.expenseRate!.currency, currency),
            0
          );
      }
      return {
        ...d,
        expenseRate: avgExpenseRate,
        hourlyRate: avgHourlyRate,
        totalExpenseRate, // add for pie chart
      };
    }) ?? [];
  }, [data?.byDept, employees, currency, CURRENCY_CONVERSION]);

  // For the Monthly Cost by Department pie chart, use totalExpenseRate per department
  const pieChartExpenseRateData = useMemo(() => {
    if (!byDeptWithRates.length) return [];
    return byDeptWithRates.map(d => ({
      dept: d.dept,
      totalExpenseRate: d.totalExpenseRate ?? 0,
    }));
  }, [byDeptWithRates]);

  const handleDownloadCSV = () => {
    if (!employees.length) return;

    // Helper to format ISO date to YYYY-MM-DD
    const formatDate = (iso: string | undefined) => {
      if (!iso) return '';
      const d = new Date(iso);
      if (isNaN(d.getTime())) return iso;
      return d.toISOString().slice(0, 10);
    };

    // Deep copy and format date fields
    const formattedEmployees = employees.map(emp => ({
      ...emp,
      hireDate: formatDate(emp.hireDate),
      createdAt: formatDate(emp.createdAt),
      raises: Array.isArray(emp.raises)
        ? emp.raises.map(r => ({
            ...r,
            date: formatDate(r.date)
          }))
        : [],
      holidays: Array.isArray(emp.holidays)
        ? emp.holidays.map(h => ({
            ...h,
            date: formatDate(h.date)
          }))
        : [],
      expenseRate: emp.expenseRate
        ? { ...emp.expenseRate }
        : { amount: '', currency: '' }
    })).map(emp => ({
      ...emp,
      // Ensure expenseRate.amount is a number for type compatibility
      expenseRate: emp.expenseRate && typeof emp.expenseRate.amount === 'string'
        ? { ...emp.expenseRate, amount: Number(emp.expenseRate.amount) || 0 }
        : emp.expenseRate
    }));

    // Ensure formattedEmployees matches the expected type for convertEmployeesToCSV
    const employeesForCSV = formattedEmployees.map(emp => ({
      ...emp,
      // Ensure expenseRate.amount is a number
      expenseRate: emp.expenseRate
        ? {
            ...emp.expenseRate,
            amount: typeof emp.expenseRate.amount === 'string'
              ? Number(emp.expenseRate.amount) || 0
              : emp.expenseRate.amount
          }
        : undefined
    }));

    const csv = convertEmployeesToCSV(employeesForCSV);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 0);
  };

  if (loading || !data) return <div>Loading...</div>;

  return (
    <div className="p-8 bg-gradient-to-br from-blue-50 via-white to-indigo-100 shadow-2xl rounded-3xl animate-fade-in">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <HandCoins className="w-10 h-10 text-blue-500 animate-bounce" />
            <h2 className="text-3xl font-extrabold text-blue-800 tracking-tight animate-fade-in">
              Payroll Summary <span className="text-lg font-normal text-gray-500">– June 2025</span>
            </h2>
          </div>
          <div className="flex flex-col sm:flex-row sm:ml-auto gap-3">
            <select
              value={currency}
              onChange={e => setCurrency(e.target.value as 'USD' | 'EUR' | 'PKR')}
              className="px-3 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 font-semibold shadow focus:ring-2 focus:ring-blue-400 transition"
              aria-label="Select currency"
            >
              {CURRENCY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <button
              onClick={handleDownloadCSV}
              disabled={empLoading || !employees.length}
              className="rounded bg-green-500 hover:bg-green-600 text-white font-semibold px-5 py-2 shadow transition"
            >
              Download Employees CSV
            </button>
          </div>
        </div>
      </div>

      {/* Forecast Panel */}
      <div className="mb-10">
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col md:flex-row items-center gap-6 animate-slide-in-up">
       
            {/* Expense (Expense Rate) Forecast */}
            <div className="flex-1">
            <h3 className="text-xl font-bold text-red-700 mb-2 flex items-center gap-2">
              <BanknoteArrowDown className="w-6 h-6 text-red-500" />
              3-Month Expenses <span className="text-base font-normal text-gray-500 ml-2">(3% monthly inflation)</span>
            </h3>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              {expenseRateForecast.map((amt, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-r from-red-100 to-red-200 rounded-xl shadow px-4 py-3 flex flex-col items-center"
                >
                  <span className="text-lg font-semibold text-red-700">{monthNames[idx]}</span>
                  <span className="text-2xl font-extrabold text-red-800 mt-1">
                    {CURRENCY_SYMBOLS[currency] || ''}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
       
          {/* Profit (Hourly Rate) Forecast */}
          <div className="flex-1">
            <h3 className="text-xl font-bold text-green-700 mb-2 flex items-center gap-2">
              <UserRoundPen className="w-6 h-6 text-green-500" />
              3-Month Profit <span className="text-base font-normal text-gray-500 ml-2">(3% monthly inflation)</span>
            </h3>
            <div className="flex flex-col md:flex-row gap-4 mt-2">
              {burnForecast.map((amt, idx) => (
                <div
                  key={idx}
                  className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow px-4 py-3 flex flex-col items-center"
                >
                  <span className="text-lg font-semibold text-green-700">{monthNames[idx]}</span>
                  <span className="text-2xl font-extrabold text-green-800 mt-1">
                    {CURRENCY_SYMBOLS[currency] || ''}{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          </div>
     
        </div>
        {/* Total Profit per Month: Hourly Rate - Expense Rate */}
        <div className="bg-white/80 rounded-2xl shadow-lg p-4 mt-4 flex flex-col md:flex-row items-center gap-4">
          <div className="flex-1">
            <h4 className="text-lg font-bold text-gray-700 mb-2 flex items-center gap-2">
              <TypeOutline className="w-5 h-5 text-green-500" />
              Total Profit per Month
            </h4>
            <div className="flex flex-col md:flex-row gap-4">
              {burnForecast.map((burnAmt, idx) => {
                // burnForecast is total payroll (hourly + salary), expenseRateForecast is avg expenseRate * headcount
                // To get total expenseRate for the month, multiply avg by headcount
                // If filteredEmployees is empty, totalExpenseRate = 0
                const totalExpenseRate = (filteredEmployees.length > 0 ? expenseRateForecast[idx] * filteredEmployees.length : 0);
                const profit = burnAmt - totalExpenseRate;
                return (
                  <div
                    key={idx}
                    className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-xl shadow px-4 py-3 flex flex-col items-center"
                  >
                    <span className="text-lg font-semibold text-green-700">{monthNames[idx]}</span>
                    <span className="text-2xl font-extrabold text-green-800 mt-1">
                      {CURRENCY_SYMBOLS[currency] || ''}
                      {profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
        {/* Bar Chart for Head Count by Department */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Head Count by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.byDept}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              barCategoryGap={20}
            >
              <XAxis dataKey="dept" tick={{ fontSize: 13 }} />
              <YAxis />
              <Tooltip
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
                cursor={{ fill: "#e0e7ef" }}
              />
              <Legend />
              <Bar dataKey="headCount" name="Head Count" fill="#6366F1" radius={[8, 8, 0, 0]} animationDuration={1200} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart for Billable Hours by Department */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-cyan-700 mb-4">Billable Hours by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={data.byDept}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              barCategoryGap={20}
            >
              <XAxis dataKey="dept" tick={{ fontSize: 13 }} />
              <YAxis />
              <Tooltip
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
                cursor={{ fill: "#e0e7ef" }}
              />
              <Legend />
              <Bar dataKey="billableHours" name="Billable Hours" fill="#06B6D4" radius={[8, 8, 0, 0]} animationDuration={1600} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart for Monthly Cost Distribution (now shows total expenseRate by department) */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-blue-700 mb-4">Monthly Cost by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieChartExpenseRateData}
                dataKey="totalExpenseRate"
                nameKey="dept"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={45}
                fill="#3B82F6"
                label={({ name, percent, dept }) =>
                  `${dept || name}: ${percent !== undefined ? (percent * 100).toFixed(0) : "0"}%`
                }
                animationDuration={1500}
              >
                {pieChartExpenseRateData.map((_entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) =>
                  `${CURRENCY_SYMBOLS[currency] || ''}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Bar Chart for Expense Rate and Hourly Rate by Department */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-purple-700 mb-4">Expense Rate &amp; Hourly Rate by Department</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={byDeptWithRates}
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
              barCategoryGap={20}
            >
              <XAxis dataKey="dept" tick={{ fontSize: 13 }} />
              <YAxis />
              <Tooltip
                formatter={(value: number, name: string) => {
                  let label = "";
                  if (name === "expenseRate") {
                    label = "Expense Rate";
                  } else if (name === "hourlyRate") {
                    label = "Avg. Hourly Rate";
                  } else {
                    label = name;
                  }
                  return [
                    `${CURRENCY_SYMBOLS[currency] || ''}${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
                    label
                  ];
                }}
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
                cursor={{ fill: "#ede9fe" }}
              />
              <Legend />
              <Bar dataKey="expenseRate" name="Expense Rate" fill="#a78bfa" radius={[8, 8, 0, 0]} animationDuration={1400} />
              <Bar dataKey="hourlyRate" name="Avg. Hourly Rate" fill="#818cf8" radius={[8, 8, 0, 0]} animationDuration={1400} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Financial Projection Graph */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-green-700 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 17l6-6 4 4 8-8" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="10" />
            </svg>
            12-Month Financial Projection
            <span className="text-base font-normal text-gray-500 ml-2">(3% monthly inflation)</span>
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={financialProjection} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis
                tickFormatter={v => `${CURRENCY_SYMBOLS[currency] || ''}${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
              />
              <Tooltip
                formatter={(value: number) =>
                  `${CURRENCY_SYMBOLS[currency] || ''}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="cost"
                name="Projected Cost"
                stroke="#22c55e"
                strokeWidth={3}
                dot={{ r: 4, fill: "#22c55e" }}
                activeDot={{ r: 7 }}
                animationDuration={1800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Rate Projection Graph */}
        <div className="bg-white/90 rounded-2xl shadow-lg p-6 flex flex-col items-center animate-slide-in-up">
          <h3 className="text-xl font-bold text-purple-700 mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-purple-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12h8M12 8v8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            12-Month Avg. Expense Rate Projection
            <span className="text-base font-normal text-gray-500 ml-2">(3% monthly inflation)</span>
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={expenseRateProjection} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 13 }} />
              <YAxis
                tickFormatter={v => `${CURRENCY_SYMBOLS[currency] || ''}${v.toLocaleString(undefined, { maximumFractionDigits: 2 })}`}
              />
              <Tooltip
                formatter={(value: number) =>
                  `${CURRENCY_SYMBOLS[currency] || ''}${value.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                }
                contentStyle={{ background: "#f1f5f9", borderRadius: 12, border: "none" }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="expenseRate"
                name="Avg. Expense Rate"
                stroke="#a78bfa"
                strokeWidth={3}
                dot={{ r: 4, fill: "#a78bfa" }}
                activeDot={{ r: 7 }}
                animationDuration={1800}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
     
      {/* Animated summary cards */}
      <div className="flex flex-col md:flex-row gap-6 justify-center items-stretch">
        <div className="flex-1 bg-gradient-to-r from-blue-400 to-blue-600 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center animate-pop-in">
          <span className="text-4xl font-extrabold mb-2 animate-count" style={{ animationDelay: "0.1s" }}>
            {data.totalHeadCount}
          </span>
          <span className="text-lg font-medium">Total Head Count</span>
        </div>
        <div className="flex-1 bg-gradient-to-r from-cyan-400 to-blue-400 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center animate-pop-in">
          <span className="text-4xl font-extrabold mb-2 animate-count" style={{ animationDelay: "0.2s" }}>
            {data.totalBillableHours}
          </span>
          <span className="text-lg font-medium">Total Billable Hours</span>
        </div>
        <div className="flex-1 bg-gradient-to-r from-amber-400 to-pink-500 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center animate-pop-in">
          <span className="text-4xl font-extrabold mb-2 animate-count" style={{ animationDelay: "0.3s" }}>
            {CURRENCY_SYMBOLS[currency] || ''}{data.totalMonthlyCost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-lg font-medium">Total Monthly Cost</span>
        </div>
        <div className="flex-1 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-2xl shadow-lg p-6 flex flex-col items-center animate-pop-in">
          <span className="text-4xl font-extrabold mb-2 animate-count" style={{ animationDelay: "0.4s" }}>
            {CURRENCY_SYMBOLS[currency] || ''}{avgExpenseRate.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
          <span className="text-lg font-medium">Avg. Expense Rate</span>
        </div>
      </div>

      {/* Animations (TailwindCSS custom keyframes or add to your CSS) */}
      <style>
        {`
          .animate-fade-in {
            animation: fadeIn 1s ease;
          }
          .animate-slide-in-up {
            animation: slideInUp 1.1s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animate-pop-in {
            animation: popIn 0.8s cubic-bezier(0.23, 1, 0.32, 1);
          }
          .animate-count {
            animation: countUp 1.2s cubic-bezier(0.23, 1, 0.32, 1);
          }
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes slideInUp {
            from { opacity: 0; transform: translateY(40px);}
            to { opacity: 1; transform: translateY(0);}
          }
          @keyframes popIn {
            0% { opacity: 0; transform: scale(0.8);}
            80% { opacity: 1; transform: scale(1.05);}
            100% { opacity: 1; transform: scale(1);}
          }
          @keyframes countUp {
            from { opacity: 0.5; }
            to { opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default Payroll;
