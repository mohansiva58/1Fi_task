export type EmiPlanInput = {
  tenureMonths: number
  monthlyAmount?: number
  interestRate: number
  cashbackAmount?: number
  provider?: string
}

export interface FixedEmiRule {
  tenureMonths: number
  interestRate: number
  provider?: string
  cashbackAmount?: number
}

// Fixed system-level EMI plans
export const FIXED_EMI_RULES: FixedEmiRule[] = [
  { tenureMonths: 3, interestRate: 0, provider: "Mutual Funds Partner", cashbackAmount: 7500 },
  { tenureMonths: 6, interestRate: 0, provider: "Mutual Funds Partner", cashbackAmount: 7500 },
  { tenureMonths: 12, interestRate: 0, provider: "Mutual Funds Partner", cashbackAmount: 7500 },
  { tenureMonths: 24, interestRate: 0, provider: "Mutual Funds Partner", cashbackAmount: 7500 },
  { tenureMonths: 36, interestRate: 10.5, provider: "Mutual Funds Partner", cashbackAmount: 5000 },
  { tenureMonths: 48, interestRate: 10.5, provider: "Mutual Funds Partner", cashbackAmount: 5000 },
  { tenureMonths: 60, interestRate: 10.5, provider: "Mutual Funds Partner", cashbackAmount: 5000 },
]

export function calculateMonthlyAmount(price: number, tenureMonths: number, interestRate: number) {
  const principal = Number(price) || 0
  const months = Math.max(Number(tenureMonths) || 1, 1)
  const rate = Math.max(Number(interestRate) || 0, 0)
  return Math.ceil((principal * (1 + rate / 100)) / months)
}

export function getFixedEmiPlans(price: number) {
  const principal = Number(price) || 0
  return FIXED_EMI_RULES.map((rule) => {
    const monthly = calculateMonthlyAmount(principal, rule.tenureMonths, rule.interestRate)
    return {
      tenureMonths: rule.tenureMonths,
      monthlyAmount: monthly,
      interestRate: rule.interestRate,
      cashbackAmount: rule.cashbackAmount || 0,
      provider: rule.provider || "Mutual Funds Partner",
      totalPayable: monthly * rule.tenureMonths,
    }
  })
}

export function getEmiPlanForTenure(price: number, tenureMonths: number) {
  const rule = FIXED_EMI_RULES.find((item) => item.tenureMonths === Number(tenureMonths))
  if (!rule) return null
  const monthly = calculateMonthlyAmount(price, rule.tenureMonths, rule.interestRate)
  return {
    tenureMonths: rule.tenureMonths,
    monthlyAmount: monthly,
    interestRate: rule.interestRate,
    cashbackAmount: rule.cashbackAmount || 0,
    provider: rule.provider || "Mutual Funds Partner",
    totalPayable: monthly * rule.tenureMonths,
  }
}

export function normalizeEmiPlans(price: number, plans?: EmiPlanInput[]) {
  if (Array.isArray(plans) && plans.length > 0) {
    return plans
      .filter((plan) => Number(plan.tenureMonths) > 0)
      .map((plan) => ({
        tenureMonths: Number(plan.tenureMonths),
        monthlyAmount: calculateMonthlyAmount(price, plan.tenureMonths, plan.interestRate),
        interestRate: Number(plan.interestRate) || 0,
        cashbackAmount: Number(plan.cashbackAmount) || 0,
        provider: plan.provider || "Mutual Funds Partner",
        totalPayable: calculateMonthlyAmount(price, plan.tenureMonths, plan.interestRate) * Number(plan.tenureMonths),
      }))
  }
  return getFixedEmiPlans(price)
}
