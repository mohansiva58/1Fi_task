"use client"

import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { ShoppingCart, Heart } from "lucide-react"
import { useCart } from "@/hooks/use-cart"
import { useWishlist } from "@/hooks/use-wishlist"

interface ProductCardProps {
  product: {
    id: number | string
    name: string
    price: number
    mrp?: number
    discount?: number
    image: string
    images?: string[]
    colors?: string[]
    variants?: { sku?: string; color?: string; images?: string[]; price?: number }[]
    stockQuantity?: number
    inStock?: boolean
    emiPlans?: { tenureMonths: number; monthlyAmount: number; interestRate: number }[]
  }
}

export default function ProductCard({ product }: ProductCardProps) {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || "")
  const [currentImage, setCurrentImage] = useState(product.image || product.images?.[0] || "/placeholder.svg")
  const { addItem } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const productId = product.id
  const inWishlist = isInWishlist(productId)
  const isOutOfStock = product.stockQuantity === 0 || product.inStock === false

  // Find images to show as related thumbnail suggestions (up to 4)
  const relatedThumbnails: string[] = []
  if (Array.isArray(product.images) && product.images.length > 1) {
    relatedThumbnails.push(...product.images.slice(0, 4))
  } else if (Array.isArray(product.variants)) {
    product.variants.forEach((v) => {
      if (v.images?.[0] && !relatedThumbnails.includes(v.images[0])) {
        relatedThumbnails.push(v.images[0])
      }
    })
  }

  const handleAddToCart = () => {
    if (isOutOfStock) return
    addItem({
      id: productId,
      name: product.name,
      price: product.price,
      image: currentImage,
      color: selectedColor,
      quantity: 1,
    })
  }

  return (
    <div className="group flex flex-col justify-between h-full bg-white rounded-xl p-3 border border-gray-100 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
      <div>
        <Link href={`/product/${product.id}`} className="block">
          <div
            className="relative overflow-hidden bg-gray-50 rounded-xl mb-3 cursor-pointer"
            style={{ aspectRatio: "3 / 4" }}
          >
            <Image
              src={currentImage || "/placeholder.svg"}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 33vw"
              className="object-contain p-4 group-hover:scale-105 transition duration-300"
              loading="lazy"
              unoptimized
            />
            {isOutOfStock && (
              <div className="absolute top-3 left-3 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-lg z-10">
                OUT OF STOCK
              </div>
            )}
            {typeof product.discount === "number" && product.discount > 0 && !isOutOfStock ? (
              <div className="absolute top-3 right-3 bg-orange-500 text-white text-[11px] font-bold px-2 py-0.5 rounded shadow-sm z-10">
                {product.discount}% OFF
              </div>
            ) : null}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center gap-3 md:gap-4 pointer-events-none group-hover:pointer-events-auto">
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleWishlist({ id: productId, name: product.name, price: product.price, image: currentImage })
                }}
                className={`p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition transform group-hover:scale-100 scale-75 shadow-md ${
                  inWishlist ? "bg-red-500 text-white" : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                <Heart size={16} className={`${inWishlist ? "fill-red-500" : ""}`} />
              </button>
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleAddToCart()
                }}
                disabled={isOutOfStock}
                className={`p-2.5 rounded-full opacity-0 group-hover:opacity-100 transition transform group-hover:scale-100 scale-75 shadow-md ${
                  isOutOfStock
                    ? "bg-gray-400 text-gray-600 cursor-not-allowed"
                    : "bg-black text-white hover:bg-gray-800"
                }`}
              >
                <ShoppingCart size={16} />
              </button>
            </div>
          </div>
        </Link>

        {/* Product Title */}
        <Link href={`/product/${product.id}`} className="hover:underline">
          <h3 className="text-xs md:text-sm font-bold mb-1 line-clamp-2 leading-tight text-gray-900">
            {product.name}
          </h3>
        </Link>

        {/* Related Image Suggestions Thumbnails under Title */}
        {relatedThumbnails.length > 1 && (
          <div className="flex items-center gap-1.5 my-2 overflow-x-auto pb-1">
            {relatedThumbnails.map((imgUrl, i) => (
              <button
                key={i}
                type="button"
                onMouseEnter={() => setCurrentImage(imgUrl)}
                onClick={() => setCurrentImage(imgUrl)}
                className={`w-7 h-7 shrink-0 rounded-md overflow-hidden border p-0.5 transition ${
                  currentImage === imgUrl
                    ? "border-orange-500 ring-1 ring-orange-400 bg-orange-50/50"
                    : "border-gray-200 hover:border-gray-400 bg-white"
                }`}
                title="View image preview"
              >
                <img src={imgUrl} alt="" className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        )}

        {/* Pricing & EMI Info */}
        <div className="mb-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="font-bold text-sm md:text-base text-gray-900">₹{product.price.toLocaleString("en-IN")}</p>
            {product.mrp && product.mrp > product.price && (
              <p className="text-xs text-gray-400 line-through">₹{product.mrp.toLocaleString("en-IN")}</p>
            )}
          </div>
          {product.emiPlans && product.emiPlans.length > 0 && (
            <p className="mt-0.5 text-[11px] font-semibold text-emerald-700">
              EMI from ₹{(product.emiPlans.find((plan) => plan.tenureMonths === 12) || product.emiPlans[0]).monthlyAmount.toLocaleString("en-IN")}/mo
            </p>
          )}
        </div>
      </div>

      {/* Colors / Finishes */}
      {product.colors && product.colors.length > 0 && (
        <div className="flex gap-1 flex-wrap pt-1 border-t border-gray-100 mt-2">
          {Array.from(new Set(product.colors)).map((color) => (
            <button
              key={color}
              onClick={() => setSelectedColor(color)}
              className={`text-[11px] px-2 py-0.5 border rounded transition ${
                selectedColor === color
                  ? "border-black bg-black text-white font-medium"
                  : "border-gray-200 text-gray-700 hover:border-gray-400 bg-gray-50"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
