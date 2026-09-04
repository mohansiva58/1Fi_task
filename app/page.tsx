"use client"

import { HeroSection } from "@/components/hero-section-clean" 
// import HeroSection from "@/components/hero-section-clean"// Main hero carousel
import Footer from "@/components/footer"
import { motion } from "framer-motion"
import CategoriesGrid from "@/components/categories-grid"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { SpinnerCenter } from "@/components/spinner"

const Newsletter = dynamic(() => import("@/components/newsletter"), {
  ssr: false,
  loading: () => <div className="py-12"></div>
})

const RecentProducts = dynamic(() => import("@/components/recent-products"), {
  ssr: false,
  loading: () => <SpinnerCenter />
})

export default function Home() {
  const router = useRouter()

  return (
    <>
      <main className="bg-white pb-20 md:pb-0">
        <HeroSection />
        <CategoriesGrid />
        <RecentProducts />
        {/* Trending Section */}
        <section className="py-24 px-6 md:px-12 lg:px-24 bg-white">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col lg:flex-row gap-12"
            >
              {/* Large featured image */}
              <div className="lg:w-1/2">
                <div 
                  className="relative rounded-[40px] overflow-hidden aspect-[4/5] group cursor-pointer"
                  onClick={() => router.push('/shop')}
                >
                  <img
                    src="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/mac-macbook-pro-size-unselect-202601-gallery-3?wid=5120&hei=3280&fmt=webp&qlt=90&.v=aXlkdGF0T0RUUVdDckNLaUc0OEE0d2huNHI2YVc1MjYxWkRLa3k4U1gzY1hKYXpvanE2MTFqNkhFOFRiTFg4Z3JUNGJWZ1llU1plZmhBekVhZm5NQnNqbWRhTGpRM2xxVWJRWUhSaDlCQ3B4THBaTFRLeTVoeUdtTWlCU2MzZjl1YmZQMXFXa2w0U3RUanhYSTV4Z29R&traceId=1"
                    alt="Trending look"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <span className="text-white/80 text-sm tracking-wide uppercase mb-2 block">Work Anywhere</span>
                    <h3 className="text-white text-3xl font-light">The Oversized Edit</h3>
                  </div>
                </div>
              </div>

              {/* Grid of smaller images */}
              <div className="lg:w-1/2 grid grid-cols-2 gap-6">
                {[
                  { img: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MYJ33ref_VW_34FR+watch-case-40-aluminum-starlight-nc-se3_VW_34FR+watch-face-40-aluminum-starlight-se3_VW_34FR?wid=5120&hei=3280&bgc=fafafa&trim=1&fmt=p-jpg&qlt=80&.v=L1VPMlk5ZkpkOVFZR3Fud25vckh4RStGZUJWLzNFUFVydllxZFp0d1M4NktoaXQwYi9wRGFOV2FsZVA1S1dYc01zdmlsQnpTM2JsTW1CL2FMcHR1ZUl3ZVlaMG9GekEwc3V1SXQ4RHBUY09LaGl0MGIvcERhTldhbGVQNUtXWHN3cVN2b2d1T00zNGpwWGphRE1oeEFaRnZGUUdUeGtYN2gySi9ZaWRpZitLckJnajVCaGRzU0pBREM1Q082Uk51NXVkZ2t0VWxQK2o2M01obVdMRmRjc0pSNGF0YXBqRjZkYVFiTFU1d3d0NERIZFBTOUw0Y2NhbzQxU3h0Y1V3YQ", title: "Smart Essentials", category: "smartphones" },
                  { img: "https://www.apple.com/in/ipad-11/images/overview/hero/hero__ecv967jz1y82_large_2x.jpg", title: "Power Your Creativity", category: "laptops" },
                  { img: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/airpods-pro-3-hero-select-202509?wid=1200&hei=1200&fmt=webp-alpha&qlt=90&.v=cmp4MmZ6OWxOeHNNTXh4SzlBNUpEb1RucE9zZTI5eEREaWZpY29lSld3eVVtLzE2Q0EySC9CZElXWmlJUStQNGJXc28vclFrMG5TV3RZd2tDdDg3MUF5bnN5eWFQbzJrN0JIMUN0QVFTbUNEdVcrbTJTWmVpYVlxZmpTeDVSRGw&traceId=1", title: "Everyday Audio", category: "laptops" },
                  { img: "https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MUW43?wid=1200&hei=1200&fmt=webp-alpha&qlt=90&.v=TXZ0bFZkK0lrcEF2K1dDRGFIWkd1ZnZFbFJOV2ljOVRXK1VQVTIrdktaOWRWMUlKdjFtNWdFY2k1ZzJ4Vk54VDdBaWIrVDFGL2tpb1YzK0N4YytLOXc&traceId=1", title: "Immersive Sound", category: "smartphones" },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => router.push(`/shop?category=${item.category}`)}
                  >
                    <div className="rounded-3xl overflow-hidden aspect-square mb-3">
                      <img
                        src={item.img}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
                    <h4 className="text-sm font-medium text-black group-hover:text-neutral-600 transition-colors">
                      {item.title}
                    </h4>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
        <Newsletter />
      </main>
      <Footer />
    </>
  )
}
