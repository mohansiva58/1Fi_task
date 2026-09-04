import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ElectronicsProduct from "@/models/ElectronicsProduct"
import { getEmiPlanForTenure } from "@/lib/emi"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const slug = typeof body.slug === "string" ? body.slug.toLowerCase() : ""
    const sku = typeof body.variantSku === "string" ? body.variantSku.toUpperCase() : ""
    const tenureMonths = Number(body.tenureMonths)

    if (!slug || !sku || !Number.isInteger(tenureMonths) || tenureMonths <= 0) {
      return NextResponse.json({ success: false, error: "slug, variantSku, and a valid tenureMonths are required" }, { status: 400 })
    }

    await connectDB()
    const product = await ElectronicsProduct.findOne({ slug, isActive: true }).lean()
    const variant = product?.variants.find((item) => item.sku === sku)
    const plan = variant ? getEmiPlanForTenure(variant.price, tenureMonths) : null

    if (!product || !variant || !plan) {
      return NextResponse.json({ success: false, error: "Selected product, variant, or EMI plan was not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      quote: {
        productSlug: product.slug,
        productName: product.name,
        variantSku: variant.sku,
        variant: variant.label,
        tenureMonths: plan.tenureMonths,
        monthlyAmount: plan.monthlyAmount,
        interestRate: plan.interestRate,
        cashbackAmount: plan.cashbackAmount,
        provider: plan.provider,
        totalPayable: plan.totalPayable,
      },
    })
  } catch (error) {
    console.error("[Electronics EMI API] POST error:", error)
    return NextResponse.json({ success: false, error: "Failed to create EMI quote" }, { status: 500 })
  }
}
