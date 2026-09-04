"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2, ShieldCheck, WalletCards } from "lucide-react"

export default function AboutPage() {
  return (
    <main className="flex min-h-[calc(100vh-72px)] items-center bg-[#102a2f] px-6 py-12 text-white md:px-12">
      <section className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="mb-5 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-300">EMI Platform</p>
          <h1 className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">Premium electronics, made easier to own.</h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">Browse iPhones, MacBooks, and other devices with transparent pricing, variant-level stock, and flexible EMI plans backed by mutual-fund partners.</p>
          <Link href="/shop" className="mt-8 inline-flex items-center gap-2 bg-cyan-300 px-5 py-3 font-semibold text-[#102a2f] hover:bg-cyan-200">Browse electronics <ArrowRight size={17} /></Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
          <div className="border border-white/15 bg-white/10 p-5"><WalletCards className="mb-5 text-cyan-300" /><h2 className="font-semibold">0% EMI options</h2><p className="mt-2 text-sm leading-6 text-slate-300">Choose a tenure that fits your monthly budget.</p></div>
          <div className="border border-white/15 bg-white/10 p-5"><ShieldCheck className="mb-5 text-cyan-300" /><h2 className="font-semibold">Clear pricing</h2><p className="mt-2 text-sm leading-6 text-slate-300">See MRP, selling price, interest, cashback, and total payable before proceeding.</p></div>
          <div className="border border-white/15 bg-white/10 p-5"><CheckCircle2 className="mb-5 text-cyan-300" /><h2 className="font-semibold">Verified availability</h2><p className="mt-2 text-sm leading-6 text-slate-300">Every storage and color variant has its own inventory status.</p></div>
        </div>
      </section>
    </main>
  )
}
