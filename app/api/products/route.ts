import { MongoClient } from "mongodb"
import { NextRequest, NextResponse } from "next/server"
import { getCache, setCache } from "@/lib/cache"
import { normalizeEmiPlans } from "@/lib/emi"

export const dynamic = "force-dynamic"

const uri = process.env.MONGODB_URI
if (!uri) throw new Error("MONGODB_URI is required")

let cachedClient: MongoClient | null = null

async function getClient() {
  if (!cachedClient) {
    cachedClient = new MongoClient(uri, { maxPoolSize: 10, minPoolSize: 2 })
    await cachedClient.connect()
  }
  return cachedClient
}

function matchesCategory(category: string | null, product: { category?: string }) {
  return !category || category === "all" || product.category?.toLowerCase() === category.toLowerCase()
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const search = searchParams.get("search")?.trim().toLowerCase()
  const page = Math.max(Number(searchParams.get("page") || 1), 1)
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 24), 1), 50)
  const cacheKey = `v5:electronics:catalog:${category || "all"}:${search || "all"}:${page}:${limit}`

  const cached = await getCache<unknown>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = await getClient()
    const db = client.db(process.env.MONGODB_DATABASE || "emiplatform")
    const products = await db.collection("electronics_products")
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray()

    const filtered = products.filter((product) => {
      if (!matchesCategory(category, product)) return false
      if (!search) return true
      return `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(search)
    })

    const total = filtered.length
    const paginated = filtered.slice((page - 1) * limit, page * limit)
    const data = paginated.map((product) => {
      const variants = Array.isArray(product.variants) ? product.variants : []
      const productImgs = Array.isArray(product.images) ? product.images : []
      const variantImgs = variants.flatMap((item: any) => (Array.isArray(item.images) ? item.images : []))
      const combinedImages = Array.from(new Set([...productImgs, ...variantImgs])).filter(Boolean)

      return {
        ...product,
        _id: product._id.toString(),
        price: variant?.price || 0,
        mrp: variant?.mrp || 0,
        discount: variant?.mrp ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0,
        images: combinedImages.length > 0 ? combinedImages : ["/placeholder.jpg"],
        colors: variants.map((item) => item.color).filter(Boolean),
        sizes: variants.map((item) => item.storage).filter(Boolean),
        stockQuantity: variant?.stockQuantity || 0,
        inStock: variant?.inStock ?? false,
        emiPlans: normalizeEmiPlans(variant?.price || 0, Array.isArray(variant?.emiPlans) ? variant.emiPlans : []),
      }
    })

    const response = { success: true, data, total, totalPages: Math.ceil(total / limit), page, limit }
    await setCache(cacheKey, response, 60)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Products API] Electronics GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to load electronics products" }, { status: 500 })
  }
}
