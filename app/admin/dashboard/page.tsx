"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Boxes,
  Laptop,
  LogIn,
  LogOut,
  PackageCheck,
  Plus,
  RefreshCw,
  Smartphone,
  Edit,
  Trash2,
  ExternalLink,
  Search,
  CheckCircle,
  AlertCircle,
  Tag,
  Eye,
  Layers,
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  Clock,
  CheckCircle2,
} from "lucide-react"
import AdminProductForm, { AdminProductInput } from "@/components/admin-product-form"
import Link from "next/link"

type Variant = {
  sku: string
  label: string
  storage?: string
  color?: string
  finish?: string
  mrp?: number
  price: number
  stockQuantity: number
  images?: string[]
}

type Product = {
  _id: string
  name: string
  slug?: string
  brand: string
  category: "smartphones" | "laptops" | "earpods" | "watches" | "tablets" | "accessories"
  description?: string
  features?: string[]
  images?: string[]
  price: number
  mrp: number
  discount?: number
  stockQuantity: number
  inStock?: boolean
  variants?: Variant[]
  createdAt?: string
}

type Order = {
  _id: string
  orderNumber: string
  userEmail: string
  total: number
  orderStatus: string
  paymentStatus: string
  createdAt: string
}

const statusOptions = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]

export default function ElectronicsAdminDashboard() {
  const [tab, setTab] = useState<"catalog" | "overview" | "orders" | "add" | "edit">("catalog")
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteModalProduct, setDeleteModalProduct] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [error, setError] = useState<string | null>(null)
  const [actionMessage, setActionMessage] = useState<{ text: string; type: "success" | "error" } | null>(null)

  const [authenticated, setAuthenticated] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authError, setAuthError] = useState<string | null>(null)

  async function loadData(showRefresh = false) {
    if (showRefresh) setRefreshing(true)
    setError(null)

    try {
      const [productsResponse, ordersResponse] = await Promise.all([
        fetch("/api/products?limit=50", { cache: "no-store" }),
        fetch("/api/orders", { cache: "no-store" }),
      ])

      const productsData = await productsResponse.json()
      const ordersData = await ordersResponse.json()

      if (!productsData.success) {
        throw new Error(productsData.error || "Could not load catalog")
      }

      setProducts(Array.isArray(productsData.data) ? productsData.data : [])
      setOrders(
        ordersData.success
          ? Array.isArray(ordersData.data)
            ? ordersData.data
            : Array.isArray(ordersData.orders)
            ? ordersData.orders
            : []
          : []
      )
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetch("/api/admin/auth/me")
      .then((response) => {
        if (response.ok) {
          setAuthenticated(true)
          loadData()
        }
      })
      .finally(() => setAuthChecked(true))
  }, [])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setAuthError(null)

    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    })

    const result = await response.json()
    if (!response.ok || !result.success) {
      setAuthError(result.error || "Invalid admin credentials")
      return
    }

    setAuthenticated(true)
    setLoading(true)
    loadData()
  }

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" })
    setAuthenticated(false)
    setProducts([])
    setOrders([])
  }

  // Handle product edit trigger
  async function handleEditProduct(product: Product) {
    try {
      setRefreshing(true)
      const res = await fetch(`/api/admin/electronics/products/${product._id}`)
      const data = await res.json()
      if (data.success && data.product) {
        setEditingProduct(data.product)
      } else {
        setEditingProduct(product)
      }
      setTab("edit")
    } catch {
      setEditingProduct(product)
      setTab("edit")
    } finally {
      setRefreshing(false)
    }
  }

  // Handle product delete
  async function confirmDeleteProduct() {
    if (!deleteModalProduct) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/electronics/products/${deleteModalProduct._id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to delete product")
      }

      setActionMessage({ text: `"${deleteModalProduct.name}" deleted successfully`, type: "success" })
      setDeleteModalProduct(null)
      loadData(true)
      setTimeout(() => setActionMessage(null), 4000)
    } catch (err) {
      setActionMessage({
        text: err instanceof Error ? err.message : "Error deleting product",
        type: "error",
      })
    } finally {
      setDeleting(false)
    }
  }

  async function updateOrderStatus(orderId: string, orderStatus: string) {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderStatus }),
    })

    if (!response.ok) {
      setError("Could not update order status")
      return
    }

    setOrders((current) =>
      current.map((order) => (order._id === orderId ? { ...order, orderStatus } : order))
    )
  }

  const filteredProducts = useMemo(() => {
    const safeList = Array.isArray(products) ? products : []
    const normalized = query.toLowerCase().trim()
    return safeList.filter((product) => {
      const matchesSearch =
        !normalized ||
        `${product.name || ""} ${product.brand || ""} ${product.category || ""}`
          .toLowerCase()
          .includes(normalized)
      const matchesCat =
        selectedCategory === "all" ||
        (product.category && product.category.toLowerCase() === selectedCategory.toLowerCase())
      return matchesSearch && matchesCat
    })
  }, [products, query, selectedCategory])

  const metrics = useMemo(() => {
    const safeProducts = Array.isArray(products) ? products : []
    const safeOrders = Array.isArray(orders) ? orders : []
    return {
      products: safeProducts.length,
      variants: safeProducts.reduce((sum, p) => sum + (Array.isArray(p?.variants) ? p.variants.length : 0), 0),
      stock: safeProducts.reduce((sum, p) => sum + (Number(p?.stockQuantity) || 0), 0),
      pending: safeOrders.filter((o) => ["pending", "confirmed", "processing"].includes(o?.orderStatus || "")).length,
      revenue: safeOrders.reduce((sum, o) => sum + (Number(o?.total) || 0), 0),
    }
  }, [products, orders])

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef3f5] text-slate-600 font-medium">
        Verifying administrator session...
      </div>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950 px-5">
        <form
          onSubmit={login}
          className="w-full max-w-md border border-gray-800 bg-white rounded-2xl p-8 shadow-2xl space-y-6"
        >
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-600 bg-cyan-50 px-2.5 py-1 rounded-full">
              Control Room
            </span>
            <h1 className="mt-3 text-3xl font-bold text-gray-950 tracking-tight">Admin Sign In</h1>
            <p className="mt-1 text-sm text-gray-500">Sign in with your configured administrator credentials.</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Admin Email
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Password
              </label>
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                {authError}
              </div>
            )}

            <button className="inline-flex w-full items-center justify-center gap-2 bg-black rounded-lg px-4 py-3 text-sm font-bold text-white hover:bg-gray-800 transition">
              <LogIn size={16} /> Sign in to Dashboard
            </button>
          </div>
        </form>
      </main>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-slate-600 font-medium">
        Loading admin console...
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 md:px-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-widest text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                Admin Console
              </span>
              <span className="text-xs text-gray-400">v2.0</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 mt-1">
              Electronics Store Management
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-1.5 border border-gray-300 bg-white rounded-lg px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition shadow-sm"
            >
              <Eye size={14} /> Storefront
            </Link>

            <button
              onClick={() => {
                setEditingProduct(null)
                setTab("add")
              }}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-gray-800 text-white rounded-lg px-4 py-2 text-xs font-bold shadow-sm transition"
            >
              <Plus size={15} /> Add Product
            </button>

            <button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 border border-gray-300 bg-white rounded-lg px-3.5 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 transition disabled:opacity-60 shadow-sm"
              title="Refresh inventory & orders"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-3.5 py-2 text-xs font-bold hover:bg-rose-100 transition"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="border-t border-gray-100 bg-white px-5 md:px-8">
          <div className="mx-auto flex max-w-7xl gap-8 overflow-x-auto">
            {(
              [
                ["catalog", "Electronics Catalog", Boxes],
                ["overview", "Overview & Metrics", Smartphone],
                ["orders", `Orders (${orders.length})`, PackageCheck],
                ["add", "+ Add Product", Plus],
                ...(tab === "edit" ? [["edit", `Editing: ${editingProduct?.name || "Product"}`, Edit] as const] : []),
              ] as const
            ).map(([value, label, Icon]) => (
              <button
                key={value}
                onClick={() => {
                  if (value !== "edit") setEditingProduct(null)
                  setTab(value as any)
                }}
                className={`flex items-center gap-2 border-b-2 py-3.5 text-sm font-bold whitespace-nowrap transition ${
                  tab === value
                    ? "border-black text-black"
                    : "border-transparent text-gray-500 hover:text-gray-900"
                }`}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <div className="mx-auto max-w-7xl space-y-7 px-5 py-7 md:px-8">
        {/* Banner Alert Messages */}
        {actionMessage && (
          <div
            className={`p-4 rounded-xl flex items-center gap-3 text-sm font-medium border ${
              actionMessage.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {actionMessage.type === "success" ? (
              <CheckCircle size={18} className="text-emerald-600" />
            ) : (
              <AlertCircle size={18} className="text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
        )}

        {error && (
          <div className="border border-rose-200 bg-rose-50 rounded-xl px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* CATALOG TAB (CRUD LIST WITH THUMBNAILS) */}
        {tab === "catalog" && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Filter & Search Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Electronics Catalog</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Showing {filteredProducts.length} devices with active variants, images & EMI configuration
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1 bg-white border border-gray-200 p-1 rounded-lg">
                  {["all", "smartphones", "laptops", "earpods", "watches", "tablets", "accessories"].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded capitalize transition ${
                        selectedCategory === cat
                          ? "bg-black text-white"
                          : "text-gray-600 hover:text-black hover:bg-gray-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, brand, SKU..."
                    className="w-full sm:w-64 pl-9 pr-3 py-1.5 text-xs bg-white border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
            </div>

            {/* Products Table / Cards */}
            <div className="divide-y divide-gray-100">
              {filteredProducts.map((product) => {
                const thumbnail =
                  (Array.isArray(product.images) && product.images[0]) ||
                  (Array.isArray(product.variants) && product.variants[0]?.images?.[0]) ||
                  "/placeholder.svg"
                const variantsCount = Array.isArray(product.variants) ? product.variants.length : 0
                const isOutOfStock = (product.stockQuantity || 0) <= 0

                return (
                  <div
                    key={product._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 hover:bg-gray-50/70 transition"
                  >
                    {/* Left: Product Thumbnail + Info */}
                    <div className="flex items-start sm:items-center gap-4 min-w-0">
                      {/* Product Image Thumbnail */}
                      <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-white p-1.5 shadow-sm">
                        <img
                          src={thumbnail}
                          alt={product.name}
                          className="h-full w-full object-contain"
                          onError={(e) => {
                            ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                          }}
                        />
                      </div>

                      {/* Product Details */}
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                            {product.brand}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {product.category}
                          </span>
                          {isOutOfStock ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                              Out of stock
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                              {product.stockQuantity || 0} in stock
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-gray-900 truncate">
                          {product.name}
                        </h3>

                        {/* Variants summary */}
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                          <Layers size={13} className="text-gray-400" />
                          <span>{variantsCount} {variantsCount === 1 ? "Variant" : "Variants"}:</span>
                          {Array.isArray(product.variants) &&
                            product.variants.slice(0, 3).map((v) => (
                              <span
                                key={v.sku}
                                className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[11px] font-medium"
                              >
                                {v.storage || v.color || v.label}
                              </span>
                            ))}
                          {variantsCount > 3 && (
                            <span className="text-[11px] text-gray-400">+{variantsCount - 3} more</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Pricing + Actions */}
                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                      {/* Price display */}
                      <div className="text-left sm:text-right">
                        <div className="text-lg font-bold text-gray-900">
                          ₹{Number(product.price || 0).toLocaleString("en-IN")}
                        </div>
                        {product.mrp > product.price && (
                          <div className="text-xs text-gray-400 line-through">
                            ₹{Number(product.mrp || 0).toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons: Edit, Delete, View */}
                      <div className="flex items-center gap-1.5">
                        {/* View in Storefront */}
                        <Link
                          href={`/product/${product.slug || product._id}`}
                          target="_blank"
                          className="p-2 text-gray-500 hover:text-black rounded-lg hover:bg-gray-100 border border-gray-200 transition"
                          title="View on store"
                        >
                          <ExternalLink size={15} />
                        </Link>

                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition shadow-sm"
                          title="Edit product"
                        >
                          <Edit size={13} />
                          Edit
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setDeleteModalProduct(product)}
                          className="p-2 text-rose-600 hover:text-rose-800 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
                          title="Delete product"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}

              {filteredProducts.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                  <p className="text-base font-semibold text-gray-700">No electronics devices found</p>
                  <p className="text-xs text-gray-400 mt-1">Try adjusting your category filter or search query.</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* OVERVIEW & METRICS TAB */}
        {tab === "overview" && (
          <div className="space-y-8">
            {/* Top 4 KPI Metrics */}
            <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  label: "Live Devices",
                  value: metrics.products,
                  icon: Smartphone,
                  subtext: "Active in store catalog",
                  color: "bg-blue-50 text-blue-600 border-blue-100",
                },
                {
                  label: "Total Variants",
                  value: metrics.variants,
                  icon: Boxes,
                  subtext: "Memory & color options",
                  color: "bg-purple-50 text-purple-600 border-purple-100",
                },
                {
                  label: "Units in Stock",
                  value: metrics.stock,
                  icon: PackageCheck,
                  subtext: "Sellable inventory",
                  color: "bg-emerald-50 text-emerald-600 border-emerald-100",
                },
                {
                  label: "Tracked Sales",
                  value: `₹${Number(metrics.revenue || 0).toLocaleString("en-IN")}`,
                  icon: TrendingUp,
                  subtext: `From ${orders.length} orders`,
                  color: "bg-amber-50 text-amber-600 border-amber-100",
                },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.label}
                    className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{item.label}</p>
                      <div className={`p-2.5 rounded-xl border ${item.color}`}>
                        <Icon size={18} />
                      </div>
                    </div>
                    <p className="mt-4 text-3xl font-bold text-gray-900">{item.value}</p>
                    <p className="mt-1 text-xs text-gray-400">{item.subtext}</p>
                  </div>
                )
              })}
            </section>

            {/* Two-Column Detail Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Recent Products Card */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Newest Devices</h3>
                    <p className="text-xs text-gray-500">Recently added catalog inventory</p>
                  </div>
                  <button
                    onClick={() => setTab("catalog")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
                  >
                    View all <ArrowRight size={13} />
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {products.slice(0, 5).map((p) => {
                    const thumb =
                      (Array.isArray(p.images) && p.images[0]) ||
                      (Array.isArray(p.variants) && p.variants[0]?.images?.[0]) ||
                      "/placeholder.svg"

                    return (
                      <div key={p._id} className="flex items-center justify-between py-3 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={thumb}
                            alt={p.name}
                            className="h-10 w-10 shrink-0 object-contain rounded-lg border border-gray-200 bg-white p-0.5"
                            onError={(e) => {
                              ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                            }}
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-gray-500">
                              {p.brand} · {p.category} · {p.variants?.length || 0} variants
                            </p>
                          </div>
                        </div>

                        <span className="text-xs font-bold text-gray-900 shrink-0">
                          ₹{Number(p.price || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    )
                  })}

                  {products.length === 0 && (
                    <p className="py-8 text-center text-xs text-gray-400">No devices in catalog yet.</p>
                  )}
                </div>
              </div>

              {/* Fulfilment & Orders Status */}
              <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">Fulfilment Status</h3>
                    <p className="text-xs text-gray-500">Customer orders & pipeline</p>
                  </div>
                  <button
                    onClick={() => setTab("orders")}
                    className="inline-flex items-center gap-1 text-xs font-bold text-black hover:underline"
                  >
                    View orders <ArrowRight size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="flex items-center gap-2 text-amber-800">
                      <Clock size={16} />
                      <span className="text-xs font-bold">Action Needed</span>
                    </div>
                    <p className="text-2xl font-bold text-amber-900 mt-2">{metrics.pending}</p>
                    <p className="text-[11px] text-amber-700 mt-0.5">Pending or processing</p>
                  </div>

                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-2 text-emerald-800">
                      <CheckCircle2 size={16} />
                      <span className="text-xs font-bold">Total Orders</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-900 mt-2">{orders.length}</p>
                    <p className="text-[11px] text-emerald-700 mt-0.5">Recorded purchases</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Recent Activity
                  </p>
                  <div className="space-y-2">
                    {orders.slice(0, 3).map((ord) => (
                      <div
                        key={ord._id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 text-xs"
                      >
                        <div>
                          <span className="font-bold text-gray-900">{ord.orderNumber || ord._id}</span>
                          <span className="text-gray-400 ml-2">({ord.userEmail})</span>
                        </div>
                        <span className="font-bold text-gray-900">
                          ₹{Number(ord.total || 0).toLocaleString("en-IN")}
                        </span>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <p className="py-4 text-center text-xs text-gray-400">No order activity yet.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ADD PRODUCT TAB */}
        {tab === "add" && (
          <AdminProductForm
            onSaved={() => {
              setTab("catalog")
              loadData(true)
            }}
            onCancel={() => setTab("catalog")}
          />
        )}

        {/* EDIT PRODUCT TAB */}
        {tab === "edit" && editingProduct && (
          <AdminProductForm
            initialProduct={editingProduct as any}
            onSaved={() => {
              setEditingProduct(null)
              setTab("catalog")
              loadData(true)
            }}
            onCancel={() => {
              setEditingProduct(null)
              setTab("catalog")
            }}
          />
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-bold text-gray-900">Customer Orders</h2>
              <p className="text-xs text-gray-500 mt-0.5">Manage order statuses, payments, and customer purchases</p>
            </div>

            <div className="divide-y divide-gray-100">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_1.4fr_0.8fr_1fr_1fr] md:items-center hover:bg-gray-50/70 transition"
                >
                  <div>
                    <p className="font-bold text-sm text-gray-900">{order.orderNumber || order._id}</p>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>

                  <p className="truncate text-sm text-gray-700">{order.userEmail}</p>

                  <p className="font-bold text-sm text-gray-900">
                    ₹{Number(order.total || 0).toLocaleString("en-IN")}
                  </p>

                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold w-fit ${
                      order.paymentStatus === "paid"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {order.paymentStatus || "pending"}
                  </span>

                  <select
                    value={order.orderStatus}
                    onChange={(event) => updateOrderStatus(order._id, event.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-xs font-semibold bg-white outline-none focus:ring-2 focus:ring-black"
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              ))}

              {orders.length === 0 && (
                <p className="p-12 text-center text-sm text-gray-500">No customer orders recorded yet.</p>
              )}
            </div>
          </section>
        )}
      </div>

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl space-y-4 border border-gray-100">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-3 bg-rose-100 rounded-xl">
                <Trash2 size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Delete Product?</h3>
                <p className="text-xs text-gray-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              Are you sure you want to permanently delete{" "}
              <strong className="text-gray-900">"{deleteModalProduct.name}"</strong>? It will be removed from the catalog, search indexes, and storefront immediately.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteModalProduct(null)}
                className="px-4 py-2 text-sm font-semibold border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={confirmDeleteProduct}
                className="px-5 py-2 text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Yes, Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}
