"use client"

import Link from "next/link"
import { motion } from "framer-motion"

type Category = {
  name: string
  category: string
  image: string
}

const categories: Category[] = [
  { name: "Smartphones", category: "smartphones", image: "/categorie/smartphones.png" },
  { name: "Laptops", category: "laptops", image: "/categorie/laptops.png" },
  { name: "iPhone 17 Pro", category: "smartphones", image: "/categorie/pods.png" },
  { name: "MacBook Air", category: "laptops", image: "/categorie/macbook.png" },
  { name: "Watches", category: "watches", image: "/categorie/watches.png" },
  { name: "Tablets", category: "tablets", image: "/categorie/tablets.png" }
]

export default function CategoriesGrid() {
  return (
    <section className="px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-6 lg:gap-8">
          {categories.map((cat, idx) => (
            <Link 
              key={cat.category} 
              href={cat.name === "Sale" ? `/shop?sort=discount` : `/shop?category=${cat.category}`}
              className="group"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.02 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 rounded-full overflow-hidden ring-1 ring-gray-200 bg-white">
                  <img
                    src={cat.image}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <p className="mt-3 text-center text-sm sm:text-base font-semibold text-gray-900 group-hover:text-gray-700">
                  {cat.name}
                </p>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
