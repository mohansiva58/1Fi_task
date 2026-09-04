"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Heart, Minus, Plus, Share2, Check, AlertCircle } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useCart } from "@/hooks/use-cart"
import ProductCard from "@/components/product-card"
import { useWishlist } from "@/hooks/use-wishlist"
import { getFixedEmiPlans, FixedEmiRule } from "@/lib/emi"

type EmiPlan = { tenureMonths: number; monthlyAmount: number; interestRate: number; cashbackAmount: number; provider: string; totalPayable: number }
type Variant = { sku: string; label: string; storage?: string; color: string; finish?: string; price: number; mrp: number; images: string[]; stockQuantity: number; inStock: boolean; emiPlans?: any[] }
type Product = { _id: string; slug?: string; name: string; brand: string; category: string; description?: string; images: string[]; variants: Variant[]; price?: number; mrp?: number; discount?: number; colors?: string[]; stockQuantity?: number; inStock?: boolean; emiPlans?: any[] }

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null)
  const [variant, setVariant] = useState<Variant | null>(null)
  const [tenure, setTenure] = useState(12)
  const [isEmiConfirmed, setIsEmiConfirmed] = useState(false)
  const [imageIndex, setImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [paymentError, setPaymentError] = useState("")
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
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
          setTenure(12)
          setIsEmiConfirmed(false)
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
    const cat = product.category ? encodeURIComponent(product.category) : ""
    fetch(`/api/products?category=${cat}&limit=8&sort=newest`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Similar products request failed: ${response.status}`)
        const result = await response.json()
        let items = (result.data || []).filter((item: any) => item._id !== product._id)
        if (items.length < 4) {
          try {
            const allRes = await fetch(`/api/products?limit=8&sort=newest`, { cache: "no-store" })
            const allData = await allRes.json()
            const extra = (allData.data || []).filter(
              (item: any) => item._id !== product._id && !items.some((x: any) => x._id === item._id)
            )
            items = [...items, ...extra]
          } catch {
            // fallback
          }
        }
        setSimilarProducts(items.slice(0, 4))
      })
      .catch(() => setSimilarProducts([]))
  }, [product])

  if (loading) return <main className="flex min-h-screen items-center justify-center text-sm text-gray-500">Loading product...</main>
  if (error || !product || !variant) return <main className="flex min-h-screen flex-col items-center justify-center gap-4"><p className="text-gray-600">{error || "Product not found"}</p><Link href="/shop" className="bg-black px-5 py-3 text-sm font-semibold text-white">Back to shop</Link></main>

  const variantImgs = Array.isArray(variant.images) ? variant.images.filter(Boolean) : []
  const productImgs = Array.isArray(product.images) ? product.images.filter(Boolean) : []
  const allVariantImgs = Array.isArray(product.variants)
    ? product.variants.flatMap((v) => v.images || []).filter(Boolean)
    : []
  const rawImages = Array.from(new Set([...variantImgs, ...productImgs, ...allVariantImgs]))
  const images = rawImages.length > 0 ? rawImages : ["/placeholder.jpg"]
  const emiPlans: EmiPlan[] = getFixedEmiPlans(variant.price)
  const selectedPlan: EmiPlan = emiPlans.find((item) => item.tenureMonths === tenure) || emiPlans[0]
  const discount = variant.mrp > variant.price ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100) : 0
  const isOutOfStock = !variant.inStock || variant.stockQuantity <= 0
  const wishlisted = isInWishlist(product._id)

  function selectVariant(nextVariant: Variant) {
    setVariant(nextVariant)
    setImageIndex(0)
    setIsEmiConfirmed(false)
    setPaymentError("")
  }

  function handleSelectTenure(months: number) {
    setTenure(months)
    setIsEmiConfirmed(false)
    setPaymentError("")
  }

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).Razorpay) {
        resolve(true)
        return
      }
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleEmiBuy() {
    if (isOutOfStock || isProcessingPayment) return
    if (!user) {
      setShowLoginModal(true)
      return
    }

    if (!isEmiConfirmed) {
      setIsEmiConfirmed(true)
    }

    setPaymentError("")
    setIsProcessingPayment(true)

    try {
      const isLoaded = await loadRazorpayScript()
      if (!isLoaded) {
        throw new Error("Failed to load Razorpay payment gateway")
      }

      // Create Razorpay order on server with trusted identifiers
      const response = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product?._id,
          variantSku: variant?.sku,
          tenureMonths: tenure,
          receipt: `ORD_${Date.now()}`,
        }),
      })

      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize payment")
      }

      const verifiedEmi = data.emiPlan || selectedPlan

      const options = {
        key: data.keyId,
        amount: data.order.amount,
        currency: data.order.currency,
        name: "EMI Platform",
        description: `${product?.name} (${variant?.label}) - ${tenure} Months EMI`,
        image: images[0] || "/logo.png",
        order_id: data.order.id,
        prefill: {
          name: user.displayName || "",
          email: user.email || "",
          contact: user.phoneNumber || "",
        },
        theme: {
          color: "#000000",
        },
        handler: async function (paymentRes: any) {
          try {
            // Verify payment on server
            const verifyResponse = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: paymentRes.razorpay_order_id,
                paymentId: paymentRes.razorpay_payment_id,
                signature: paymentRes.razorpay_signature,
              }),
            })

            const verifyData = await verifyResponse.json()
            if (!verifyData.success || !verifyData.verified) {
              throw new Error("Payment signature verification failed")
            }

            // Create EMI order in MongoDB
            const orderData = {
              userId: user.uid,
              userEmail: user.email,
              items: [
                {
                  productId: product?._id,
                  name: `${product?.name} - ${variant?.label}`,
                  price: variant?.price,
                  quantity,
                  color: variant?.color,
                  size: variant?.storage,
                  image: images[0] || "/placeholder.svg",
                },
              ],
              shippingAddress: {
                name: user.displayName || user.email?.split("@")[0] || "Customer",
                email: user.email,
                phone: user.phoneNumber || "9999999999",
                address: "Online order address",
                city: "City",
                state: "State",
                pincode: "110001",
              },
              paymentMethod: "online",
              paymentMode: "EMI",
              emi: {
                tenureMonths: verifiedEmi.tenureMonths,
                interestRate: verifiedEmi.interestRate,
                monthlyAmount: verifiedEmi.monthlyAmount,
                totalPayable: verifiedEmi.totalPayable,
                provider: verifiedEmi.provider,
                cashbackAmount: verifiedEmi.cashbackAmount,
              },
              paymentStatus: "paid",
              paymentDetails: {
                razorpayOrderId: paymentRes.razorpay_order_id,
                razorpayPaymentId: paymentRes.razorpay_payment_id,
                razorpaySignature: paymentRes.razorpay_signature,
                method: "razorpay",
              },
              subtotal: (variant?.price || 0) * quantity,
              tax: 0,
              total: (variant?.price || 0) * quantity,
            }

            const orderResponse = await fetch("/api/orders", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(orderData),
            })

            const orderResult = await orderResponse.json()
            if (!orderResult.success) {
              throw new Error(orderResult.error || "Failed to record order")
            }

            router.push(`/order-confirmation?orderNumber=${orderResult.order.orderNumber}`)
          } catch (err) {
            console.error("Payment completion error:", err)
            setPaymentError(err instanceof Error ? err.message : "Payment processing error")
            setIsProcessingPayment(false)
          }
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false)
          },
        },
      }

      const rzp = new (window as any).Razorpay(options)
      rzp.open()
    } catch (err) {
      console.error("EMI Checkout Error:", err)
      setPaymentError(err instanceof Error ? err.message : "Payment initiation failed")
      setIsProcessingPayment(false)
    }
  }

  function buyNow() {
    if (isOutOfStock) return
    if (!user) {
      setShowLoginModal(true)
      return
    }
    addItem({ id: product!._id, name: `${product!.name} - ${variant!.label}`, price: variant!.price, image: images[0] || "/placeholder.svg", color: variant!.color, size: variant!.storage, quantity })
    router.push("/checkout")
  }

  function addToCart() {
    if (isOutOfStock) return
    addItem({ id: product!._id, name: `${product!.name} - ${variant!.label}`, price: variant!.price, image: images[0] || "/placeholder.svg", color: variant!.color, size: variant!.storage, quantity })
  }

  return (
    <main className="min-h-screen bg-white text-[#17202a]">
      {/* Breadcrumbs */}
      <div className="border-b border-gray-100 bg-[#f4f7f9] px-6 py-4 text-sm">
        <div className="mx-auto max-w-7xl flex items-center gap-2">
          <Link href="/shop" className="text-[#0d365c] hover:underline">Shop on EMI</Link>
          <span className="text-gray-400">›</span>
          <Link href={`/shop?category=${product.category}`} className="text-[#0d365c] capitalize hover:underline">{product.category}</Link>
          <span className="text-gray-400">›</span>
          <span className="font-semibold text-gray-800 truncate">{product.name} ({variant.label})</span>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl items-start gap-10 px-6 py-8 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
        {/* Image column: Sticky gallery */}
        <section className="grid gap-5 md:grid-cols-[82px_1fr] lg:sticky lg:top-6 lg:self-start">
          <div className="order-2 flex gap-3 overflow-x-auto md:order-1 md:flex-col pb-2 md:pb-0">
            {images.map((image, index) => (
              <button
                key={`${image}-${index}`}
                onClick={() => setImageIndex(index)}
                className={`h-20 w-20 shrink-0 overflow-hidden rounded-lg border p-1 bg-white transition ${
                  imageIndex === index ? "border-orange-500 ring-2 ring-orange-400 shadow-sm" : "border-gray-200 opacity-70 hover:opacity-100"
                }`}
              >
                <img src={image} alt={`${product.name} view ${index + 1}`} className="h-full w-full object-contain" />
              </button>
            ))}
          </div>

          <div className="order-1 relative flex min-h-[420px] items-center justify-center rounded-2xl border border-gray-100 bg-gray-50/50 p-6 md:order-2 lg:min-h-[540px]">
            <img src={images[imageIndex] || "/placeholder.svg"} alt={product.name} className="max-h-[500px] w-full object-contain drop-shadow-sm" />
            <button
              onClick={() => setImageIndex((imageIndex - 1 + images.length) % images.length)}
              aria-label="Previous image"
              className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white text-gray-700 transition"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={() => setImageIndex((imageIndex + 1) % images.length)}
              aria-label="Next image"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md hover:bg-white text-gray-700 transition"
            >
              <ChevronRight size={20} />
            </button>
            {/* {discount > 0 && (
              <div className="absolute bottom-4 left-4 bg-orange-500 px-3 py-1 text-xs font-bold text-white rounded-full shadow-sm">
                {discount}% Cashback Eligible
              </div>
            )} */}
          </div>

          <div className="order-3 flex items-center justify-end md:col-start-2 gap-2">
            <button
              aria-label="Add to wishlist"
              onClick={() => toggleWishlist({ id: product._id, name: product.name, price: variant.price, image: images[0] || "/placeholder.svg" })}
              className={`flex items-center gap-1.5 border px-3 py-2 text-xs font-semibold rounded-lg transition ${
                wishlisted ? "border-red-500 bg-red-50 text-red-600" : "border-gray-200 text-gray-700 hover:border-gray-400 bg-white"
              }`}
            >
              <Heart size={16} fill={wishlisted ? "currentColor" : "none"} />
              <span>{wishlisted ? "Wishlisted" : "Save"}</span>
            </button>
            <button
              aria-label="Share product"
              onClick={() => {
                if (navigator.share) navigator.share({ title: product.name, text: `View ${product.name} on EMI Platform`, url: window.location.href })
                else navigator.clipboard?.writeText(window.location.href)
              }}
              className="flex items-center gap-1.5 border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 rounded-lg hover:border-gray-400 bg-white transition"
            >
              <Share2 size={16} />
              <span>Share</span>
            </button>
          </div>
        </section>

        {/* Description / purchase column */}
        <section className="lg:pt-1">
          <p className="text-xs font-bold uppercase tracking-wider text-orange-600 bg-orange-50 inline-block px-2.5 py-0.5 rounded-full mb-2">
            {product.brand} · {product.category}
          </p>
          <h1 className="text-2xl font-bold leading-tight text-gray-900 md:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {variant.finish ? `${variant.color} · ${variant.storage} · ${variant.finish}` : `${variant.color} · ${variant.storage || variant.label}`}
          </p>

          {/* Related Variant Images / Options Suggestions under Title */}
          <div className="mt-4 pt-3 border-t border-gray-100">
            <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500">
              Select Finish & Storage Suggestion:
            </p>
            <div className="flex flex-wrap gap-2.5">
              {product.variants.map((item) => {
                const isSelected = variant.sku === item.sku
                const thumbImg = (item.images && item.images[0]) || images[0] || "/placeholder.svg"
                return (
                  <button
                    key={item.sku}
                    onClick={() => selectVariant(item)}
                    className={`group flex items-center gap-2.5 border px-3 py-2 rounded-xl text-left transition ${
                      isSelected
                        ? "border-orange-500 bg-orange-50/70 ring-2 ring-orange-400/50 shadow-sm"
                        : "border-gray-200 hover:border-gray-400 bg-white"
                    }`}
                  >
                    <div className="w-9 h-9 shrink-0 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 p-0.5">
                      <img src={thumbImg} alt={item.color} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <span className={`block text-xs font-bold ${isSelected ? "text-orange-950" : "text-gray-900"}`}>
                        {item.color}
                      </span>
                      {item.storage && (
                        <span className="block text-[11px] text-gray-500 font-medium">{item.storage}</span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Pricing Block */}
          <div className="mt-6 border-b border-gray-200 pb-5">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-gray-900">₹{variant.price.toLocaleString("en-IN")}</span>
              {variant.mrp > variant.price && (
                <span className="text-base text-gray-400 line-through">₹{variant.mrp.toLocaleString("en-IN")}</span>
              )}
              {discount > 0 && (
                <span className="text-sm font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                  {discount}% OFF
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-gray-500">Inclusive of all taxes & doorstep delivery</p>
          </div>

          {/* EMI Section */}
          <div className="mt-6 rounded-2xl border border-gray-200 p-5 bg-white shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-gray-900">Instant EMI with 0% Interest</h2>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                Fixed EMI Plans
              </span>
            </div>

            <h3 className="mt-4 text-xs font-bold uppercase tracking-wider text-gray-500">Choose EMI tenure</h3>
            <div className="mt-2.5 space-y-2">
              {emiPlans.map((item) => {
                const isSelected = tenure === item.tenureMonths
                return (
                  <label
                    key={item.tenureMonths}
                    className={`flex cursor-pointer items-center justify-between gap-4 p-3 rounded-xl border transition ${
                      isSelected ? "bg-orange-50/80 border-orange-400 ring-1 ring-orange-300" : "border-gray-200 hover:bg-gray-50/80"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="emi"
                        checked={isSelected}
                        onChange={() => handleSelectTenure(item.tenureMonths)}
                        className="h-4 w-4 accent-orange-500"
                      />
                      <span>
                        <strong className="text-base text-gray-900">₹{item.monthlyAmount.toLocaleString("en-IN")}</strong>
                        <span className="text-gray-600 font-normal text-sm"> × {item.tenureMonths} months</span>
                      </span>
                    </span>
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${item.interestRate === 0 ? "bg-emerald-600 text-white" : "bg-gray-800 text-white"}`}>
                      {item.interestRate === 0 ? "0% EMI" : `${item.interestRate}% Interest`}
                    </span>
                  </label>
                )
              })}
            </div>

            {/* Plan Confirmation Box */}
            <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-3.5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Selected Plan Summary</p>
                  <p className="mt-0.5 text-sm font-bold text-gray-900">
                    {selectedPlan.tenureMonths} months · ₹{selectedPlan.monthlyAmount.toLocaleString("en-IN")}/month
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {selectedPlan.interestRate === 0 ? "0% interest" : `${selectedPlan.interestRate}% interest`} · Total payable: ₹{selectedPlan.totalPayable.toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {isEmiConfirmed ? (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-800">
                  <span className="flex items-center gap-1.5"><Check size={14} className="stroke-[3]" /> {selectedPlan.tenureMonths}-month EMI verified</span>
                  <button
                    type="button"
                    onClick={() => setIsEmiConfirmed(false)}
                    className="text-xs text-gray-600 underline hover:text-black font-normal"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEmiConfirmed(true)}
                  className="mt-3 w-full border border-black bg-white py-2 text-xs font-bold text-black rounded-lg hover:bg-black hover:text-white transition"
                >
                  Confirm {selectedPlan.tenureMonths}-month EMI
                </button>
              )}
            </div>

            {paymentError && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span>{paymentError}</span>
              </div>
            )}

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={addToCart}
                disabled={isOutOfStock || isProcessingPayment}
                className="border-2 border-black py-3 text-sm font-bold text-black rounded-xl hover:bg-gray-100 disabled:cursor-not-allowed disabled:border-gray-300 disabled:text-gray-400 transition"
              >
                {isOutOfStock ? "Out of stock" : "Add to cart"}
              </button>
              <button
                onClick={handleEmiBuy}
                disabled={isOutOfStock || isProcessingPayment}
                className="bg-orange-500 py-3 text-sm font-bold text-white rounded-xl hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300 transition flex items-center justify-center gap-2 shadow-sm"
              >
                {isProcessingPayment ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Processing...
                  </>
                ) : isOutOfStock ? (
                  "Unavailable"
                ) : (
                  `Proceed with ${tenure}-Mo EMI`
                )}
              </button>
            </div>
          </div>

          {/* Quantity selector */}
          <div className="mt-6 flex items-center gap-4 border-b border-gray-200 pb-5">
            <span className="text-sm font-semibold text-gray-700">Quantity</span>
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-white">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-gray-100"><Minus size={15} /></button>
              <span className="min-w-10 text-center text-sm font-bold">{quantity}</span>
              <button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-gray-100"><Plus size={15} /></button>
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
              {variant.stockQuantity} units available
            </span>
          </div>

          {/* Product Description */}
          {product.description && (
            <div className="mt-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-900 mb-2">Product Overview</h3>
              <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">{product.description}</p>
            </div>
          )}
        </section>
      </div>

      {/* Related Suggestions & Similar Products at bottom */}
      {similarProducts.length > 0 && (
        <section className="mx-auto max-w-7xl border-t border-gray-200 px-6 py-14">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
                Suggestions For You
              </span>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mt-2">Related Products & Suggestions</h2>
              <p className="text-xs text-gray-500 mt-1">Discover other top devices with 0% EMI financing</p>
            </div>
            <Link
              href={`/shop?category=${product.category}`}
              className="text-xs font-bold uppercase tracking-wider text-gray-900 hover:text-orange-600 transition flex items-center gap-1 shrink-0"
            >
              Browse All in {product.category} ›
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {similarProducts.map((item: any) => (
              <ProductCard
                key={item._id}
                product={{
                  id: item.slug || item._id,
                  name: item.name,
                  price: item.price,
                  mrp: item.mrp,
                  discount: item.discount,
                  image: (Array.isArray(item.images) && item.images[0]) || (Array.isArray(item.variants) && item.variants[0]?.images?.[0]) || "/placeholder.svg",
                  images: item.images || (Array.isArray(item.variants) ? item.variants.map((v: any) => v.images?.[0]).filter(Boolean) : []),
                  colors: item.colors || [],
                  variants: item.variants || [],
                  stockQuantity: item.stockQuantity,
                  inStock: item.inStock,
                  emiPlans: item.emiPlans,
                }}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
