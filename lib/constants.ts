// Shared constants

export const CATEGORIES = [
  { name: "Smartphones", slug: "smartphones" },
  { name: "Laptops", slug: "laptops" },
  { name: "Tablets", slug: "tablets" },
  { name: "Accessories", slug: "accessories" },
] as const

export const ROUTES = {
  home: "/",
  shop: "/shop",
  cart: "/cart",
  wishlist: "/wishlist",
  checkout: "/checkout",
  profile: "/profile",
  myOrders: "/my-orders",
  collections: (slug: string) => `/collections/${slug}`,
  product: (id: string | number) => `/product/${id}`,
} as const
