const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local', override: true });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI not found in environment variables');
}

async function checkSweatshirts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'emiplatform');
    
    console.log('🔍 SEARCHING FOR SWEATSHIRT PRODUCTS:\n');
    
    // Check all collections for sweatshirt
    const collections = await db.listCollections().toArray();
    const productCollections = collections
      .filter(c => c.name.startsWith('products'))
      .map(c => c.name);
    
    let totalFound = 0;
    
    for (const collName of productCollections) {
      const sweatshirts = await db.collection(collName)
        .find({ category: /sweatshirt/i })
        .toArray();
      
      if (sweatshirts.length > 0) {
        console.log(`\n📦 ${collName}: ${sweatshirts.length} sweatshirts`);
        sweatshirts.forEach(item => {
          console.log(`  - ${item.name} (category: "${item.category}")`);
          totalFound++;
        });
      }
    }
    
    console.log(`\n✅ Total Sweatshirts Found: ${totalFound}`);
    
    // Count total products across all collections
    console.log('\n📊 TOTAL PRODUCT COUNT PER COLLECTION:\n');
    let grandTotal = 0;
    
    for (const collName of productCollections) {
      const count = await db.collection(collName).countDocuments();
      console.log(`${collName}: ${count} products`);
      grandTotal += count;
    }
    
    console.log(`\n🎯 GRAND TOTAL: ${grandTotal} products across all collections`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.close();
  }
}

checkSweatshirts();
