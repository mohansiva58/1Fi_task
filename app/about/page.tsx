"use client"
import React from 'react';
import { motion } from 'framer-motion';

export default function BrandStory() {
  return (
    <section className="py-24 px-6 md:px-12 lg:px-24 bg-neutral-50 pb-24 md:pb-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative">
              <div className="aspect-[4/5] rounded-[60px] overflow-hidden">
                <img
                  src="https://www.apple.com/in/ipad-11/images/overview/hero/hero__ecv967jz1y82_large_2x.jpg"
                  alt="Our electronics collection"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Floating accent image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="absolute -bottom-8 -right-8 w-40 h-52 rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
              >
                <img
                  src="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MUW43?wid=1200&hei=1200&fmt=webp-alpha&qlt=90&.v=TXZ0bFZkK0lrcEF2K1dDRGFIWkd1ZnZFbFJOV2ljOVRXK1VQVTIrdktaOWRWMUlKdjFtNWdFY2k1ZzJ4Vk54VDdBaWIrVDFGL2tpb1YzK0N4YytLOXc&traceId=1"
                  alt="Electronics detail"
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:pl-12"
          >
            <span className="text-xs tracking-[0.3em] uppercase text-neutral-500 mb-6 block">
              Our Story
            </span>

            <h2 className="text-4xl md:text-5xl font-light text-black leading-tight mb-8">
              Technology made simple,{' '}
              <span className="italic">payments made easier</span>
            </h2>

            <p className="text-neutral-600 text-lg leading-relaxed mb-8">
              We believe great technology should be accessible without making
              the buying experience complicated. Our collection brings together
              carefully selected smartphones, laptops, tablets, audio devices,
              and smart accessories for modern everyday life.
            </p>

            <p className="text-neutral-500 leading-relaxed mb-10">
              With flexible EMI plans backed by mutual funds, we make it easier
              to choose the technology you need and spread the cost across a
              suitable tenure. From product selection to checkout, we focus on
              keeping the experience simple, transparent, and convenient.
            </p>

            <div className="flex flex-wrap gap-12">
              <div>
                <span className="text-4xl font-light text-black">7+</span>
                <p className="text-neutral-500 text-sm mt-1">Flexible EMI Plans</p>
              </div>

              <div>
                <span className="text-4xl font-light text-black">0%</span>
                <p className="text-neutral-500 text-sm mt-1">Interest Options</p>
              </div>

              <div>
                <span className="text-4xl font-light text-black">100%</span>
                <p className="text-neutral-500 text-sm mt-1">Transparent Pricing</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}