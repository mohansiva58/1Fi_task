"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { logger } from "@/lib/logger"
// Navbar and FloatingNav are rendered globally in layout
import Footer from "@/components/footer"
import ProductCard from "@/components/product-card"
import {
  ChevronDown,
  Filter,
  X,
  SlidersHorizontal,
  Smartphone,
  Laptop,
  Headphones,
  Watch,
  Tablet,
  Tag,
  Layers,
  RotateCcw,
  Search,
} from "lucide-react"
import { useProducts } from "@/hooks/use-products"

interface Product {
  _id: string
  id: string
  name: string
  price: number
  mrp: number
  images: string[]
  colors: string[]
  sizes: string[]
  category: string
  inStock: boolean
  stockQuantity: number
  discount: number
}

const priceRanges = [
  { label: "All Prices", min: 0, max: Number.POSITIVE_INFINITY },
  { label: "Under ₹10,000", min: 0, max: 10000 },
  { label: "₹10,000 - ₹25,000", min: 10000, max: 25000 },
  { label: "₹25,000 - ₹50,000", min: 25000, max: 50000 },
  { label: "₹50,000 - ₹1,00,000", min: 50000, max: 100000 },
  { label: "Over ₹1,00,000", min: 100000, max: Number.POSITIVE_INFINITY },
]

function formatCategoryName(cat: string) {
  if (!cat || cat.toLowerCase() === "all") return "All Categories"
  if (cat.toLowerCase() === "earpods") return "EarPods"
  if (cat.toLowerCase() === "smartphones") return "Smartphones"
  if (cat.toLowerCase() === "laptops") return "Laptops"
  if (cat.toLowerCase() === "watches") return "Watches"
  if (cat.toLowerCase() === "tablets") return "Tablets"
  if (cat.toLowerCase() === "accessories") return "Accessories"
  return cat.charAt(0).toUpperCase() + cat.slice(1)
}

function getCategoryIcon(cat: string, className = "w-3.5 h-3.5") {
  const c = cat.toLowerCase()
  if (c === "all") return <Layers className={className} />
  if (c === "smartphones") return <Smartphone className={className} />
  if (c === "laptops") return <Laptop className={className} />
  if (c === "earpods") return <Headphones className={className} />
  if (c === "watches") return <Watch className={className} />
  if (c === "tablets") return <Tablet className={className} />
  return <Tag className={className} />
}

