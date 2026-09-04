"use client"

import { useEffect, useMemo, useState } from "react"
import { Boxes, CreditCard, Laptop, LogIn, LogOut, PackageCheck, Plus, RefreshCw, Smartphone } from "lucide-react"
import AdminProductForm from "@/components/admin-product-form"
import Link from "next/link"

type Variant = {
  sku: string
  label: string
  price: number
  stockQuantity: number
  emiPlans?: { interestRate: number }[]
}

type Product = {
  _id: string
  name: string
  brand: string
  category: string
  price: number
  mrp: number
  stockQuantity: number
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

const statusOptions = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]

export default function ElectronicsAdminDashboard() {
  const [tab, setTab] = useState<"overview" | "catalog" | "orders" | "add">("overview")
  const [products, setProducts] = useState<Product[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [query, setQuery] = useState("")
  const [error, setError] = useState<string | null>(null)
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
      if (!productsData.success) throw new Error(productsData.error || "Could not load catalog")
      setProducts(productsData.data || [])
      setOrders(ordersData.success ? ordersData.data || ordersData.orders || [] : [])
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load dashboard")
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetch("/api/admin/auth/me").then((response) => {
      if (response.ok) {
        setAuthenticated(true)
        loadData()
      }
    }).finally(() => setAuthChecked(true))
  }, [])

  async function login(event: React.FormEvent) {
    event.preventDefault()
    setAuthError(null)
    const response = await fetch("/api/admin/auth/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) })
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
    setOrders((current) => current.map((order) => order._id === orderId ? { ...order, orderStatus } : order))
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return products
    return products.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalized))
  }, [products, query])

  const metrics = useMemo(() => ({
    products: products.length,
    variants: products.reduce((sum, product) => sum + (product.variants?.length || 0), 0),
    stock: products.reduce((sum, product) => sum + (product.stockQuantity || 0), 0),
    zeroPercent: products.reduce((sum, product) => sum + (product.variants || []).reduce((variantSum, variant) => variantSum + (variant.emiPlans || []).filter((plan) => plan.interestRate === 0).length, 0), 0),
    pending: orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.orderStatus)).length,
    revenue: orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
  }), [products, orders])

  if (!authChecked) {
    return <div className="flex min-h-screen items-center justify-center bg-[#eef3f5] text-slate-600">Checking admin session...</div>
  }

  if (!authenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-[#102a2f] px-5"><form onSubmit={login} className="w-full max-w-md border border-cyan-200/20 bg-white p-8 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700">EMI Platform / Admin</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Control room login</h1><p className="mt-2 text-sm text-slate-500">Use the configured admin email and password.</p><div className="mt-7 space-y-4"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-700" /><input required type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" className="w-full border border-slate-300 px-3 py-3 text-sm outline-none focus:border-cyan-700" />{authError && <p className="text-sm text-rose-700">{authError}</p>}<button className="inline-flex w-full items-center justify-center gap-2 bg-[#102a2f] px-4 py-3 text-sm font-semibold text-white hover:bg-[#173b40]"><LogIn size={16} /> Sign in</button></div></form></main>
  }

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center bg-[#eef3f5] text-slate-600">Loading EMI operations...</div>
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="border-b border-black bg-white text-black">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-7 md:px-8">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.22em] text-gray-500">EMI Platform / Control Room</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Electronics operations</h1>
            <p className="mt-2 text-sm text-gray-600">Catalog, inventory, mutual-fund EMI plans, and fulfilment in one view.</p>
          </div>
          <div className="flex flex-wrap gap-2"><Link href="/" className="inline-flex items-center gap-2 border border-black px-4 py-2 text-sm font-semibold hover:bg-black hover:text-white">Return home</Link><button onClick={() => setTab("add")} className="inline-flex items-center gap-2 bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"><Plus size={16} /> Add product</button><button onClick={() => loadData(true)} disabled={refreshing} className="inline-flex items-center gap-2 border border-black px-4 py-2 text-sm font-semibold text-black hover:bg-gray-100 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button><button onClick={logout} className="inline-flex items-center gap-2 border border-black px-3 py-2 text-sm font-semibold text-black hover:bg-gray-100"><LogOut size={16} /> Logout</button></div>
        </div>
      </header>

      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-5 md:px-8">
          {([["overview", "Overview"], ["catalog", "Electronics catalog"], ["orders", "Orders"], ["add", "Add product"]] as const).map(([value, label]) => (
            <button key={value} onClick={() => setTab(value)} className={`border-b-2 px-1 py-4 text-sm font-semibold whitespace-nowrap ${tab === value ? "border-cyan-700 text-cyan-800" : "border-transparent text-slate-500 hover:text-slate-900"}`}>
              {label}
            </button>
          ))}
        </div>
      </nav>

      <div className="mx-auto max-w-7xl space-y-7 px-5 py-7 md:px-8">
        {error && <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

        {tab === "overview" && (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Live products", metrics.products, Smartphone],
                ["Sellable variants", metrics.variants, Boxes],
                ["Units in stock", metrics.stock, PackageCheck],
                ["0% EMI plans", metrics.zeroPercent, CreditCard],
              ].map(([label, value, Icon]) => (
                <div key={String(label)} className="border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between"><p className="text-sm font-medium text-slate-500">{label}</p><Icon size={21} className="text-cyan-700" /></div>
                  <p className="mt-5 text-3xl font-semibold">{value}</p>
                </div>
              ))}
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
              <div className="border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Catalog pulse</p><h2 className="mt-1 text-xl font-semibold">Newest devices</h2></div><Laptop className="text-slate-300" /></div>
                <div className="divide-y divide-slate-100">
                  {products.slice(0, 5).map((product) => <div key={product._id} className="flex items-center justify-between gap-4 py-4"><div><p className="font-semibold">{product.name}</p><p className="text-sm text-slate-500">{product.brand} · {product.category} · {product.variants?.length || 0} variants</p></div><p className="font-semibold">₹{Number(product.price || 0).toLocaleString("en-IN")}</p></div>)}
                  {products.length === 0 && <p className="py-8 text-sm text-slate-500">No active electronics products found.</p>}
                </div>
              </div>
              <div className="border border-black bg-black p-6 text-white shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-gray-300">Fulfilment queue</p><h2 className="mt-1 text-xl font-semibold">Orders needing attention</h2><p className="mt-8 text-5xl font-semibold">{metrics.pending}</p><p className="mt-2 text-sm text-gray-300">pending or processing orders</p><div className="mt-8 border-t border-white/20 pt-4 text-sm text-gray-300"><div className="flex justify-between"><span>Order value tracked</span><span className="font-semibold text-white">₹{metrics.revenue.toLocaleString("en-IN")}</span></div></div></div>
            </section>
          </>
        )}

        {tab === "catalog" && (
          <section className="border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-6 md:flex-row md:items-center md:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Inventory</p><h2 className="mt-1 text-xl font-semibold">Electronics catalog</h2></div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search devices" className="border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-700" /></div>
            <div className="divide-y divide-slate-100">{filteredProducts.map((product) => <div key={product._id} className="grid gap-3 px-6 py-5 md:grid-cols-[1.5fr_0.8fr_0.8fr_1fr] md:items-center"><div><p className="font-semibold">{product.name}</p><p className="text-sm text-slate-500">{product.brand} · {product.category}</p></div><p className="font-medium">₹{Number(product.price || 0).toLocaleString("en-IN")}</p><p className="text-sm text-slate-600">{product.stockQuantity || 0} units</p><p className="text-sm text-cyan-800">{product.variants?.length || 0} variants · {(product.variants || []).reduce((sum, variant) => sum + (variant.emiPlans || []).filter((plan) => plan.interestRate === 0).length, 0)} zero-interest plans</p></div>)}{filteredProducts.length === 0 && <p className="p-8 text-sm text-slate-500">No matching devices.</p>}</div>
          </section>
        )}

        {tab === "add" && <AdminProductForm onCreated={() => { setTab("catalog"); loadData(true) }} />}

        {tab === "orders" && (
          <section className="border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 p-6"><p className="text-xs font-semibold uppercase tracking-wider text-cyan-700">Fulfilment</p><h2 className="mt-1 text-xl font-semibold">Customer orders</h2></div><div className="divide-y divide-slate-100">{orders.map((order) => <div key={order._id} className="grid gap-4 px-6 py-5 md:grid-cols-[1fr_1.4fr_0.8fr_1fr_1fr] md:items-center"><div><p className="font-semibold">{order.orderNumber || order._id}</p><p className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p></div><p className="truncate text-sm text-slate-600">{order.userEmail}</p><p className="font-semibold">₹{Number(order.total || 0).toLocaleString("en-IN")}</p><span className="text-sm text-slate-600">{order.paymentStatus || "pending payment"}</span><select value={order.orderStatus} onChange={(event) => updateOrderStatus(order._id, event.target.value)} className="border border-slate-300 px-2 py-2 text-sm"><option value="">Choose status</option>{statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}</select></div>)}{orders.length === 0 && <p className="p-8 text-sm text-slate-500">No orders found.</p>}</div></section>
        )}
      </div>
    </main>
  )
}
