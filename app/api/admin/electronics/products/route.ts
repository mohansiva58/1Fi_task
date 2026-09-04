import { MongoClient } from "mongodb"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { deleteCachePattern } from "@/lib/cache"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("MONGODB_URI is required")

let client: MongoClient | null = null
async function getDatabase() {
  if (!client) {
    client = new MongoClient(uri, { maxPoolSize: 10 })
    await client.connect()
  }
  return client.db(process.env.MONGODB_DATABASE || "emiplatform")
}

export async function POST(request: Request) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const body = await request.json()
    const variants = Array.isArray(body.variants) ? body.variants : []
    if (!body.name || !body.brand || !["smartphones", "laptops", "earpods", "watches", "tablets", "accessories"].includes(body.category) || variants.length < 1) {
      return NextResponse.json({ success: false, error: "Name, brand, valid category, and at least one variant are required" }, { status: 400 })
    }

    const slug = String(body.slug || body.name).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    const product = {
      name: String(body.name).trim(),
      slug,
      brand: String(body.brand).trim(),
      category: body.category,
      description: String(body.description || "").trim(),
      features: Array.isArray(body.features) ? body.features : [],
      images: Array.isArray(body.images) ? body.images : [],
      variants: variants.map((variant: Record<string, unknown>) => ({
        sku: String(variant.sku || "").trim().toUpperCase(),
        label: String(variant.label || "").trim(),
        storage: String(variant.storage || "").trim(),
        color: String(variant.color || "").trim(),
        finish: String(variant.finish || "").trim(),
        mrp: Number(variant.mrp) || 0,
        price: Number(variant.price) || 0,
        images: Array.isArray(variant.images) && variant.images.length ? variant.images : body.images || [],
        stockQuantity: Number(variant.stockQuantity) || 0,
        inStock: Number(variant.stockQuantity) > 0,
        emiPlans: Array.isArray(variant.emiPlans) ? variant.emiPlans.map((plan: Record<string, unknown>) => ({
          tenureMonths: Number(plan.tenureMonths),
          monthlyAmount: Number(plan.monthlyAmount),
          interestRate: Number(plan.interestRate),
          cashbackAmount: Number(plan.cashbackAmount) || 0,
          provider: String(plan.provider || "Mutual Funds Partner"),
        })) : [],
      })),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const db = await getDatabase()
    const result = await db.collection("electronics_products").insertOne(product)
    await deleteCachePattern("v5:electronics:*")
    await deleteCachePattern("v2:products:*")
    return NextResponse.json({ success: true, product: { ...product, _id: result.insertedId.toString() } }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create product"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
