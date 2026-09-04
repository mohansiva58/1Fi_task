"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Boxes,
  CreditCard,
  LayoutGrid,
  ListOrdered,
  Lock,
  LogOut,
  PackageCheck,
  PlusCircle,
  RefreshCw,
  Search,
  Smartphone,
} from "lucide-react"
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

const navItems = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "catalog", label: "Catalog", icon: Smartphone },
  { key: "orders", label: "Orders", icon: ListOrdered },
  { key: "add", label: "Add product", icon: PlusCircle },
] as const

type TabKey = (typeof navItems)[number]["key"]

const statusTone: Record<string, string> = {
  pending: "bg-[#fff4e5] text-[#c2760c]",
  confirmed: "bg-[#e8f0fe] text-[#0b5ed7]",
  processing: "bg-[#e8f0fe] text-[#0b5ed7]",
  shipped: "bg-[#eaf6ff] text-[#0071e3]",
  delivered: "bg-[#e7f8ed] text-[#1a7f3c]",
  cancelled: "bg-[#fdeceb] text-[#c62d27]",
}

export default function ElectronicsAdminDashboard() {
  const [tab, setTab] = useState<TabKey>("overview")
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
    setOrders((current) => current.map((order) => (order._id === orderId ? { ...order, orderStatus } : order)))
  }

  const filteredProducts = useMemo(() => {
    const normalized = query.toLowerCase().trim()
    if (!normalized) return products
    return products.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(normalized))
  }, [products, query])

  const metrics = useMemo(
    () => ({
      products: products.length,
      variants: products.reduce((sum, product) => sum + (product.variants?.length || 0), 0),
      stock: products.reduce((sum, product) => sum + (product.stockQuantity || 0), 0),
      zeroPercent: products.reduce(
        (sum, product) =>
          sum + (product.variants || []).reduce((variantSum, variant) => variantSum + (variant.emiPlans || []).filter((plan) => plan.interestRate === 0).length, 0),
        0,
      ),
      pending: orders.filter((order) => ["pending", "confirmed", "processing"].includes(order.orderStatus)).length,
      revenue: orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0),
    }),
    [products, orders],
  )

  const fontStack =
    "'SF Pro Display', 'SF Pro Text', -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, Helvetica, Arial, sans-serif"

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd] text-[#86868b]" style={{ fontFamily: fontStack }}>
        Checking admin session…
      </div>
    )
  }

  if (!authenticated) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfd] px-5" style={{ fontFamily: fontStack }}>
        <form onSubmit={login} className="w-full max-w-[380px] rounded-[22px] border border-[#e5e5e7] bg-white px-9 py-10 shadow-[0_20px_60px_-24px_rgba(0,0,0,0.15)]">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f5f7]">
            <Lock size={20} className="text-[#1d1d1f]" strokeWidth={1.75} />
          </div>
          <h1 className="text-center text-[22px] font-semibold tracking-tight text-[#1d1d1f]">Control Room</h1>
          <p className="mx-auto mt-1.5 max-w-[260px] text-center text-[14px] leading-snug text-[#86868b]">
            Sign in with your admin email and password to manage the store.
          </p>

          <div className="mt-7 space-y-3">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Admin email"
              className="w-full rounded-[12px] border border-[#d2d2d7] bg-[#fbfbfd] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10"
            />
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              className="w-full rounded-[12px] border border-[#d2d2d7] bg-[#fbfbfd] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none transition focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10"
            />
            {authError && <p className="text-[13px] text-[#ff3b30]">{authError}</p>}
            <button className="mt-1 w-full rounded-[12px] bg-[#0071e3] py-3 text-[15px] font-medium text-white transition hover:bg-[#0077ed] active:scale-[0.99]">
              Sign in
            </button>
          </div>
        </form>
      </main>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fbfbfd] text-[#86868b]" style={{ fontFamily: fontStack }}>
        Loading store operations…
      </div>
    )
  }

  return (
    <main className="flex min-h-screen bg-[#fbfbfd] text-[#1d1d1f]" style={{ fontFamily: fontStack }}>
      {/* Sidebar */}
      <aside className="hidden w-[248px] shrink-0 flex-col border-r border-[#e5e5e7] bg-white/70 px-4 py-6 backdrop-blur md:flex">
        <div className="px-2">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#86868b]">Control Room</p>
          <h1 className="mt-1 text-[19px] font-semibold tracking-tight">Electronics</h1>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-0.5">
          {navItems.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium transition ${
                tab === key ? "bg-[#0071e3] text-white" : "text-[#3a3a3c] hover:bg-[#f5f5f7]"
              }`}
            >
              <Icon size={17} strokeWidth={1.9} />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex flex-col gap-1 border-t border-[#e5e5e7] pt-4">
          <Link href="/" className="rounded-[10px] px-3 py-2.5 text-[14px] font-medium text-[#3a3a3c] transition hover:bg-[#f5f5f7]">
            Return home
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-left text-[14px] font-medium text-[#ff3b30] transition hover:bg-[#fdeceb]"
          >
            <LogOut size={17} strokeWidth={1.9} />
            Sign out
          </button>
        </div>
      </aside>

      {/* Content */}
      <div className="flex-1">
        <header className="sticky top-0 z-10 border-b border-[#e5e5e7] bg-[#fbfbfd]/80 px-6 py-5 backdrop-blur md:px-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-[26px] font-semibold tracking-tight">{navItems.find((item) => item.key === tab)?.label}</h2>
              <p className="mt-0.5 text-[14px] text-[#86868b]">Catalog, inventory, EMI plans, and fulfilment in one place.</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-full border border-[#d2d2d7] bg-white px-4 py-2 text-[13px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7] disabled:opacity-50"
              >
                <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                Refresh
              </button>
              <button
                onClick={() => setTab("add")}
                className="flex items-center gap-2 rounded-full bg-[#0071e3] px-4 py-2 text-[13px] font-medium text-white transition hover:bg-[#0077ed]"
              >
                <PlusCircle size={14} />
                Add product
              </button>
            </div>
          </div>

          {/* Mobile nav */}
          <div className="mt-5 flex gap-1.5 overflow-x-auto md:hidden">
            {navItems.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-medium transition ${
                  tab === key ? "bg-[#0071e3] text-white" : "bg-white text-[#3a3a3c] ring-1 ring-[#e5e5e7]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </header>

        <div className="space-y-8 px-6 py-8 md:px-10">
          {error && (
            <div className="rounded-[14px] border border-[#f6cfc9] bg-[#fdeceb] px-4 py-3 text-[13px] text-[#c62d27]">{error}</div>
          )}

          {tab === "overview" && (
            <>
              <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Live products", metrics.products, Smartphone],
                  ["Sellable variants", metrics.variants, Boxes],
                  ["Units in stock", metrics.stock, PackageCheck],
                  ["0% EMI plans", metrics.zeroPercent, CreditCard],
                ].map(([label, value, Icon]) => (
                  <div
                    key={String(label)}
                    className="rounded-[18px] border border-[#e5e5e7] bg-white p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] transition hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.1)]"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[13px] font-medium text-[#86868b]">{label}</p>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f5f5f7]">
                        <Icon size={15} className="text-[#0071e3]" strokeWidth={2} />
                      </div>
                    </div>
                    <p className="mt-4 text-[32px] font-semibold tracking-tight">{value as number}</p>
                  </div>
                ))}
              </section>

              <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
                <div className="rounded-[18px] border border-[#e5e5e7] bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                  <h3 className="text-[17px] font-semibold tracking-tight">Newest devices</h3>
                  <div className="mt-3 divide-y divide-[#f0f0f2]">
                    {products.slice(0, 5).map((product) => (
                      <div key={product._id} className="flex items-center justify-between gap-4 py-3.5">
                        <div>
                          <p className="text-[14px] font-medium">{product.name}</p>
                          <p className="text-[13px] text-[#86868b]">
                            {product.brand} · {product.category} · {product.variants?.length || 0} variants
                          </p>
                        </div>
                        <p className="text-[14px] font-semibold">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
                      </div>
                    ))}
                    {products.length === 0 && <p className="py-8 text-[14px] text-[#86868b]">No active electronics products found.</p>}
                  </div>
                </div>

                <div className="rounded-[18px] bg-[#1d1d1f] p-6 text-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.15)]">
                  <h3 className="text-[17px] font-semibold tracking-tight text-white">Fulfilment queue</h3>
                  <p className="mt-1 text-[13px] text-[#a1a1a6]">Orders needing attention right now</p>
                  <p className="mt-8 text-[44px] font-semibold tracking-tight">{metrics.pending}</p>
                  <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4 text-[13px] text-[#a1a1a6]">
                    <span>Order value tracked</span>
                    <span className="font-semibold text-white">₹{metrics.revenue.toLocaleString("en-IN")}</span>
                  </div>
                </div>
              </section>
            </>
          )}

          {tab === "catalog" && (
            <section className="overflow-hidden rounded-[18px] border border-[#e5e5e7] bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="flex flex-col gap-4 border-b border-[#e5e5e7] p-6 md:flex-row md:items-center md:justify-between">
                <h3 className="text-[17px] font-semibold tracking-tight">Electronics catalog</h3>
                <div className="relative w-full md:w-72">
                  <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868b]" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search devices"
                    className="w-full rounded-full border border-[#d2d2d7] bg-[#fbfbfd] py-2 pl-9 pr-4 text-[13px] outline-none transition focus:border-[#0071e3] focus:bg-white focus:ring-4 focus:ring-[#0071e3]/10"
                  />
                </div>
              </div>
              <div className="divide-y divide-[#f0f0f2]">
                {filteredProducts.map((product) => (
                  <div key={product._id} className="grid gap-3 px-6 py-4.5 transition hover:bg-[#fafafc] md:grid-cols-[1.6fr_0.8fr_0.8fr_1.2fr] md:items-center">
                    <div>
                      <p className="text-[14px] font-medium">{product.name}</p>
                      <p className="text-[13px] text-[#86868b]">
                        {product.brand} · {product.category}
                      </p>
                    </div>
                    <p className="text-[14px] font-medium">₹{Number(product.price || 0).toLocaleString("en-IN")}</p>
                    <p className="text-[13px] text-[#86868b]">{product.stockQuantity || 0} units</p>
                    <p className="text-[13px] text-[#0071e3]">
                      {product.variants?.length || 0} variants ·{" "}
                      {(product.variants || []).reduce((sum, variant) => sum + (variant.emiPlans || []).filter((plan) => plan.interestRate === 0).length, 0)} zero-interest
                    </p>
                  </div>
                ))}
                {filteredProducts.length === 0 && <p className="p-8 text-[14px] text-[#86868b]">No matching devices.</p>}
              </div>
            </section>
          )}

          {tab === "add" && (
            <div className="rounded-[18px] border border-[#e5e5e7] bg-white p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <AdminProductForm
                onCreated={() => {
                  setTab("catalog")
                  loadData(true)
                }}
              />
            </div>
          )}

          {tab === "orders" && (
            <section className="overflow-hidden rounded-[18px] border border-[#e5e5e7] bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
              <div className="border-b border-[#e5e5e7] p-6">
                <h3 className="text-[17px] font-semibold tracking-tight">Customer orders</h3>
              </div>
              <div className="divide-y divide-[#f0f0f2]">
                {orders.map((order) => (
                  <div
                    key={order._id}
                    className="grid gap-4 px-6 py-4.5 transition hover:bg-[#fafafc] md:grid-cols-[1fr_1.4fr_0.8fr_0.9fr_1fr] md:items-center"
                  >
                    <div>
                      <p className="text-[14px] font-medium">{order.orderNumber || order._id}</p>
                      <p className="text-[12px] text-[#86868b]">{new Date(order.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <p className="truncate text-[13px] text-[#3a3a3c]">{order.userEmail}</p>
                    <p className="text-[14px] font-semibold">₹{Number(order.total || 0).toLocaleString("en-IN")}</p>
                    <span
                      className={`w-fit rounded-full px-2.5 py-1 text-[12px] font-medium ${statusTone[order.orderStatus] || "bg-[#f5f5f7] text-[#3a3a3c]"}`}
                    >
                      {order.paymentStatus || "pending payment"}
                    </span>
                    <select
                      value={order.orderStatus}
                      onChange={(event) => updateOrderStatus(order._id, event.target.value)}
                      className="rounded-[10px] border border-[#d2d2d7] bg-[#fbfbfd] px-2.5 py-2 text-[13px] outline-none transition focus:border-[#0071e3]"
                    >
                      <option value="">Choose status</option>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {orders.length === 0 && <p className="p-8 text-[14px] text-[#86868b]">No orders found.</p>}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  )
}