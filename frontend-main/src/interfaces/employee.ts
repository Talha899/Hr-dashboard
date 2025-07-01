export interface HourlyRate {
  amount: number;
  currency: 'USD' | 'EUR' | 'PKR';
}

export interface ExpenseRate {
  amount: number;
  currency: string; // Should be uppercase, e.g., 'USD', 'EUR', 'PKR'
}

export type EmployeeStatus = 'active' | 'resigned';

export interface Employee {
  _id?: string;
  name: string;
  email: string;
  password?: string;
  dept: string;
  title: string;
  status: EmployeeStatus;
  hourlyRate: HourlyRate;
  expenseRate?: ExpenseRate;
  hireDate?: string;
  daysOff: number;
}
