import { NextResponse } from "next/server"
import { createRazorpayOrder } from "@/lib/razorpay"
import { applyRateLimit, getRateLimitIdentifier } from "@/lib/rate-limit"
import { validateData, createPaymentOrderSchema } from "@/lib/validation"
import connectDB from "@/lib/mongodb"
import ElectronicsProduct from "@/models/ElectronicsProduct"
import { getEmiPlanForTenure } from "@/lib/emi"
import mongoose from "mongoose"

export async function POST(request: Request) {
  try {
    // Apply strict rate limiting for payment endpoints
    const identifier = getRateLimitIdentifier(request)
    const rateLimitResult = await applyRateLimit(identifier, 'payment')
    if ('status' in rateLimitResult) return rateLimitResult

    const body = await request.json()
    
    // Validate input
    const validation = validateData(createPaymentOrderSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      return NextResponse.json({ success: false, error: "Razorpay is not configured. Add valid test or live credentials." }, { status: 503 })
    }

    // Check if this is an EMI order creation request
    if ("productId" in validation.data && "variantSku" in validation.data) {
      const { productId, variantSku, tenureMonths, receipt } = validation.data
      await connectDB()

      const filter = mongoose.Types.ObjectId.isValid(productId)
        ? { $or: [{ _id: new mongoose.Types.ObjectId(productId) }, { slug: productId.toLowerCase() }], isActive: true }
        : { slug: productId.toLowerCase(), isActive: true }

      const product = await ElectronicsProduct.findOne(filter).lean()
      if (!product) {
        return NextResponse.json({ success: false, error: "Product not found or unavailable" }, { status: 404 })
      }

      const variant = product.variants?.find((v) => v.sku.toUpperCase() === variantSku.toUpperCase())
      if (!variant) {
        return NextResponse.json({ success: false, error: "Product variant not found" }, { status: 404 })
      }

      if (variant.inStock === false || (variant.stockQuantity !== undefined && variant.stockQuantity <= 0)) {
        return NextResponse.json({ success: false, error: "Selected product variant is out of stock" }, { status: 400 })
      }

      const sellingPrice = Number(variant.price)
      if (!sellingPrice || sellingPrice <= 0) {
        return NextResponse.json({ success: false, error: "Invalid product variant price" }, { status: 400 })
      }

      const emiPlan = getEmiPlanForTenure(sellingPrice, tenureMonths)
      if (!emiPlan) {
        return NextResponse.json({ success: false, error: "Invalid or unsupported EMI tenure requested" }, { status: 400 })
      }

      // Create Razorpay order with the variant's selling price (standard payment amount)
      const order = await createRazorpayOrder(sellingPrice, receipt || `emi_${Date.now()}`)

      return NextResponse.json({
        success: true,
        order: {
          id: order.id,
          amount: order.amount,
          currency: order.currency,
          receipt: order.receipt,
        },
        emiPlan: {
          tenureMonths: emiPlan.tenureMonths,
          monthlyAmount: emiPlan.monthlyAmount,
          interestRate: emiPlan.interestRate,
          cashbackAmount: emiPlan.cashbackAmount,
          provider: emiPlan.provider,
          totalPayable: emiPlan.totalPayable,
          sellingPrice,
        },
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
      })
    }

    // Standard payment flow (full payment from checkout)
    const { amount, receipt } = validation.data
    const order = await createRazorpayOrder(amount, receipt)

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
      },
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID,
    })
  } catch (error: any) {
    console.error("Create order error:", error)
    const providerMessage = error?.error?.description || error?.message
    const isAuthError = error?.statusCode === 401 || providerMessage === "Authentication failed"
    return NextResponse.json(
      {
        success: false,
        error: isAuthError
          ? "Payment gateway authentication failed. Please verify Razorpay credentials."
          : (providerMessage || "Failed to create payment order"),
      },
      { status: isAuthError ? 401 : 500 }
    )
  }
}
