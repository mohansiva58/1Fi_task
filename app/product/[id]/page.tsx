"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, Share2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import ProductCard from "@/components/product-card"
import { useWishlist } from "@/hooks/use-wishlist"

type EmiPlan = { tenureMonths: number; monthlyAmount: number; interestRate: number; cashbackAmount: number; provider: string }
type Variant = { sku: string; label: string; storage?: string; color: string; finish?: string; price: number; mrp: number; images: string[]; stockQuantity: number; inStock: boolean; emiPlans: EmiPlan[] }
type Product = { _id: string; name: string; brand: string; category: string; description?: string; images: string[]; variants: Variant[] }

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [tenure, setTenure] = useState(12)
  const [imageIndex, setImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [similarProducts, setSimilarProducts] = useState<Product[]>([])
  const { user, setShowLoginModal } = useAuth()
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    let cancelled = false
    params.then(async ({ id }) => {
      const variantSku = searchParams.get("variant")
      const variantQuery = variantSku ? `?variant=${encodeURIComponent(variantSku)}` : ""
      try {
        const response = await fetch(`/api/products/${id}${variantQuery}`)
        const data = await response.json()
        if (!response.ok || !data.success) throw new Error(data.error || "Product not found")
        if (!cancelled) {
          setProduct(data.data)
          setVariant(data.selectedVariant)
          setTenure(data.selectedVariant.emiPlans.some((plan: EmiPlan) => plan.tenureMonths === 12) ? 12 : data.selectedVariant.emiPlans[0]?.tenureMonths || 12)
        }
      } catch (fetchError) {
        if (!cancelled) setError(fetchError instanceof Error ? fetchError.message : "Product not found")
      } finally {
        if (!cancelled) setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [params, searchParams])

  useEffect(() => {
    if (!product) return
    fetch(`/api/products?category=${encodeURIComponent(product.category)}&limit=8&sort=newest`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Similar products request failed: ${response.status}`)
        const result = await response.json()
        setSimilarProducts((result.data || []).filter((item: Product) => item._id !== product._id).slice(0, 4))
      })
      .catch(() => setSimilarProducts([]))
  }, [product])

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading product...</main>
  if (error || !product || !variant) return <main className="flex min-h-screen flex-col items-center justify-center gap-4"><p className="text-gray-600">{error || "Product not found"}</p><Link href="/shop" className="bg-black px-5 py-3 text-sm font-semibold text-white">Back to shop</Link></main>

  const images = variant.images.length ? variant.images : product.images
  const plan = variant.emiPlans.find((item) => item.tenureMonths === tenure) || variant.emiPlans[0]
  const discount = variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0
  const isOutOfStock = !variant.inStock || variant.stockQuantity <= 0
  const wishlisted = isInWishlist(product._id)

  function selectVariant(nextVariant: Variant) {
    setVariant(nextVariant)
    setImageIndex(0)
    setTenure(nextVariant.emiPlans.some((item) => item.tenureMonths === 12) ? 12 : nextVariant.emiPlans[0]?.tenureMonths || 12)
  }

  function buyNow() {
    if (isOutOfStock) return
    if (!user) {
      setShowLoginModal(true)
      return
    }
    addItem({ id: product._id, name: `${product.name} - ${variant.label}`, price: variant.price, image: images[0] || "/placeholder.svg", color: variant.color, size: variant.storage, quantity })
    router.push("/checkout")
  }

  function addToCart() {
    if (isOutOfStock) return
    addItem({ id: product._id, name: `${product.name} - ${variant.label}`, price: variant.price, image: images[0] || "/placeholder.svg", color: variant.color, size: variant.storage, quantity })
  }

  return <main className="min-h-screen bg-white text-[#17202a]">
    <div className="border-b border-gray-100 bg-[#f4f7f9] px-6 py-4 text-sm"><div className="mx-auto max-w-7xl"><Link href="/shop" className="text-[#0d365c]">Shop on EMI</Link><span className="mx-3">›</span><Link href={`/shop?category=${product.category}`} className="text-[#0d365c]">{product.category}</Link><span className="mx-3">›</span><span className="font-semibold">{product.name} ({variant.label})</span></div></div>
    <div className="mx-auto grid max-w-7xl gap-10 px-6 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
      <section className="grid gap-5 md:grid-cols-[82px_1fr]">
        <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col">{images.map((image, index) => <button key={`${image}-${index}`} onClick={() => setImageIndex(index)} className={`h-20 w-20 shrink-0 overflow-hidden border-2 bg-white ${imageIndex === index ? "border-orange-500" : "border-gray-200"}`}><img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-contain" /></button>)}</div>
        <div className="order-1 relative flex min-h-[420px] items-center justify-center bg-[#f7f8f9] md:order-2 lg:min-h-[600px]"><img src={images[imageIndex] || "/placeholder.svg"} alt={product.name} className="max-h-[600px] w-full object-contain p-8" /><button onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)} aria-label="Previous image" className="absolute left-3 top-1/2 border border-gray-200 bg-white p-2"><ChevronLeft size={18} /></button><button onClick={() => setImageIndex((imageIndex + 1) % images.length)} aria-label="Next image" className="absolute right-3 top-1/2 border border-gray-200 bg-white p-2"><ChevronRight size={18} /></button><div className="absolute bottom-4 left-4 bg-cyan-600 px-3 py-1 text-xs font-semibold text-white">{discount}% Cashback eligible</div></div>
        <div className="order-3 flex items-center justify-between md:col-start-2"><div><p className="mb-2 text-sm font-semibold text-gray-600">Color</p><div className="flex flex-wrap gap-2">{product.variants.map((item) => <button key={item.sku} onClick={() => selectVariant(item)} className={`border px-3 py-2 text-sm ${variant.sku === item.sku ? "border-orange-500 bg-orange-50" : "border-gray-300"}`}>{item.color}</button>)}</div></div><div className="flex gap-2"><button aria-label="Add to wishlist" onClick={() => toggleWishlist({ id: product._id, name: product.name, price: variant.price, image: images[0] || "/placeholder.svg" })} className={`border p-2 ${wishlisted ? "border-red-500 bg-red-50 text-red-600" : "border-gray-300"}`}><Heart size={18} fill={wishlisted ? "currentColor" : "none"} /></button><button aria-label="Share product" onClick={() => { if (navigator.share) navigator.share({ title: product.name, text: `View ${product.name} on EMI Platform`, url: window.location.href }); else navigator.clipboard?.writeText(window.location.href) }} className="border border-gray-300 p-2"><Share2 size={18} /></button></div></div>
      </section>
      <section className="lg:pt-1">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">{product.brand}</p><h1 className="text-2xl font-bold leading-tight md:text-3xl">{product.name} ({variant.color}, {variant.storage})</h1><p className="mt-2 text-base text-gray-600">{variant.finish ? `Storage: ${variant.storage}, Color: ${variant.color}, Finish: ${variant.finish}` : `Storage: ${variant.storage}, Color: ${variant.color}`}</p>
        <div className="mt-7 border-b border-gray-200 pb-6"><span className="text-3xl font-bold">₹{variant.price.toLocaleString("en-IN")}</span><span className="ml-3 text-sm text-gray-400 line-through">₹{variant.mrp.toLocaleString("en-IN")}</span><span className="ml-3 text-sm font-bold text-orange-600">{discount}% off</span><p className="mt-2 text-xs text-gray-500">Inclusive of all taxes</p></div>
        <div className="mt-6 border border-gray-200 p-5"><div className="flex items-center justify-between"><h2 className="text-lg font-bold">Pay only ₹{variant.price.toLocaleString("en-IN")} now</h2><span className="text-xs text-gray-500">EMIs from {variant.emiPlans[0]?.tenureMonths} months</span></div><h3 className="mt-7 text-base font-bold">Choose EMI tenure</h3><div className="mt-3 divide-y divide-gray-200">{variant.emiPlans.map((item) => <label key={item.tenureMonths} className="flex cursor-pointer items-center justify-between gap-4 py-4"><span className="flex items-center gap-3"><input type="radio" name="emi" checked={tenure === item.tenureMonths} onChange={() => setTenure(item.tenureMonths)} className="h-5 w-5 accent-orange-500" /><strong>₹{item.monthlyAmount.toLocaleString("en-IN")}</strong> × {item.tenureMonths} months</span><span className="bg-orange-500 px-2 py-1 text-xs font-bold text-white">{item.interestRate}% EMI</span></label>)}</div>{plan && <p className="mt-3 text-xs text-emerald-700">Additional cashback of ₹{plan.cashbackAmount.toLocaleString("en-IN")} · {plan.provider}</p>}<p className="mt-3 text-xs text-gray-500">Total payable: ₹{plan ? (plan.monthlyAmount * plan.tenureMonths).toLocaleString("en-IN") : "0"}</p><div className="mt-5 grid grid-cols-2 gap-3"><button onClick={addToCart} disabled={isOutOfStock} className="border-2 border-black py-3 text-sm font-bold text-black hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400">{isOutOfStock ? "Out of stock" : "Add to cart"}</button><button onClick={buyNow} disabled={isOutOfStock} className="bg-orange-500 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300">{isOutOfStock ? "Unavailable" : `Buy on ${tenure} months EMI`}</button></div></div>
        <div className="mt-6 flex items-center gap-4 border-b border-gray-200 pb-6"><span className="text-sm font-semibold">Quantity</span><div className="flex items-center border border-gray-300"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2"><Minus size={15} /></button><span className="min-w-10 text-center text-sm">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-2"><Plus size={15} /></button></div><span className="text-sm text-emerald-700">{variant.stockQuantity} available</span></div>
        <p className="mt-6 text-sm leading-6 text-gray-600">{product.description}</p>
      </section>
    </div>
    {similarProducts.length > 0 && <section className="mx-auto max-w-7xl border-t border-gray-200 px-6 py-10"><h2 className="mb-6 text-2xl font-bold">Similar products</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{similarProducts.map((item) => <ProductCard key={item._id} product={{ id: item._id, name: item.name, price: item.price, mrp: item.mrp, discount: item.discount, image: item.images?.[0] || "/placeholder.svg", colors: item.colors || [], stockQuantity: item.stockQuantity, inStock: item.inStock, emiPlans: item.emiPlans }} />)}</div></section>}
  </main>
}
