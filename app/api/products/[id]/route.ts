import { MongoClient, ObjectId } from "mongodb"
import { NextResponse } from "next/server"
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

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { id } = await params
  const variantSku = new URL(request.url).searchParams.get("variant")
  const cacheKey = `v5:electronics:detail:${id}:${variantSku || "default"}`
  const cached = await getCache<unknown>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    const client = await getClient()
    const db = client.db(process.env.MONGODB_DATABASE || "emiplatform")
    const filter = ObjectId.isValid(id) ? { $or: [{ slug: id.toLowerCase() }, { _id: new ObjectId(id) }], isActive: true } : { slug: id.toLowerCase(), isActive: true }
    const product = await db.collection("electronics_products").findOne(filter)

    if (!product) return NextResponse.json({ success: false, error: "Electronics product not found" }, { status: 404 })

    const selectedVariant = variantSku
      ? product.variants?.find((variant) => variant.sku.toLowerCase() === variantSku.toLowerCase())
      : product.variants?.[0]

    if (!selectedVariant) return NextResponse.json({ success: false, error: "Product variant not found" }, { status: 404 })

    const normalizedVariant = {
      ...selectedVariant,
      price: Number(selectedVariant.price) || 0,
      mrp: Number(selectedVariant.mrp) || Number(selectedVariant.price) || 0,
      stockQuantity: Number(selectedVariant.stockQuantity) || 0,
      inStock: selectedVariant.inStock !== false && Number(selectedVariant.stockQuantity) > 0,
      images: selectedVariant.images?.length ? selectedVariant.images : product.images || [],
      emiPlans: normalizeEmiPlans(Number(selectedVariant.price) || 0, selectedVariant.emiPlans),
    }
    const flattenedProduct = {
      ...product,
      _id: product._id.toString(),
      price: normalizedVariant.price,
      mrp: normalizedVariant.mrp,
      discount: normalizedVariant.mrp ? Math.round(((normalizedVariant.mrp - normalizedVariant.price) / normalizedVariant.mrp) * 100) : 0,
      images: normalizedVariant.images,
      colors: product.variants?.map((variant) => variant.color) || [],
      sizes: product.variants?.map((variant) => variant.storage).filter(Boolean) || [],
      stockQuantity: normalizedVariant.stockQuantity,
      inStock: normalizedVariant.inStock,
      variants: product.variants?.map((variant) => ({
        ...variant,
        price: Number(variant.price) || 0,
        mrp: Number(variant.mrp) || Number(variant.price) || 0,
        stockQuantity: Number(variant.stockQuantity) || 0,
        inStock: variant.inStock !== false && Number(variant.stockQuantity) > 0,
        images: variant.images?.length ? variant.images : product.images || [],
        emiPlans: normalizeEmiPlans(Number(variant.price) || 0, variant.emiPlans),
      })),
    }

    const response = {
      success: true,
      data: flattenedProduct,
      product: flattenedProduct,
      selectedVariant: normalizedVariant,
    }
    await setCache(cacheKey, response, 120)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Products Detail API] Electronics GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to load electronics product" }, { status: 500 })
  }
}
