import mongoose, { Document, Model, Schema } from "mongoose"

export interface IEmiPlan {
  tenureMonths: number
  monthlyAmount: number
  interestRate: number
  cashbackAmount: number
  provider: string
}

export interface IElectronicsVariant {
  sku: string
  label: string
  storage?: string
  color: string
  finish?: string
  mrp: number
  price: number
  images: string[]
  stockQuantity: number
  inStock: boolean
  emiPlans: IEmiPlan[]
}

export interface IElectronicsProduct extends Document {
  name: string
  slug: string
  brand: string
  category: "smartphones" | "laptops" | "earpods" | "watches" | "tablets" | "accessories"
  description: string
  features: string[]
  images: string[]
  variants: IElectronicsVariant[]
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

const EmiPlanSchema = new Schema<IEmiPlan>(
  {
    tenureMonths: { type: Number, required: true, min: 1 },
    monthlyAmount: { type: Number, required: true, min: 0 },
    interestRate: { type: Number, required: true, min: 0 },
    cashbackAmount: { type: Number, default: 0, min: 0 },
    provider: { type: String, required: true, trim: true },
  },
  { _id: false },
)

const VariantSchema = new Schema<IElectronicsVariant>(
  {
    sku: { type: String, required: true, trim: true, uppercase: true },
    label: { type: String, required: true, trim: true },
    storage: { type: String, trim: true },
    color: { type: String, required: true, trim: true },
    finish: { type: String, trim: true },
    mrp: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], required: true },
    stockQuantity: { type: Number, required: true, min: 0, default: 0 },
    inStock: { type: Boolean, default: true },
    emiPlans: { type: [EmiPlanSchema], required: true },
  },
  { _id: false },
)

const ElectronicsProductSchema = new Schema<IElectronicsProduct>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    brand: { type: String, required: true, trim: true, index: true },
    category: {
      type: String,
      required: true,
      enum: ["smartphones", "laptops", "earpods", "watches", "tablets", "accessories"],
      index: true,
    },
    description: { type: String, required: true, trim: true },
    features: { type: [String], default: [] },
    images: { type: [String], default: [] },
    variants: {
      type: [VariantSchema],
      required: true,
      validate: [(variants: IElectronicsVariant[]) => variants.length >= 1, "At least one variant is required"],
    },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true, collection: "electronics_products" },
)

ElectronicsProductSchema.index({ createdAt: -1 })
ElectronicsProductSchema.index({ category: 1, createdAt: -1 })

const ElectronicsProduct: Model<IElectronicsProduct> =
  mongoose.models.ElectronicsProduct || mongoose.model<IElectronicsProduct>("ElectronicsProduct", ElectronicsProductSchema)

export default ElectronicsProduct
