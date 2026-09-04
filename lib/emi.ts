export type EmiPlanInput = {
  tenureMonths: number
  monthlyAmount?: number
  interestRate: number
  cashbackAmount?: number
  provider?: string
}

export function calculateMonthlyAmount(price: number, tenureMonths: number, interestRate: number) {
  const principal = Number(price) || 0
  const months = Math.max(Number(tenureMonths) || 1, 1)
  const rate = Math.max(Number(interestRate) || 0, 0)
  return Math.ceil((principal * (1 + rate / 100)) / months)
}

export function normalizeEmiPlans(price: number, plans: EmiPlanInput[] = []) {
  return plans
    .filter((plan) => Number(plan.tenureMonths) > 0)
    .map((plan) => ({
      tenureMonths: Number(plan.tenureMonths),
      monthlyAmount: calculateMonthlyAmount(price, plan.tenureMonths, plan.interestRate),
      interestRate: Number(plan.interestRate) || 0,
      cashbackAmount: Number(plan.cashbackAmount) || 0,
      provider: plan.provider || "Mutual Funds Partner",
    }))
}
