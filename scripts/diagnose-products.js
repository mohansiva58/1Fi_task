const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found in environment variables');
}

async function diagnoseProducts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(process.env.MONGODB_DATABASE || 'emiplatform');
    
    // 1. Check all collections
    console.log('📚 COLLECTIONS IN DATABASE:');
    const collections = await db.listCollections().toArray();
    collections.forEach(c => console.log(`   - ${c.name}`));
    
    // 2. Check products in main collection
    console.log('\n📦 PRODUCTS COLLECTION ANALYSIS:');
    const totalProducts = await db.collection('products').countDocuments();
    console.log(`   Total products: ${totalProducts}`);
    
    // 3. Group by category
    console.log('\n📊 PRODUCTS BY CATEGORY:');
    const byCategory = await db.collection('products').aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    byCategory.forEach(cat => {
      console.log(`   ${cat._id}: ${cat.count} products`);
    });
    
    // 4. Check for duplicates (same name)
    console.log('\n🔍 CHECKING FOR DUPLICATES (by name):');
    const duplicates = await db.collection('products').aggregate([
      { $group: { _id: '$name', count: { $sum: 1 }, ids: { $push: '$_id' } } },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`   ⚠️  Found ${duplicates.length} duplicate product names:`);
      duplicates.slice(0, 5).forEach(dup => {
        console.log(`      - "${dup._id}" appears ${dup.count} times`);
      });
    } else {
      console.log('   ✅ No duplicate names found');
    }
    
    // 5. Sample products from Jackets category
    console.log('\n🧥 SAMPLE JACKETS:');
    const jackets = await db.collection('products')
      .find({ category: 'Jackets' })
      .limit(3)
      .toArray();
    
    jackets.forEach(j => {
      console.log(`   - ${j.name} (${j._id})`);
      console.log(`     Category: ${j.category}, Price: ${j.price}`);
    });
    
    // 6. Check category field variations
    console.log('\n🏷️  UNIQUE CATEGORY VALUES:');
    const categories = await db.collection('products').distinct('category');
    categories.forEach(cat => console.log(`   - "${cat}"`));
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

diagnoseProducts();
