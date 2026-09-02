"use client"

import Link from "next/link"
import { motion } from "framer-motion"

type Category = {
  name: string
  category: string
  image: string
}

const categories: Category[] = [
  { name: "Shirt", category: "Shirt", image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-air-202509?wid=400&hei=512&fmt=png-alpha&.v=M0dlUVBobHVpY1h1dmlaR3RZekpEMGtrRFZUNExaR0FUNGxJZXJuT2lqUjE5VXk1QVF5NWxrMFlTNWNpV2huNVM0TjRWdzF2UjRGVEY0c3dBQVZ6VGUza2N1YW5ubjVFaHZuNzNKcFIzTnc" },
  { name: "Jeans", category: "Jeans", image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-17e-202603?wid=380&hei=512&fmt=png-alpha&.v=M0dlUVBobHVpY1h1dmlaR3RZekpEMDMzS2xmcnFyN2JjeXRuNU5pL1ZKWDd4U2s1ZXUvWFMycmRmdnZ0Qnh2UFM0TjRWdzF2UjRGVEY0c3dBQVZ6VFlvQzhPSnlRVmhZb2dXWmJRTWFrTE0" },
  { name: "Sweatshirt", category: "Sweatshirt", image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-17e-202603?wid=380&hei=512&fmt=png-alpha&.v=M0dlUVBobHVpY1h1dmlaR3RZekpEMDMzS2xmcnFyN2JjeXRuNU5pL1ZKWDd4U2s1ZXUvWFMycmRmdnZ0Qnh2UFM0TjRWdzF2UjRGVEY0c3dBQVZ6VFlvQzhPSnlRVmhZb2dXWmJRTWFrTE0" },
  { name: "Polo", category: "Polo", image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-17e-202603?wid=380&hei=512&fmt=png-alpha&.v=M0dlUVBobHVpY1h1dmlaR3RZekpEMDMzS2xmcnFyN2JjeXRuNU5pL1ZKWDd4U2s1ZXUvWFMycmRmdnZ0Qnh2UFM0TjRWdzF2UjRGVEY0c3dBQVZ6VFlvQzhPSnlRVmhZb2dXWmJRTWFrTE0" },
  { name: "Jacket", category: "Jacket", image: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-17e-202603?wid=380&hei=512&fmt=png-alpha&.v=M0dlUVBobHVpY1h1dmlaR3RZekpEMDMzS2xmcnFyN２JjeXRuNU5pL１ZKWDd4U２s１ZXUvWFMycmRmdnZ０Qnh２UFM０TjRWdzF２UjRGVEY０c３dBQVＺ６VFlvQzhPSnlRVmhZb２dXWmJRTWFrTE０" },
  {name:"sweater", category:"sweater", image:"https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/iphone-compare-iphone-１7e-２０２６０３?wid=３８０&hei=５１２&fmt=png-alpha&.v=M０dlUVBobHVpY１h１dmlaR３RＺekpEMDMzS２xmcnFyN２JjeXRuNU５ｐL１ＺKWDd４U２s１ZXUvWFMycmRmdnＺ０Qnh２UFM０TjRWdzF２UjRGVEY０c３dBQVＺ６VFlvQzhPSnlRVmhZb２dXWmJRTWFrTE０"},
  { name: "Trouser", category: "Trouser", image: "https://plus.unsplash.com/premium_photo-1661255382106-f20f0f683c69?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8dHJvdXNlcnxlbnwwfHwwfHx8MA%3D%3D" },
  { name: "T-Shirt", category: "T-Shirt", image: "https://plus.unsplash.com/premium_photo-1673356302067-aac3b545a362?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dHNoaXJ0c3xlbnwwfHwwfHx8MA%3D%3D" },
  { name: "Sale", category: "All", image: "https://images.unsplash.com/photo-1577538928305-3807c3993047?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8c2FsZXxlbnwwfHwwfHx8MA%3D%3D" },
]

export default function CategoriesGrid() {
  return (
    <section className="px-6 md:px-12 lg:px-24 py-12">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">Browse by Category</h2>
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-6 lg:gap-8">
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
