const mongoose = require('mongoose')
const { v2: cloudinary } = require('cloudinary')
require('dotenv').config({ path: '.env' })
require('dotenv').config({ path: '.env.local', override: true })

const mongoUri = process.env.MONGODB_URI
const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME

if (!mongoUri) throw new Error('MONGODB_URI is required')
if (!cloudName || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  throw new Error('Cloudinary credentials are required to seed electronics images')
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const productSchema = new mongoose.Schema({}, { strict: false, timestamps: true })
const ElectronicsProduct = mongoose.models.ElectronicsProduct || mongoose.model('ElectronicsProduct', productSchema, 'electronics_products')

const sourceImages = [
  'https://images.unsplash.com/photo-1592899677977-9c10ca588bbd?w=1200&q=85',
  'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=1200&q=85',
  'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=1200&q=85',
  'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=1200&q=85',
]

async function uploadImages(slug) {
  const uploaded = []
  for (let index = 0; index < sourceImages.length; index += 1) {
    const result = await cloudinary.uploader.upload(sourceImages[index], {
      folder: `emi-platform/electronics/${slug}`,
      public_id: `image-${index + 1}`,
      overwrite: true,
      resource_type: 'image',
    })
    uploaded.push(result.secure_url)
  }
  return uploaded
}

function emiPlans(price) {
  return [
    { tenureMonths: 3, monthlyAmount: Math.ceil(price / 3), interestRate: 0, cashbackAmount: 7500, provider: 'Mutual Funds Partner' },
    { tenureMonths: 6, monthlyAmount: Math.ceil(price / 6), interestRate: 0, cashbackAmount: 7500, provider: 'Mutual Funds Partner' },
    { tenureMonths: 12, monthlyAmount: Math.ceil(price / 12), interestRate: 0, cashbackAmount: 7500, provider: 'Mutual Funds Partner' },
    { tenureMonths: 24, monthlyAmount: Math.ceil(price / 24), interestRate: 0, cashbackAmount: 7500, provider: 'Mutual Funds Partner' },
    { tenureMonths: 36, monthlyAmount: Math.ceil((price * 1.105) / 36), interestRate: 10.5, cashbackAmount: 5000, provider: 'Mutual Funds Partner' },
    { tenureMonths: 48, monthlyAmount: Math.ceil((price * 1.105) / 48), interestRate: 10.5, cashbackAmount: 5000, provider: 'Mutual Funds Partner' },
    { tenureMonths: 60, monthlyAmount: Math.ceil((price * 1.105) / 60), interestRate: 10.5, cashbackAmount: 5000, provider: 'Mutual Funds Partner' },
  ]
}

function variants(prefix, basePrice, images) {
  const options = [
    ['128GB', 'Silver', 'Natural Titanium'],
    ['256GB', 'Desert Titanium', 'Natural Titanium'],
    ['512GB', 'Black Titanium', 'Matte Titanium'],
    ['1TB', 'White Titanium', 'Matte Titanium'],
  ]
  return options.map(([storage, color, finish], index) => {
    const price = basePrice + index * 10000
    return {
      sku: `${prefix}-${storage.replace(/[^A-Z0-9]/gi, '')}`,
      label: `${storage} ${color}`,
      storage,
      color,
      finish,
      mrp: price + 7500,
      price,
      images: [images[index % images.length], images[(index + 1) % images.length]],
      stockQuantity: 20 - index * 2,
      inStock: true,
      emiPlans: emiPlans(price),
    }
  })
}

async function seed() {
  await mongoose.connect(mongoUri, { dbName: process.env.MONGODB_DATABASE || 'emiplatform' })
  const products = [
    {
      name: 'iPhone 17 Pro', slug: 'iphone-17-pro', brand: 'Apple', category: 'smartphones',
      description: 'A pro-grade iPhone with a titanium finish, advanced camera system, and flexible EMI plans backed by mutual-fund partners.',
      features: ['Pro camera system', 'Titanium design', 'Fast 5G connectivity', 'Mutual-fund backed EMI options'],
      images: await uploadImages('iphone-17-pro'),
      isActive: true,
    },
    {
      name: 'iPhone 17', slug: 'iphone-17', brand: 'Apple', category: 'smartphones',
      description: 'The latest iPhone experience with all-day battery life, bright display, and zero-interest plans on select tenures.',
      features: ['All-day battery', 'Advanced dual camera', 'Super Retina display', '0% EMI on 3, 6, 12 and 24 months'],
      images: await uploadImages('iphone-17'),
      isActive: true,
    },
    {
      name: 'MacBook Air M4', slug: 'macbook-air-m4', brand: 'Apple', category: 'laptops',
      description: 'A lightweight M4 laptop for work and study with transparent monthly pricing and cashback on eligible plans.',
      features: ['Apple M4 chip', 'All-day battery', 'Lightweight aluminum body', 'Cashback on eligible EMI plans'],
      images: await uploadImages('macbook-air-m4'),
      isActive: true,
    },
  ]

  products[0].variants = variants('IPH17PRO', 127400, products[0].images)
  products[1].variants = variants('IPH17', 79900, products[1].images)
  products[2].variants = variants('MBAIRM4', 99900, products[2].images)

  await ElectronicsProduct.deleteMany({ slug: { $in: products.map((product) => product.slug) } })
  await ElectronicsProduct.insertMany(products)
  console.log(`Seeded ${products.length} electronics products with ${products.reduce((count, product) => count + product.variants.length, 0)} variants`)
  await mongoose.disconnect()
}

seed().catch(async (error) => {
  console.error('Electronics seed failed:', error)
  await mongoose.disconnect()
  process.exit(1)
})
