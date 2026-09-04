import { NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ElectronicsProduct from "@/models/ElectronicsProduct"
import { getCache, setCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(request: Request, { params }: RouteContext) {
  const { slug } = await params
  const variantSku = new URL(request.url).searchParams.get("variant")
  const cacheKey = `v5:electronics:product:${slug}:${variantSku || "default"}`

  const cached = await getCache<unknown>(cacheKey)
  if (cached) return NextResponse.json(cached)

  try {
    await connectDB()
    const product = await ElectronicsProduct.findOne({ slug: slug.toLowerCase(), isActive: true }).lean()

    if (!product) {
      return NextResponse.json({ success: false, error: "Electronics product not found" }, { status: 404 })
    }

    const selectedVariant = variantSku
      ? product.variants.find((variant) => variant.sku.toLowerCase() === variantSku.toLowerCase())
      : product.variants[0]

    if (!selectedVariant) {
      return NextResponse.json({ success: false, error: "Product variant not found" }, { status: 404 })
    }

    const response = { success: true, product, selectedVariant }
    await setCache(cacheKey, response, 120)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Electronics Product API] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to load electronics product" }, { status: 500 })
  }
}
