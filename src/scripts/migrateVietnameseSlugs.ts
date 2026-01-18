/**
 * Migration: Update all slugs with Vietnamese support
 * Run: npx ts-node src/scripts/migrateVietnameseSlugs.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { slugify } from '../utils/slugify';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/order-system';

async function migrate() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        // Update Categories
        console.log('\n📂 Updating Categories...');
        const categoriesCollection = db.collection('categories');
        const categories = await categoriesCollection.find({}).toArray();

        for (const cat of categories) {
            const newSlug = slugify(cat.name);
            if (newSlug !== cat.slug) {
                await categoriesCollection.updateOne(
                    { _id: cat._id },
                    { $set: { slug: newSlug } }
                );
                console.log(`  ✅ ${cat.name}: "${cat.slug}" → "${newSlug}"`);
            }
        }
        console.log(`📂 Categories updated: ${categories.length}`);

        // Update MenuItems
        console.log('\n🍽️  Updating MenuItems...');
        const menuItemsCollection = db.collection('menuitems');
        const menuItems = await menuItemsCollection.find({}).toArray();

        for (const item of menuItems) {
            const newSlug = slugify(item.name);
            if (newSlug !== item.slug) {
                await menuItemsCollection.updateOne(
                    { _id: item._id },
                    { $set: { slug: newSlug } }
                );
                console.log(`  ✅ ${item.name}: "${item.slug}" → "${newSlug}"`);
            }
        }
        console.log(`🍽️  MenuItems updated: ${menuItems.length}`);

        console.log('\n🎉 Migration complete!');

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
