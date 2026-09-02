"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, BadgeCheck, Calculator, ShieldCheck, Smartphone } from "lucide-react"

const benefits = [
  { icon: Calculator, title: "Plans that fit", copy: "Choose a tenure that works with your monthly budget." },
  { icon: ShieldCheck, title: "Backed by your investments", copy: "Unlock better access using eligible mutual fund holdings." },
  { icon: BadgeCheck, title: "Clear from day one", copy: "See the total payable, fees and cashback before you apply." },
]

const featured = [
  { name: "iPhone 15", label: "Flagship performance", price: "₹2,499/mo", tone: "bg-[#e9eef8]" },
  { name: "Galaxy S24", label: "AI-powered everyday", price: "₹2,099/mo", tone: "bg-[#e9f1ed]" },
  { name: "Pixel 8a", label: "The smart choice", price: "₹1,599/mo", tone: "bg-[#f3eee6]" },
]

export default function Home() {
  return <main className="min-h-screen bg-[#fafaf8] text-[#111827]">
    <section className="relative overflow-hidden bg-[#12233f] text-white">
      <div className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-[1.05fr_.95fr] md:px-10 md:py-28">
        <div className="relative z-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-blue-100"><Smartphone size={16} /> Device financing, made simple</div>
          <h1 className="max-w-2xl text-5xl font-semibold tracking-[-.05em] md:text-7xl">Your next phone, <span className="text-[#8dd3b7]">on your terms.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100">Shop the latest smartphones and pick an EMI plan backed by your mutual fund investments. Transparent, flexible and built around you.</p>
          <div className="mt-9 flex flex-wrap gap-4"><Link href="/shop" className="inline-flex items-center gap-2 rounded-full bg-[#8dd3b7] px-6 py-3 font-semibold text-[#10213b] transition hover:bg-white">Explore phones <ArrowRight size={18} /></Link><Link href="/about" className="rounded-full border border-white/30 px-6 py-3 font-medium transition hover:bg-white/10">How it works</Link></div>
          <p className="mt-8 text-sm text-blue-200">No hidden charges · 3,000+ happy customers · Secure checkout</p>
        </div>
        <div className="relative mx-auto w-full max-w-xl"><div className="absolute -inset-8 rounded-full bg-[#8dd3b7]/20 blur-3xl" /><Image src="/images/emi-phones.png" alt="Three smartphones available with EMI plans" width={900} height={600} className="relative w-full rounded-[2rem] object-cover shadow-2xl" priority /></div>
      </div>
    </section>
    <section className="mx-auto max-w-7xl px-6 py-16 md:px-10"><div className="grid gap-5 md:grid-cols-3">{benefits.map(({ icon: Icon, title, copy }) => <div key={title} className="rounded-2xl border border-[#e8e7e2] bg-white p-6"><Icon className="mb-7 text-[#237b6a]" size={24} /><h2 className="text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-500">{copy}</p></div>)}</div></section>
    <section className="mx-auto max-w-7xl px-6 pb-20 md:px-10"><div className="mb-8 flex items-end justify-between"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-[#237b6a]">The phone edit</p><h2 className="mt-2 text-3xl font-semibold tracking-tight">Find your perfect fit</h2></div><Link href="/shop" className="hidden items-center gap-2 text-sm font-semibold md:flex">View all phones <ArrowRight size={16} /></Link></div><div className="grid gap-5 md:grid-cols-3">{featured.map((phone, index) => <Link href="/shop" key={phone.name} className={`group overflow-hidden rounded-3xl ${phone.tone}`}><div className="flex min-h-[270px] items-center justify-center p-8"><Image src="/images/emi-phones.png" alt={phone.name} width={600} height={400} className={`w-full object-cover mix-blend-multiply transition duration-500 group-hover:scale-105 ${index === 0 ? "object-left" : index === 1 ? "object-center" : "object-right"}`} /></div><div className="bg-white p-5"><p className="text-sm text-slate-500">{phone.label}</p><div className="mt-2 flex items-center justify-between"><h3 className="font-semibold">{phone.name}</h3><span className="font-semibold text-[#237b6a]">{phone.price}</span></div></div></Link>)}</div></section>
  </main>
}
