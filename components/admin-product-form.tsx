"use client"

import { useState, useEffect } from "react"
import {
  Upload,
  Plus,
  Trash2,
  X,
  Check,
  AlertCircle,
  Image as ImageIcon,
  Smartphone,
  Laptop,
  Tablet,
  Headphones,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  Info,
  Star,
  Loader2,
  ArrowLeft,
  Watch,
} from "lucide-react"

export interface VariantData {
  sku: string
  label: string
  storage: string
  color: string
  finish?: string
  mrp: number
  price: number
  stockQuantity: number
  images?: string[]
}

export interface AdminProductInput {
  _id?: string
  name: string
  slug?: string
  brand: string
  category: "smartphones" | "laptops" | "earpods" | "watches" | "tablets" | "accessories"
  description: string
  features: string[]
  images: string[]
  variants: VariantData[]
}

const blankVariant = (index: number): VariantData => ({
  sku: `VAR-${Date.now().toString().slice(-4)}-${index + 1}`,
  label: "",
  storage: "",
  color: "",
  finish: "",
  mrp: 0,
  price: 0,
  stockQuantity: 10,
})

const CATEGORY_OPTIONS = [
  { value: "smartphones", label: "Smartphones", icon: Smartphone, desc: "iPhones, Android phones & handhelds" },
  { value: "laptops", label: "Laptops", icon: Laptop, desc: "MacBooks, Ultrabooks & laptops" },
  { value: "earpods", label: "EarPods / Audio", icon: Headphones, desc: "AirPods, wireless earbuds & audio" },
  { value: "watches", label: "Watches", icon: Watch, desc: "Apple Watch & smartwatches" },
  { value: "tablets", label: "Tablets & iPads", icon: Tablet, desc: "iPads, Android & graphic tablets" },
  { value: "accessories", label: "Accessories", icon: Tag, desc: "Cases, chargers, cables & add-ons" },
]

