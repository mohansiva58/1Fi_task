import { MongoClient, ObjectId } from "mongodb"
import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/admin-auth"
import { deleteCachePattern } from "@/lib/cache"
import { normalizeEmiPlans } from "@/lib/emi"

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

type RouteContext = { params: Promise<{ id: string }> }

// GET - Get single electronics product by ID or slug
export async function GET(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const db = await getDatabase()
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { slug: id.toLowerCase() }] }
      : { slug: id.toLowerCase() }

    const product = await db.collection("electronics_products").findOne(filter)
    if (!product) {
      return NextResponse.json({ success: false, error: "Electronics product not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        _id: product._id.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch electronics product"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT - Update single electronics product by ID
export async function PUT(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const body = await request.json()
    const variants = Array.isArray(body.variants) ? body.variants : []

    if (!body.name || !body.brand || !["smartphones", "laptops", "earpods", "watches", "tablets", "accessories"].includes(body.category) || variants.length < 1) {
      return NextResponse.json(
        { success: false, error: "Name, brand, valid category, and at least one variant are required" },
        { status: 400 }
      )
    }

    const slug = String(body.slug || body.name)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const updateDoc = {
      name: String(body.name).trim(),
      slug,
      brand: String(body.brand).trim(),
      category: body.category,
      description: String(body.description || "").trim(),
      features: Array.isArray(body.features) ? body.features.filter(Boolean) : [],
      images: Array.isArray(body.images) ? body.images.filter(Boolean) : [],
      variants: variants.map((variant: Record<string, any>) => {
        const price = Number(variant.price) || 0
        const mrp = Number(variant.mrp) || price || 0
        const stockQuantity = Number(variant.stockQuantity) || 0
        return {
          sku: String(variant.sku || "").trim().toUpperCase(),
          label: String(variant.label || "").trim(),
          storage: String(variant.storage || "").trim(),
          color: String(variant.color || "").trim(),
          finish: String(variant.finish || "").trim(),
          mrp,
          price,
          images: Array.isArray(variant.images) && variant.images.length ? variant.images : (Array.isArray(body.images) ? body.images : []),
          stockQuantity,
          inStock: stockQuantity > 0 && variant.inStock !== false,
          emiPlans: normalizeEmiPlans(price, variant.emiPlans),
        }
      }),
      isActive: body.isActive !== false,
      updatedAt: new Date(),
    }

    const db = await getDatabase()
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { slug: id.toLowerCase() }] }
      : { slug: id.toLowerCase() }

    const result = await db.collection("electronics_products").findOneAndUpdate(
      filter,
      { $set: updateDoc },
      { returnDocument: "after" }
    )

    if (!result) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    await deleteCachePattern("v5:electronics:*")
    return NextResponse.json({
      success: true,
      product: {
        ...result,
        _id: result._id.toString(),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to update product"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// DELETE - Delete single electronics product by ID
export async function DELETE(request: Request, { params }: RouteContext) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { id } = await params
    const db = await getDatabase()
    const filter = ObjectId.isValid(id)
      ? { $or: [{ _id: new ObjectId(id) }, { slug: id.toLowerCase() }] }
      : { slug: id.toLowerCase() }

    const result = await db.collection("electronics_products").deleteOne(filter)
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Product not found" }, { status: 404 })
    }

    await deleteCachePattern("v5:electronics:*")
    return NextResponse.json({ success: true, message: "Product deleted successfully" })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to delete product"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