function ShopPageContent() {
  const searchParams = useSearchParams()
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [selectedPrice, setSelectedPrice] = useState({ min: 0, max: Number.POSITIVE_INFINITY })
  const [sortBy, setSortBy] = useState("newest")
  const [showFilters, setShowFilters] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState("") // Input field value
  const [searchQuery, setSearchQuery] = useState("") // Actual search query sent to API
  const [page, setPage] = useState(1)
  const limit = 16 // Load 16 products at a time for faster performance

  // Set initial category and search from URL parameters
  useEffect(() => {
    const categoryParam = searchParams.get("category")
    const searchParam = searchParams.get("search")

    if (categoryParam) {
      setSelectedCategory(categoryParam)
    }

    if (searchParam) {
      setSearchInput(searchParam)
      setSearchQuery(searchParam)
    }
  }, [searchParams])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [selectedCategory, selectedPrice, sortBy, searchQuery])

  const { products, total, totalPages, loading, error } = useProducts({
    category: selectedCategory === "All" ? undefined : selectedCategory,
    search: searchQuery || undefined,
    page,
    limit,
    sort: sortBy,
  })

  // Handle search submission
  const handleSearch = () => {
    setSearchQuery(searchInput)
    setPage(1)
  }

  // Handle Enter key press in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  // Close mobile filters when screen size changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileFiltersOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Get unique categories from products (for filter sidebar)
  const categories = useMemo(() => {
    const defaultCats = ["smartphones", "laptops", "earpods", "watches", "tablets", "accessories"]
    const cats = new Set<string>(defaultCats)
    products.forEach((p) => {
      if (p.category) {
        cats.add(p.category.toLowerCase().trim())
      }
    })
    return ["All", ...Array.from(cats)]
  }, [products])

  // Only apply price filter client-side (everything else is server-side)
  const filteredProducts = useMemo(() => {
    // If no price filter is applied (default state), return all products
    if (selectedPrice.min === 0 && selectedPrice.max === Number.POSITIVE_INFINITY) {
      return products
    }
    // Otherwise apply price filter
    return products.filter((p) => p.price >= selectedPrice.min && p.price <= selectedPrice.max)
  }, [products, selectedPrice])

  const hasActiveFilters =
    selectedCategory !== "All" ||
    selectedPrice.min !== 0 ||
    selectedPrice.max !== Number.POSITIVE_INFINITY ||
    Boolean(searchQuery)

  const handleResetFilters = () => {
    setSelectedCategory("All")
    setSelectedPrice({ min: 0, max: Number.POSITIVE_INFINITY })
    setSearchInput("")
    setSearchQuery("")
    setPage(1)
  }

  if (loading) {
    return (
      <>
        <div className="min-h-screen bg-white">
          <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <div className="flex gap-8">
              {/* Sidebar skeleton */}
              <div className="hidden lg:block w-72 flex-shrink-0">
                <div className="bg-gray-100 rounded-2xl h-96 animate-pulse"></div>
              </div>
              
              {/* Products grid skeleton */}
              <div className="flex-1">
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-10">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="bg-gray-200 rounded-lg aspect-[3/4] mb-3"></div>
                      <div className="bg-gray-200 rounded h-4 mb-2 w-3/4"></div>
                      <div className="bg-gray-200 rounded h-4 w-1/2"></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  if (error) {
    return (
      <>
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center max-w-md">
            <p className="text-red-600 mb-4">Error loading products: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </>
    )
  }

  logger.debug('[Shop Debug] Products from API:', products.length, 'Filtered:', filteredProducts.length, 'Loading:', loading)

  return (
    <>
      <main className="bg-white min-h-screen pb-20 md:pb-12">
        <style jsx global>{`
          @keyframes fade-in-up {
            from {
              opacity: 0;
              transform: translateY(8px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          @keyframes slide-in-left {
            from {
              transform: translateX(-100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
          .animate-fade-in-up {
            animation: fade-in-up 360ms ease-out both;
          }
          .animate-slide-in-left {
            animation: slide-in-left 320ms cubic-bezier(0.22, 0.9, 0.32, 1) both;
          }
          .scrollbar-none::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-none {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
        `}</style>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
          {/* Top Category Filter Pills Row */}
          <div className="mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {categories.map((cat) => {
                const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
                return (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat)
                      setPage(1)
                    }}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 shrink-0 ${
                      isSelected
                        ? "bg-black text-white shadow-sm ring-1 ring-black scale-[1.02]"
                        : "bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {getCategoryIcon(cat, "w-3.5 h-3.5")}
                    <span>{formatCategoryName(cat)}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
            {/* Mobile Filter Drawer Overlay */}
            {mobileFiltersOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-black/40 backdrop-blur-xs"
                  onClick={() => setMobileFiltersOpen(false)}
                />
                <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto animate-slide-in-left p-5">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
                    <div className="flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-gray-900" />
                      <h2 className="text-base font-semibold text-gray-900">Filters</h2>
                    </div>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg"
                      aria-label="Close filters"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Mobile Categories */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                      Categories
                    </h3>
                    <div className="space-y-1">
                      {categories.map((cat) => {
                        const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
                        return (
                          <button
                            key={cat}
                            onClick={() => {
                              setSelectedCategory(cat)
                              setMobileFiltersOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                              isSelected
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {getCategoryIcon(cat, "w-3.5 h-3.5")}
                              <span>{formatCategoryName(cat)}</span>
                            </div>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Mobile Price Range */}
                  <div className="mb-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2.5">
                      Price Range
                    </h3>
                    <div className="space-y-1">
                      {priceRanges.map((range) => {
                        const isSelected =
                          selectedPrice.min === range.min && selectedPrice.max === range.max
                        return (
                          <button
                            key={range.label}
                            onClick={() => {
                              setSelectedPrice({ min: range.min, max: range.max })
                              setMobileFiltersOpen(false)
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-lg transition-all ${
                              isSelected
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            <span>{range.label}</span>
                            {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => {
                        handleResetFilters()
                        setMobileFiltersOpen(false)
                      }}
                      className="w-full py-2.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset Filters
                    </button>
                    <button
                      onClick={() => setMobileFiltersOpen(false)}
                      className="w-full py-2.5 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800"
                    >
                      Show Results ({filteredProducts.length})
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Filters Sidebar - Small, Compact & Clean */}
            <div className="hidden lg:block w-60 shrink-0">
              <div className="sticky top-24 bg-white border border-gray-200/80 rounded-xl p-4 shadow-xs space-y-4">
                {/* Header with reset */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-gray-700" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-900">
                      Filters
                    </span>
                  </div>
                  {hasActiveFilters && (
                    <button
                      onClick={handleResetFilters}
                      className="text-[11px] font-semibold text-gray-500 hover:text-black transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                {/* Categories - Compact List */}
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Categories
                  </h4>
                  <div className="space-y-0.5">
                    {categories.map((cat) => {
                      const isSelected = selectedCategory.toLowerCase() === cat.toLowerCase()
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat)
                            setPage(1)
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                            isSelected
                              ? "bg-black text-white font-semibold shadow-xs"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {getCategoryIcon(cat, isSelected ? "w-3.5 h-3.5 text-white" : "w-3.5 h-3.5 text-gray-500")}
                            <span className="truncate">{formatCategoryName(cat)}</span>
                          </div>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Price Range - Compact List */}
                <div className="pt-2 border-t border-gray-100">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Price Range
                  </h4>
                  <div className="space-y-0.5">
                    {priceRanges.map((range) => {
                      const isSelected =
                        selectedPrice.min === range.min && selectedPrice.max === range.max
                      return (
                        <button
                          key={range.label}
                          onClick={() => {
                            setSelectedPrice({ min: range.min, max: range.max })
                            setPage(1)
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-all ${
                            isSelected
                              ? "bg-black text-white font-semibold shadow-xs"
                              : "text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                          }`}
                        >
                          <span>{range.label}</span>
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></span>}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Reset Button */}
                {hasActiveFilters && (
                  <button
                    onClick={handleResetFilters}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 hover:text-black border border-gray-200 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset All Filters
                  </button>
                )}
              </div>
            </div>

            {/* Products Section */}
            <div className="flex-1 min-w-0">
              {/* Top Controls Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5 p-3 bg-gray-50/80 rounded-xl border border-gray-200/70">
                {/* Left side - Product Count & Mobile Filters Button */}
                <div className="flex items-center gap-2.5">
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-800 shadow-xs"
                    aria-label="Open filters"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    <span>Filters</span>
                    {hasActiveFilters && (
                      <span className="w-2 h-2 rounded-full bg-black"></span>
                    )}
                  </button>

                  <p className="text-xs sm:text-sm text-gray-600 font-medium">
                    <span className="font-bold text-gray-900">{filteredProducts.length}</span>{" "}
                    product{filteredProducts.length !== 1 ? "s" : ""}
                    {selectedCategory !== "All" && (
                      <span className="text-gray-500 ml-1">
                        in <span className="font-semibold text-gray-900">{formatCategoryName(selectedCategory)}</span>
                      </span>
                    )}
                  </p>
                </div>

                {/* Right side - Inline Search & Sort */}
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  {/* Inline Search Box */}
                  <div className="relative flex-1 sm:flex-initial">
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={handleSearchKeyPress}
                      placeholder="Search electronics..."
                      className="w-full sm:w-40 md:w-48 pl-8 pr-7 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black placeholder-gray-400"
                    />
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    {searchInput && (
                      <button
                        onClick={() => {
                          setSearchInput("")
                          setSearchQuery("")
                          setPage(1)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative min-w-[130px] sm:min-w-[150px]">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="appearance-none w-full pl-2.5 pr-7 py-1.5 text-xs font-medium border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black bg-white cursor-pointer"
                    >
                      <option value="newest">Newest First</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                      <option value="discount">Best Discount</option>
                    </select>
                    <ChevronDown
                      size={13}
                      className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400"
                    />
                  </div>
                </div>
              </div>

              {/* Active Filter Chips Bar (When any filter is active) */}
              {hasActiveFilters && (
                <div className="flex items-center gap-2 flex-wrap mb-4 px-1">
                  <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Active:</span>

                  {selectedCategory !== "All" && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {formatCategoryName(selectedCategory)}
                      <button
                        onClick={() => setSelectedCategory("All")}
                        className="hover:text-black ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {(selectedPrice.min !== 0 || selectedPrice.max !== Number.POSITIVE_INFINITY) && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {priceRanges.find(
                        (r) => r.min === selectedPrice.min && r.max === selectedPrice.max
                      )?.label || `₹${selectedPrice.min} - ₹${selectedPrice.max}`}
                      <button
                        onClick={() => setSelectedPrice({ min: 0, max: Number.POSITIVE_INFINITY })}
                        className="hover:text-black ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  {searchQuery && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      "{searchQuery}"
                      <button
                        onClick={() => {
                          setSearchInput("")
                          setSearchQuery("")
                        }}
                        className="hover:text-black ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  )}

                  <button
                    onClick={handleResetFilters}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline ml-1"
                  >
                    Clear all
                  </button>
                </div>
              )}

              {/* Products Display - Grid View */}
              {filteredProducts.length > 0 ? (
                <div>
                  {/* Desktop: 3-column grid */}
                  <div className="hidden lg:grid lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="group relative bg-white rounded-xl overflow-hidden transition-all duration-300"
                        tabIndex={0}
                        aria-label={product.name}
                      >
                        <ProductCard
                          product={{
                            id: product._id,
                            name: product.name,
                            price: product.price,
                            mrp: product.mrp,
                            discount: product.discount,
                            image:
                              product.images && product.images.length > 0 && product.images[0]
                                ? product.images[0]
                                : "/placeholder.jpg",
                            images: product.images || [],
                            colors: product.colors || [],
                            stockQuantity: product.stockQuantity,
                            inStock: product.inStock,
                            emiPlans: (product as any).emiPlans || [],
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Mobile/Tablet: 2-column grid */}
                  <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:hidden">
                    {filteredProducts.map((product) => (
                      <div
                        key={product._id}
                        className="group rounded-xl transition-all duration-300"
                        tabIndex={0}
                        aria-label={product.name}
                      >
                        <ProductCard
                          product={{
                            id: product._id,
                            name: product.name,
                            price: product.price,
                            mrp: product.mrp,
                            discount: product.discount,
                            image:
                              product.images && product.images.length > 0 && product.images[0]
                                ? product.images[0]
                                : "/placeholder.jpg",
                            images: product.images || [],
                            colors: product.colors || [],
                            stockQuantity: product.stockQuantity,
                            inStock: product.inStock,
                            emiPlans: (product as any).emiPlans || [],
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 animate-fade-in-up">
                  <div className="max-w-md mx-auto">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                      <Filter className="w-6 h-6 text-gray-400" />
                    </div>
                    <h3 className="text-base font-semibold text-gray-900 mb-1">No products found</h3>
                    <p className="text-xs text-gray-500 mb-5">
                      Try adjusting your filters or search query to find what you're looking for.
                    </p>
                    <button
                      onClick={handleResetFilters}
                      className="px-5 py-2 bg-black text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {filteredProducts.length > 0 && (
                <div className="flex flex-col items-center gap-3 mt-10">
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Previous
                    </button>
                    <div className="px-3.5 py-2 bg-black text-white rounded-lg text-xs font-bold">
                      Page {page} {totalPages > 0 && `of ${totalPages}`}
                    </div>
                    <button
                      disabled={totalPages > 0 && page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                    >
                      Next
                    </button>
                  </div>
                  {total > 0 && (
                    <p className="text-xs text-gray-500">
                      Showing {Math.min((page - 1) * limit + 1, total)} -{" "}
                      {Math.min(page * limit, total)} of {total} products
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function ShopPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white">
        <main className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading products...</p>
          </div>
        </main>
        <Footer />
      </div>
    }>
      <ShopPageContent />
    </Suspense>
  )
}
