import { NextRequest, NextResponse } from "next/server"
import connectDB from "@/lib/mongodb"
import ElectronicsProduct from "@/models/ElectronicsProduct"
import { getCache, setCache } from "@/lib/cache"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const category = searchParams.get("category")
  const brand = searchParams.get("brand")
  const limit = Math.min(Math.max(Number(searchParams.get("limit") || 12), 1), 50)

  const cacheKey = `v5:electronics:products:${category || "all"}:${brand || "all"}:${limit}`
  const cached = await getCache<unknown>(cacheKey)
  if (cached) {
    return NextResponse.json(cached, { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } })
  }

  try {
    await connectDB()
    const query: Record<string, unknown> = { isActive: true }
    if (category) query.category = category.toLowerCase()
    if (brand) query.brand = new RegExp(`^${brand}$`, "i")

    const products = await ElectronicsProduct.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .select("name slug brand category description features images variants createdAt updatedAt")
      .lean()

    const response = { success: true, count: products.length, products }
    await setCache(cacheKey, response, 60)
    return NextResponse.json(response)
  } catch (error) {
    console.error("[Electronics Products API] GET error:", error)
    return NextResponse.json({ success: false, error: "Failed to load electronics products" }, { status: 500 })
  }
}
