const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found in environment variables');
}

async function checkCategories() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB\n');
    
    const db = client.db(process.env.MONGODB_DATABASE || 'emiplatform');
    
    // Check all collections
    console.log('📦 COLLECTIONS IN DATABASE:');
    const collections = await db.listCollections().toArray();
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    console.log('\n📊 PRODUCTS ANALYSIS:\n');
    
    // Get all unique categories
    const categories = await db.collection('products').distinct('category');
    console.log('Unique Categories:', categories);
    console.log(`Total Categories: ${categories.length}\n`);
    
    // Count products per category
    for (const category of categories) {
      const count = await db.collection('products').countDocuments({ category });
      const sample = await db.collection('products').findOne({ category }, { projection: { name: 1, _id: 1 } });
      console.log(`${category}: ${count} products`);
      if (sample) {
        console.log(`  Sample: ${sample.name} (ID: ${sample._id})`);
      }
    }
    
    // Check for duplicates
    console.log('\n🔍 CHECKING FOR DUPLICATES:\n');
    const duplicates = await db.collection('products').aggregate([
      {
        $group: {
          _id: "$name",
          count: { $sum: 1 },
          ids: { $push: "$_id" }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      },
      { $limit: 10 }
    ]).toArray();
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate product names:`);
      duplicates.forEach(dup => {
        console.log(`  "${dup._id}" appears ${dup.count} times with IDs: ${dup.ids.join(', ')}`);
      });
    } else {
      console.log('✅ No duplicate product names found');
    }
    
    // Check Jackets specifically
    console.log('\n🧥 JACKETS CATEGORY DETAILS:\n');
    const jackets = await db.collection('products').find({ category: 'Jackets' }).limit(5).toArray();
    jackets.forEach(jacket => {
      console.log(`  - ${jacket.name} (${jacket._id})`);
      console.log(`    Category: "${jacket.category}" | Price: ₹${jacket.price}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkCategories();
