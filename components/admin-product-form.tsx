"use client"

import { useState } from "react"
import { Plus, Trash2, Upload, X } from "lucide-react"

type EmiPlan = { tenureMonths: number; monthlyAmount: number; interestRate: number; cashbackAmount: number; provider: string }
type Variant = { sku: string; label: string; storage: string; color: string; finish: string; mrp: number; price: number; stockQuantity: number; emiPlans: EmiPlan[] }

const tenures = [3, 6, 12, 24, 36, 48, 60]
const monthlyAmount = (price: number, months: number, interestRate: number) => Math.ceil((price * (1 + interestRate / 100)) / months)
const createPlans = (price: number): EmiPlan[] => tenures.map((tenureMonths) => { const interestRate = tenureMonths > 24 ? 10.5 : 0; return { tenureMonths, interestRate, monthlyAmount: monthlyAmount(price, tenureMonths, interestRate), cashbackAmount: tenureMonths <= 24 ? 7500 : 5000, provider: "Mutual Funds Partner" } })
const blankVariant = (index: number): Variant => ({ sku: `DEVICE-${index + 1}`, label: "", storage: "", color: "", finish: "", mrp: 0, price: 0, stockQuantity: 0, emiPlans: createPlans(0) })

export default function AdminProductForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("")
  const [brand, setBrand] = useState("Apple")
  const [category, setCategory] = useState("smartphones")
  const [description, setDescription] = useState("")
  const [features, setFeatures] = useState("")
  const [images, setImages] = useState<string[]>([])
  const [variants, setVariants] = useState<Variant[]>([blankVariant(0), blankVariant(1)])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState("")

  async function uploadImages(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    setMessage("Uploading images to Cloudinary...")
    try {
      const encoded = await Promise.all(Array.from(files).map((file) => new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })))
      const response = await fetch("/api/cloudinary", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ files: encoded, folder: "electronics" }) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Image upload failed")
      setImages((current) => [...current, ...(result.data || []).map((item: { secure_url: string }) => item.secure_url)])
      setMessage("Images uploaded successfully")
    } catch (error) { setMessage(error instanceof Error ? error.message : "Image upload failed") } finally { setUploading(false) }
  }

  function updateVariant(index: number, field: keyof Variant, value: string | number) {
    setVariants((current) => current.map((variant, variantIndex) => {
      if (variantIndex !== index) return variant
      const updated = { ...variant, [field]: value }
      if (field === "price") updated.emiPlans = createPlans(Number(value))
      return updated
    }))
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/admin/electronics/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, brand, category, description, features: features.split("\n").map((item) => item.trim()).filter(Boolean), images, variants: variants.map((variant) => ({ ...variant, images })) }) })
      const result = await response.json()
      if (!response.ok || !result.success) throw new Error(result.error || "Could not create product")
      setMessage("Product added successfully")
      onCreated()
    } catch (error) { setMessage(error instanceof Error ? error.message : "Could not create product") } finally { setSaving(false) }
  }

  return <form onSubmit={submit} className="border border-gray-200 bg-white p-5 shadow-sm md:p-7">
    <div className="mb-6"><p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Catalog intake</p><h2 className="mt-1 text-2xl font-semibold text-black">Add electronics product</h2><p className="mt-1 text-sm text-gray-500">Add device information, upload images, and EMI plans will update automatically from each selling price.</p></div>
    <div className="grid gap-4 md:grid-cols-2">
      <input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Product name" className="border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black" />
      <input required value={brand} onChange={(event) => setBrand(event.target.value)} placeholder="Brand" className="border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black" />
      <select value={category} onChange={(event) => setCategory(event.target.value)} className="border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black"><option value="smartphones">Smartphones</option><option value="laptops">Laptops</option><option value="tablets">Tablets</option><option value="accessories">Accessories</option></select>
      <label className="flex cursor-pointer items-center justify-center gap-2 border border-dashed border-black px-3 py-3 text-sm font-semibold text-black hover:bg-gray-50"><Upload size={16} /> {uploading ? "Uploading..." : "Upload multiple images"}<input type="file" accept="image/*" multiple disabled={uploading} onChange={(event) => uploadImages(event.target.files)} className="hidden" /></label>
      <textarea required value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Product description" className="min-h-24 border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black md:col-span-2" />
      <textarea value={features} onChange={(event) => setFeatures(event.target.value)} placeholder="Features, one per line" className="min-h-20 border border-gray-300 px-3 py-3 text-sm outline-none focus:border-black md:col-span-2" />
    </div>
    {images.length > 0 && <div className="mt-5 flex flex-wrap gap-3">{images.map((image, index) => <div key={image} className="relative h-20 w-20 overflow-hidden border border-gray-200 bg-gray-50"><img src={image} alt={`Product image ${index + 1}`} className="h-full w-full object-cover" /><button type="button" aria-label="Remove image" onClick={() => setImages((current) => current.filter((_, imageIndex) => imageIndex !== index))} className="absolute right-1 top-1 bg-black p-1 text-white"><X size={12} /></button></div>)}</div>}
    <div className="mt-8 space-y-5"><div className="flex items-center justify-between border-b border-gray-200 pb-3"><div><h3 className="font-semibold text-black">Variants and EMI plans</h3><p className="text-xs text-gray-500">Plans are calculated for 3, 6, 12, 24, 36, 48, and 60 months.</p></div><button type="button" onClick={() => setVariants((current) => [...current, blankVariant(current.length)])} className="inline-flex items-center gap-1 border border-black px-3 py-2 text-sm font-semibold hover:bg-black hover:text-white"><Plus size={15} /> Add variant</button></div>
      {variants.map((variant, index) => <div key={index} className="border border-gray-200 p-4"><div className="mb-4 flex items-center justify-between"><p className="font-semibold text-black">Variant {index + 1}</p>{variants.length > 2 && <button type="button" onClick={() => setVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Remove variant" className="text-black"><Trash2 size={16} /></button>}</div><div className="grid gap-3 md:grid-cols-3">{([['sku','SKU'],['label','Variant label'],['storage','Storage'],['color','Color'],['finish','Finish']] as const).map(([field, placeholder]) => <input key={field} required={field !== 'finish'} value={String(variant[field])} onChange={(event) => updateVariant(index, field, event.target.value)} placeholder={placeholder} className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" />)}<input required type="number" min="1" value={variant.mrp || ""} onChange={(event) => updateVariant(index, "mrp", Number(event.target.value))} placeholder="MRP" className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" /><input required type="number" min="1" value={variant.price || ""} onChange={(event) => updateVariant(index, "price", Number(event.target.value))} placeholder="Selling price" className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" /><input required type="number" min="0" value={variant.stockQuantity} onChange={(event) => updateVariant(index, "stockQuantity", Number(event.target.value))} placeholder="Stock quantity" className="border border-gray-300 px-3 py-2 text-sm outline-none focus:border-black" /></div><div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{variant.emiPlans.map((plan) => <div key={plan.tenureMonths} className={`border p-3 text-xs ${plan.interestRate === 0 ? "border-emerald-200 bg-emerald-50" : "border-gray-200 bg-gray-50"}`}><p className="font-bold">{plan.tenureMonths} months · {plan.interestRate}%</p><p className="mt-1 text-sm font-semibold">₹{plan.monthlyAmount.toLocaleString("en-IN")}/month</p><p className="mt-1 text-gray-600">Cashback ₹{plan.cashbackAmount.toLocaleString("en-IN")}</p></div>)}</div></div>)}
    </div>
    {message && <p className="mt-5 text-sm text-gray-700">{message}</p>}
    <button disabled={saving || uploading || images.length === 0} className="mt-6 bg-black px-5 py-3 text-sm font-semibold text-white hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving product..." : "Save electronics product"}</button>
  </form>
}
