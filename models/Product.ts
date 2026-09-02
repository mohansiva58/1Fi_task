import mongoose, { Model, Schema } from "mongoose"

export interface IEmiPlan {
  monthlyAmount: number
  tenure: number
  interestRate: number
  totalAmount: number
  cashback?: number
  processingFee: number
  eligibilityText?: string
}

export interface IProductVariant {
  id: string
  name: string
  color: string
  storage?: string
  ram?: string
  sku: string
  mrp: number
  salePrice: number
  discount: number
  stock: number
  image?: string
}

export interface IProduct {
  slug: string
  brand: string
  model: string
  name: string
  description: string
  longDescription: string
  images: string[]
  highlights: string[]
  specifications: Record<string, string | string[]>
  variants: IProductVariant[]
  emiPlans: IEmiPlan[]
  rating: number
  reviews: number
  inStock: boolean
  stockQuantity: number
  category: string
  tags: string[]
  viewCount?: number
  soldCount?: number
  createdAt: Date
  updatedAt: Date
}

const EmiPlanSchema = new Schema<IEmiPlan>({
  monthlyAmount: { type: Number, required: true, min: 0 },
  tenure: { type: Number, required: true, min: 1, max: 84 },
  interestRate: { type: Number, required: true, min: 0, max: 100 },
  totalAmount: { type: Number, required: true, min: 0 },
  cashback: { type: Number, default: 0, min: 0 },
  processingFee: { type: Number, default: 0, min: 0, max: 100 },
  eligibilityText: { type: String, trim: true },
}, { _id: false })

const VariantSchema = new Schema<IProductVariant>({
  id: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  color: { type: String, required: true, trim: true },
  storage: { type: String, trim: true },
  ram: { type: String, trim: true },
  sku: { type: String, required: true, trim: true, uppercase: true },
  mrp: { type: Number, required: true, min: 0 },
  salePrice: { type: Number, required: true, min: 0 },
  discount: { type: Number, default: 0, min: 0, max: 100 },
  stock: { type: Number, default: 0, min: 0 },
  image: { type: String, trim: true },
}, { _id: false })

const ProductSchema = new Schema<IProduct>({
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  brand: { type: String, required: true, trim: true, index: true },
  model: { type: String, required: true, trim: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  longDescription: { type: String, required: true, trim: true },
  images: [{ type: String, trim: true }],
  highlights: [{ type: String, trim: true }],
  specifications: { type: Schema.Types.Mixed, default: {} },
  variants: { type: [VariantSchema], required: true, validate: [(v: IProductVariant[]) => v.length >= 2, "At least two variants are required"] },
  emiPlans: { type: [EmiPlanSchema], required: true, validate: [(v: IEmiPlan[]) => v.length >= 3, "At least three EMI plans are required"] },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0, min: 0 },
  inStock: { type: Boolean, default: true, index: true },
  stockQuantity: { type: Number, default: 0, min: 0 },
  category: { type: String, default: "Smartphones", trim: true, index: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  viewCount: { type: Number, default: 0, min: 0 },
  soldCount: { type: Number, default: 0, min: 0 },
}, { timestamps: true })

ProductSchema.index({ name: "text", brand: "text", description: "text", tags: "text" })
ProductSchema.index({ category: 1, inStock: 1, "variants.salePrice": 1 })

const Product: Model<IProduct> = mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema)
export default Product
export { ProductSchema }

export function productToJSON(product: IProduct & { toObject?: () => Record<string, unknown>; _id?: { toString(): string } }) {
  const value = product.toObject ? product.toObject() : product
  return { ...value, _id: value._id?.toString(), id: value._id?.toString() }
}