export default function AdminProductForm({
  initialProduct,
  onSaved,
  onCancel,
}: {
  initialProduct?: AdminProductInput | null
  onSaved: () => void
  onCancel?: () => void
}) {
  const isEditing = Boolean(initialProduct?._id)

  const [name, setName] = useState(initialProduct?.name || "")
  const [brand, setBrand] = useState(initialProduct?.brand || "Apple")
  const [category, setCategory] = useState<"smartphones" | "laptops" | "earpods" | "watches" | "tablets" | "accessories">(
    initialProduct?.category || "smartphones"
  )
  const [description, setDescription] = useState(initialProduct?.description || "")
  const [featuresList, setFeaturesList] = useState<string[]>(
    initialProduct?.features && initialProduct.features.length > 0
      ? initialProduct.features
      : [""]
  )
  const [images, setImages] = useState<string[]>(initialProduct?.images || [])
  const [urlInput, setUrlInput] = useState("")

  const [variants, setVariants] = useState<VariantData[]>(
    initialProduct?.variants && initialProduct.variants.length > 0
      ? initialProduct.variants.map((v) => ({
          sku: v.sku || "",
          label: v.label || "",
          storage: v.storage || "",
          color: v.color || "",
          finish: v.finish || "",
          mrp: Number(v.mrp) || Number(v.price) || 0,
          price: Number(v.price) || 0,
          stockQuantity: Number(v.stockQuantity) || 0,
          images: v.images || [],
        }))
      : [blankVariant(0), blankVariant(1)]
  )

  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null)

  // Reset if initialProduct changes
  useEffect(() => {
    if (initialProduct) {
      setName(initialProduct.name || "")
      setBrand(initialProduct.brand || "Apple")
      setCategory(initialProduct.category || "smartphones")
      setDescription(initialProduct.description || "")
      setFeaturesList(initialProduct.features?.length ? initialProduct.features : [""])
      setImages(initialProduct.images || [])
      if (initialProduct.variants?.length) {
        setVariants(initialProduct.variants)
      }
    }
  }, [initialProduct])

  // Upload to Cloudinary
  async function uploadImages(files: FileList | null) {
    if (!files?.length) return

    setUploading(true)
    setMessage({ text: "Uploading images to Cloudinary...", type: "info" })

    try {
      const encoded = await Promise.all(
        Array.from(files).map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = () => resolve(String(reader.result))
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
        )
      )

      const response = await fetch("/api/cloudinary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: encoded,
          folder: "electronics",
        }),
      })

      const result = await response.json()
      if (!response.ok || !result.success) {
        throw new Error(result.error || "Image upload failed")
      }

      const uploadedUrls = (result.data || []).map((item: { secure_url: string }) => item.secure_url)
      setImages((prev) => [...prev, ...uploadedUrls])
      setMessage({ text: `${uploadedUrls.length} image(s) uploaded successfully`, type: "success" })
    } catch (error) {
      setMessage({
        text: error instanceof Error ? error.message : "Image upload failed",
        type: "error",
      })
    } finally {
      setUploading(false)
    }
  }

  function addImageUrl() {
    const trimmed = urlInput.trim()
    if (!trimmed) return
    try {
      new URL(trimmed)
      setImages((prev) => [...prev, trimmed])
      setUrlInput("")
      setMessage({ text: "Image URL added to gallery", type: "success" })
    } catch {
      setMessage({ text: "Please enter a valid HTTP/HTTPS image URL", type: "error" })
    }
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  function setCoverImage(index: number) {
    if (index === 0) return
    setImages((prev) => {
      const copy = [...prev]
      const [selected] = copy.splice(index, 1)
      return [selected, ...copy]
    })
  }

  // Feature list handlers
  function handleFeatureChange(index: number, val: string) {
    setFeaturesList((prev) => {
      const copy = [...prev]
      copy[index] = val
      return copy
    })
  }

  function addFeatureRow() {
    setFeaturesList((prev) => [...prev, ""])
  }

  function removeFeatureRow(index: number) {
    setFeaturesList((prev) => prev.filter((_, i) => i !== index))
  }

  // Variant handlers
  function updateVariant(index: number, field: keyof VariantData, value: string | number) {
    setVariants((prev) =>
      prev.map((variant, i) => {
        if (i !== index) return variant
        const updated = { ...variant, [field]: value }
        // Auto sync label if blank
        if ((field === "storage" || field === "color") && !variant.label) {
          const s = field === "storage" ? value : variant.storage
          const c = field === "color" ? value : variant.color
          if (s || c) updated.label = [s, c].filter(Boolean).join(" - ")
        }
        return updated
      })
    )
  }

  function addVariantRow() {
    setVariants((prev) => [...prev, blankVariant(prev.length)])
  }

  function removeVariantRow(index: number) {
    if (variants.length <= 1) {
      setMessage({ text: "A product must have at least one variant", type: "error" })
      return
    }
    setVariants((prev) => prev.filter((_, i) => i !== index))
  }

  // Form submit
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!name.trim()) {
      setMessage({ text: "Product name is required", type: "error" })
      return
    }

    if (images.length === 0) {
      setMessage({ text: "Please upload or add at least one product image", type: "error" })
      return
    }

    if (variants.length === 0) {
      setMessage({ text: "Please add at least one variant", type: "error" })
      return
    }

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i]
      if (!v.sku.trim()) {
        setMessage({ text: `Variant #${i + 1} is missing a SKU`, type: "error" })
        return
      }
      if (!v.price || v.price <= 0) {
        setMessage({ text: `Variant #${i + 1} (${v.sku}) has an invalid selling price`, type: "error" })
        return
      }
    }

    setSaving(true)
    setMessage(null)

    const cleanedFeatures = featuresList.map((f) => f.trim()).filter(Boolean)
    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      description: description.trim(),
      features: cleanedFeatures,
      images,
      variants: variants.map((v) => ({
        ...v,
        mrp: Number(v.mrp) || Number(v.price),
        price: Number(v.price),
        stockQuantity: Number(v.stockQuantity) || 0,
        images: v.images && v.images.length ? v.images : images,
      })),
    }

    try {
      const url = isEditing
        ? `/api/admin/electronics/products/${initialProduct!._id}`
        : "/api/admin/electronics/products"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save product")
      }

      setMessage({
        text: isEditing ? "Product updated successfully!" : "New product created successfully!",
        type: "success",
      })

      setTimeout(() => {
        onSaved()
      }, 700)
    } catch (err) {
      setMessage({
        text: err instanceof Error ? err.message : "Error saving product",
        type: "error",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="p-1 text-gray-500 hover:text-black rounded hover:bg-gray-100 transition mr-1"
                title="Go back"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-100 text-cyan-800">
              <Sparkles size={12} />
              {isEditing ? "Edit Mode" : "New Intake"}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
            {isEditing ? `Edit "${name || "Product"}"` : "Add New Electronics Device"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Fill in device specifications, upload product images, and set dynamic variant pricing with automated EMI calculation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="inline-flex items-center gap-2 bg-black hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving...
              </>
            ) : isEditing ? (
              "Save Changes"
            ) : (
              "Publish Product"
            )}
          </button>
        </div>
      </div>

      {/* Status banner */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
            message.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : message.type === "error"
              ? "bg-rose-50 text-rose-800 border-rose-200"
              : "bg-cyan-50 text-cyan-800 border-cyan-200"
          }`}
        >
          {message.type === "success" ? (
            <Check size={18} className="shrink-0 text-emerald-600" />
          ) : message.type === "error" ? (
            <AlertCircle size={18} className="shrink-0 text-rose-600" />
          ) : (
            <Info size={18} className="shrink-0 text-cyan-600" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* SECTION 1: Basic Information */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
            <Tag size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">General Information</h3>
            <p className="text-xs text-gray-500">Device branding, name, category, and identity</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Product Name */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. iPhone 16 Pro Max or MacBook Air M4"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
            />
            <p className="text-xs text-gray-400">Full model title displayed prominently in the catalog and product page.</p>
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Brand / Manufacturer <span className="text-rose-500">*</span>
            </label>
            <input
              required
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="e.g. Apple, Samsung, Dell, Sony"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition"
            >
              {CATEGORY_OPTIONS.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Visual Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {CATEGORY_OPTIONS.map((cat) => {
            const Icon = cat.icon
            const isSelected = category === cat.value
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value as any)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                  isSelected
                    ? "border-black bg-gray-50 ring-1 ring-black"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50/50"
                }`}
              >
                <div className={`p-2 rounded-lg mb-2 ${isSelected ? "bg-black text-white" : "bg-gray-100 text-gray-600"}`}>
                  <Icon size={18} />
                </div>
                <span className="text-xs font-bold text-gray-900">{cat.label}</span>
                <span className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">{cat.desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* SECTION 2: Media & Images */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Product Images & Gallery</h3>
              <p className="text-xs text-gray-500">Upload high-resolution product photos or add external image URLs</p>
            </div>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
            {images.length} {images.length === 1 ? "Image" : "Images"}
          </span>
        </div>

        {/* Upload inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* File Upload Zone */}
          <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-xl hover:border-black bg-gray-50/50 hover:bg-gray-50 cursor-pointer transition group text-center">
            <div className="p-3 rounded-full bg-white shadow-sm ring-1 ring-gray-200 group-hover:scale-105 transition mb-3">
              <Upload size={22} className="text-gray-700" />
            </div>
            <p className="text-sm font-semibold text-gray-900">
              {uploading ? "Uploading to Cloudinary..." : "Click or drag to upload files"}
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 10MB (multiple files allowed)</p>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={uploading}
              onChange={(e) => uploadImages(e.target.files)}
              className="hidden"
            />
          </label>

          {/* URL Input Box */}
          <div className="flex flex-col justify-between p-6 border border-gray-200 rounded-xl bg-gray-50/30">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Add Image from URL
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      addImageUrl()
                    }
                  }}
                  placeholder="https://example.com/device-image.jpg"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                />
                <button
                  type="button"
                  onClick={addImageUrl}
                  className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition"
                >
                  Add
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Tip: Paste links from Apple CDN, Unsplash, or manufacturer asset libraries.
            </p>
          </div>
        </div>

        {/* Gallery Preview Grid */}
        {images.length > 0 ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-700">Gallery Preview</span>
              <span className="text-xs text-gray-400">First image will be used as the primary cover</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
              {images.map((img, idx) => (
                <div
                  key={`${img}-${idx}`}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm"
                >
                  <img
                    src={img}
                    alt={`Product image ${idx + 1}`}
                    className="w-full h-full object-contain p-2 group-hover:scale-105 transition duration-300"
                  />

                  {/* Primary badge */}
                  {idx === 0 ? (
                    <div className="absolute top-1.5 left-1.5 bg-black/85 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <Star size={10} className="fill-white text-white" />
                      Cover
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setCoverImage(idx)}
                      className="absolute top-1.5 left-1.5 opacity-0 group-hover:opacity-100 bg-white/90 hover:bg-white text-gray-800 text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-sm transition"
                    >
                      Make Cover
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition shadow-sm"
                    title="Remove image"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
            No images added yet. Upload files or paste URLs above to populate the product showcase.
          </div>
        )}
      </div>

      {/* SECTION 3: Description & Key Highlights */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Description & Key Highlights</h3>
            <p className="text-xs text-gray-500">Comprehensive summary and selling points for buyers</p>
          </div>
        </div>

        {/* Description textarea */}
        <div className="space-y-1.5">
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
            Product Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write a compelling overview of the device, its performance, display, battery life, and materials..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black transition"
          />
        </div>

        {/* Feature bullets */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Key Features & Bullets
              </label>
              <p className="text-xs text-gray-400">Display specs, processor, camera details, charging speed</p>
            </div>
            <button
              type="button"
              onClick={addFeatureRow}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-black border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-100 transition"
            >
              <Plus size={14} /> Add Feature
            </button>
          </div>

          <div className="space-y-2.5">
            {featuresList.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="w-6 text-center text-xs font-bold text-gray-400">{idx + 1}.</span>
                <input
                  type="text"
                  value={feature}
                  onChange={(e) => handleFeatureChange(idx, e.target.value)}
                  placeholder="e.g. 6.9-inch Super Retina XDR OLED display with ProMotion 120Hz"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                />
                {featuresList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeFeatureRow(idx)}
                    className="p-2 text-gray-400 hover:text-rose-600 rounded-lg transition"
                    title="Remove feature"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 4: Device Variants & Pricing */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Device Variants & Pricing</h3>
              <p className="text-xs text-gray-500">
                Configure SKU, storage capacity, colors, selling prices, and stock units.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={addVariantRow}
            className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-sm self-start sm:self-auto"
          >
            <Plus size={14} /> Add Variant
          </button>
        </div>

        {/* Variants list */}
        <div className="space-y-6">
          {variants.map((v, idx) => {
            const discount = v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0

            return (
              <div
                key={idx}
                className="relative bg-gray-50/70 border border-gray-200 rounded-2xl p-5 sm:p-6 space-y-4 hover:border-gray-300 transition"
              >
                {/* Variant card header */}
                <div className="flex items-center justify-between border-b border-gray-200/80 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="h-6 w-6 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {v.label || v.storage || v.color ? `${v.storage || ""} ${v.color || ""} (${v.sku})` : `Variant #${idx + 1}`}
                      </h4>
                      {discount > 0 && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                          {discount}% Discount applied
                        </span>
                      )}
                    </div>
                  </div>

                  {variants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariantRow(idx)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition"
                    >
                      <Trash2 size={13} />
                      Remove
                    </button>
                  )}
                </div>

                {/* Variant fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {/* SKU */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      SKU Code <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={v.sku}
                      onChange={(e) => updateVariant(idx, "sku", e.target.value.toUpperCase())}
                      placeholder="e.g. IP16PM-256-DESERT"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Label / Display Name */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Display Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      value={v.label}
                      onChange={(e) => updateVariant(idx, "label", e.target.value)}
                      placeholder="e.g. 256GB - Desert Titanium"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Storage */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Storage / Size
                    </label>
                    <input
                      type="text"
                      value={v.storage}
                      onChange={(e) => updateVariant(idx, "storage", e.target.value)}
                      placeholder="e.g. 128GB, 256GB, 512GB, 1TB"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Color */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Color Name
                    </label>
                    <input
                      type="text"
                      value={v.color}
                      onChange={(e) => updateVariant(idx, "color", e.target.value)}
                      placeholder="e.g. Midnight, Desert Titanium"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* MRP */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={v.mrp || ""}
                      onChange={(e) => updateVariant(idx, "mrp", Number(e.target.value))}
                      placeholder="e.g. 139900"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black font-semibold text-gray-700"
                    />
                  </div>

                  {/* Selling Price */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Selling Price (₹) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="1"
                      value={v.price || ""}
                      onChange={(e) => updateVariant(idx, "price", Number(e.target.value))}
                      placeholder="e.g. 129991"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black font-bold text-emerald-700"
                    />
                  </div>

                  {/* Stock Quantity */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Stock Quantity (Units) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      value={v.stockQuantity}
                      onChange={(e) => updateVariant(idx, "stockQuantity", Number(e.target.value))}
                      placeholder="e.g. 20"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>

                  {/* Finish / Material */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600">
                      Finish / Material
                    </label>
                    <input
                      type="text"
                      value={v.finish || ""}
                      onChange={(e) => updateVariant(idx, "finish", e.target.value)}
                      placeholder="e.g. Matte Titanium, Ceramic"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Floating or Bottom Action Bar */}
      <div className="sticky bottom-4 z-10 bg-white/95 backdrop-blur-md border border-gray-200 shadow-xl rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="text-xs text-gray-500 hidden sm:block">
          Ensure all prices, variant SKUs, and images are accurate before saving.
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-semibold border border-gray-300 rounded-xl hover:bg-gray-50 text-gray-700 transition"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={saving || uploading}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-black hover:bg-gray-800 text-white px-8 py-2.5 rounded-xl text-sm font-bold shadow-sm transition disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving Product...
              </>
            ) : isEditing ? (
              "Update Electronics Product"
            ) : (
              "Publish Electronics Product"
            )}
          </button>
        </div>
      </div>
    </form>
  )
}
