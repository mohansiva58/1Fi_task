import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import Product, { productToJSON } from '@/models/Product'

export async function GET(request: NextRequest) {
  try {
    await connectDB()
    const params = request.nextUrl.searchParams
    const search = params.get('search')?.trim()
    const category = params.get('category')
    const limit = Math.min(Math.max(Number(params.get('limit') || 24), 1), 50)
    const filter: Record<string, any> = {}
    if (search) filter.$text = { $search: search }
    if (category && category !== 'all') filter.category = category
    const products = await Product.find(filter).sort(search ? { score: { $meta: 'textScore' } } : { createdAt: -1 }).limit(limit).lean()
    const transformed = products.map((product: any) => ({ ...product, _id: product._id.toString(), id: product._id.toString() }))
    return NextResponse.json({ success: true, products: transformed, data: transformed, total: transformed.length })
  } catch (error) {
    console.error('[v0] Products GET error', error)
    return NextResponse.json({ success: false, error: 'Unable to load products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB()
    const body = await request.json()
    if (!body.name || !body.brand || !body.slug || !Array.isArray(body.variants) || body.variants.length < 2 || !Array.isArray(body.emiPlans) || body.emiPlans.length < 3) {
      return NextResponse.json({ success: false, error: 'Name, brand, slug, 2+ variants and 3+ EMI plans are required' }, { status: 400 })
    }
    const product = await Product.create({ ...body, stockQuantity: body.variants.reduce((sum: number, item: any) => sum + Number(item.stock || 0), 0) })
    return NextResponse.json({ success: true, product: productToJSON(product) }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.code === 11000 ? 'Slug already exists' : 'Unable to create product' }, { status: error.code === 11000 ? 409 : 500 })
  }
}
