const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const currencyRates = { USD: 1, PKR: 277, EUR: 0.92 }; // Simplified

function getBusinessDays(month) {
  const [year, mon] = month.split('-').map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 0);
  let count = 0;
  while (start <= end) {
    const day = start.getDay();
    if (day !== 0 && day !== 6) count++;
    start.setDate(start.getDate() + 1);
  }
  return count;
}

function convertCurrency(amount, from, to) {
  const rate = currencyRates[to] / currencyRates[from];
  return amount * rate;
}

router.get('/summary', async (req, res) => {
  try {
    const { month, currency = 'USD' } = req.query;
    const [year, mon] = month.split('-').map(Number);
    const workdays = getBusinessDays(month);
    const monthStart = new Date(year, mon - 1, 1);
    const monthEnd = new Date(year, mon, 0);

    const employees = await Employee.find({ status: 'active' });

    const deptSummary = {};
    let totalHeadCount = 0, totalBillableHours = 0, totalMonthlyCost = 0;

    for (const emp of employees) {
      const unpaidHolidays = emp.holidays.filter(h =>
        h.kind === 'unpaid' &&
        h.date >= monthStart && h.date <= monthEnd
      ).length;

      const billableHours = (workdays - unpaidHolidays) * 8;

      // Use latest raise or base rate
      const raises = emp.raises.filter(r => r.date <= monthEnd);
      raises.sort((a, b) => b.date - a.date);
      const rateObj = raises.length ? raises[0] : emp.hourlyRate;
      const localMonthlyCost = billableHours * rateObj.amount;
      const monthlyCost = convertCurrency(localMonthlyCost, rateObj.currency, currency);

      // Dept-wise aggregation
      if (!deptSummary[emp.dept]) {
        deptSummary[emp.dept] = {
          dept: emp.dept,
          headCount: 0,
          billableHours: 0,
          monthlyCost: 0
        };
      }

      deptSummary[emp.dept].headCount++;
      deptSummary[emp.dept].billableHours += billableHours;
      deptSummary[emp.dept].monthlyCost += monthlyCost;

      totalHeadCount++;
      totalBillableHours += billableHours;
      totalMonthlyCost += monthlyCost;
    }

    res.json({
      byDept: Object.values(deptSummary),
      totalHeadCount,
      totalBillableHours,
      totalMonthlyCost: +totalMonthlyCost.toFixed(2)
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
