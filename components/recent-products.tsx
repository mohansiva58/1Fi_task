"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import ProductCard from "@/components/product-card"

type Product = {
  _id: string
  name: string
  price?: number
  mrp?: number
  discount?: number
  images?: string[]
  colors?: string[]
  category?: string
  stockQuantity?: number
  inStock?: boolean
}

function isPhoneOrLaptop(product: Product) {
  const searchableText = `${product.category || ""} ${product.name || ""}`.toLowerCase()
  return /phone|smartphone|mobile|laptop|notebook/.test(searchableText)
}

export default function RecentProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const controller = new AbortController()

    async function loadRecentProducts() {
      try {
        const response = await fetch("/api/products?limit=100&sort=newest", {
          cache: "no-store",
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error(`Products request failed with ${response.status}`)
        }

        const result = await response.json()
        const recentProducts = Array.isArray(result.data)
          ? result.data.filter(isPhoneOrLaptop).slice(0, 8)
          : []

        setProducts(recentProducts)
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load recent phone and laptop products:", error)
          setProducts([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false)
        }
      }
    }

    loadRecentProducts()
    return () => controller.abort()
  }, [])

  if (loading || products.length === 0) {
    return null
  }

  return (
    <section className="bg-neutral-50 px-6 py-16 md:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10 text-center"
        >
          <h2 className="mb-3 text-3xl font-light text-black md:text-4xl">
            Recently Added
          </h2>
          <p className="text-neutral-600">Latest phones and laptops from our store</p>
        </motion.div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
            >
              <ProductCard
                product={{
                  id: product._id,
                  name: product.name,
                  price: Number(product.price) || 0,
                  mrp: Number(product.mrp) || Number(product.price) || 0,
                  discount: Number(product.discount) || 0,
                  image: product.images?.[0] || "/placeholder.svg",
                  colors: product.colors || [],
                  stockQuantity: product.stockQuantity,
                  inStock: product.inStock,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
