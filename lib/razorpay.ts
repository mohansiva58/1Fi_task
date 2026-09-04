import Razorpay from "razorpay"

let razorpayInstance: Razorpay | null = null

export function getRazorpayClient(): Razorpay {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error("Razorpay credentials (RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET) are missing in environment variables.")
  }

  if (!razorpayInstance) {
    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    })
  }

  return razorpayInstance
}

// Lazy getter proxy for backward compatibility with direct razorpay imports
export const razorpay = new Proxy({} as Razorpay, {
  get(_target, prop) {
    const client = getRazorpayClient()
    const val = (client as any)[prop]
    if (typeof val === "function") {
      return val.bind(client)
    }
    return val
  },
})

// Razorpay configuration
export const RAZORPAY_CONFIG = {
  get keyId() {
    return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID || ""
  },
  currency: "INR",
  name: "EMI Platform",
  description: "Electronics with flexible EMI plans",
  image: "/logo.png", // Your logo
  prefill: {
    name: "",
    email: "",
    contact: "",
  },
  theme: {
    color: "#000000", // Your brand color
  },
}

// Create Razorpay order
export async function createRazorpayOrder(amount: number, receipt?: string) {
  try {
    const client = getRazorpayClient()
    const order = await client.orders.create({
      amount: Math.round(amount * 100), // Amount in paise (multiply by 100)
      currency: RAZORPAY_CONFIG.currency,
      receipt: receipt || `order_${Date.now()}`,
      notes: {
        merchant: "EMI Platform",
      },
    })
    return order
  } catch (error) {
    console.error("Error creating Razorpay order:", error)
    throw error
  }
}

// Verify Razorpay payment signature
export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  try {
    const secret = process.env.RAZORPAY_KEY_SECRET
    if (!secret) {
      console.error("RAZORPAY_KEY_SECRET is missing during signature verification")
      return false
    }

    const crypto = require("crypto")
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex")

    return generatedSignature === signature
  } catch (error) {
    console.error("Error verifying payment signature:", error)
    return false
  }
}

// Fetch payment details
export async function getPaymentDetails(paymentId: string) {
  try {
    const client = getRazorpayClient()
    const payment = await client.payments.fetch(paymentId)
    return payment
  } catch (error) {
    console.error("Error fetching payment details:", error)
    throw error
  }
}

// Refund payment
export async function refundPayment(paymentId: string, amount?: number) {
  try {
    const client = getRazorpayClient()
    const refund = await client.payments.refund(paymentId, {
      amount: amount ? Math.round(amount * 100) : undefined, // Amount in paise
      speed: "normal",
    })
    return refund
  } catch (error) {
    console.error("Error processing refund:", error)
    throw error
  }
}

