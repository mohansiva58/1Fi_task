"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import AdminProductForm from "@/components/admin-product-form"
import Link from "next/link"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function EditProductPage() {
  const params = useParams()
  const router = useRouter()
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchProduct() {
      try {
        const id = params?.id as string
        if (!id) return
        const res = await fetch(`/api/admin/electronics/products/${id}`)
        const data = await res.json()
        if (data.success && data.product) {
          setProduct(data.product)
        } else {
          // Fallback to general admin products API
          const fallbackRes = await fetch(`/api/admin/products/${id}`)
          const fallbackData = await fallbackRes.json()
          if (fallbackData.success && fallbackData.product) {
            setProduct(fallbackData.product)
          } else {
            setError("Product not found")
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load product")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [params])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600 gap-2">
        <Loader2 size={20} className="animate-spin text-black" />
        <span className="text-sm font-semibold">Loading product details...</span>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-sm font-semibold text-rose-600">{error || "Product not found"}</p>
        <Link
          href="/admin/dashboard"
          className="px-4 py-2 bg-black text-white text-xs font-bold rounded-lg"
        >
          Return to Dashboard
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto mb-6">
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-black transition"
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
      </div>
      <AdminProductForm
        initialProduct={product}
        onSaved={() => router.push("/admin/dashboard")}
        onCancel={() => router.push("/admin/dashboard")}
      />
    </div>
  )
}
