"use client"

import { useRouter } from "next/navigation"
import AdminProductForm from "@/components/admin-product-form"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function NewProductPage() {
  const router = useRouter()

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
        onSaved={() => router.push("/admin/dashboard")}
        onCancel={() => router.push("/admin/dashboard")}
      />
    </div>
  )
}
