/**
 * Migration: Convert categoryId to categoryIds
 * Run: npx ts-node src/scripts/migrateCategoryIds.ts
 */
import mongoose from 'mongoose';
import dotenv from 'dotenv';

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

        const menuItemsCollection = db.collection('menuitems');

        // Find all documents that have categoryId but not categoryIds
        const itemsToMigrate = await menuItemsCollection.find({
            categoryId: { $exists: true },
            categoryIds: { $exists: false }
        }).toArray();

        console.log(`📦 Found ${itemsToMigrate.length} items to migrate`);

        if (itemsToMigrate.length === 0) {
            console.log('✅ No items need migration');
            await mongoose.disconnect();
            return;
        }

        // Migrate each item
        for (const item of itemsToMigrate) {
            await menuItemsCollection.updateOne(
                { _id: item._id },
                {
                    $set: { categoryIds: [item.categoryId] },
                    $unset: { categoryId: '' }
                }
            );
            console.log(`  ✅ Migrated: ${item.name}`);
        }

        console.log(`\n🎉 Migration complete! ${itemsToMigrate.length} items updated.`);

        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    }
}

migrate();
