import mongoose from 'mongoose';
import config from '../src/config/env';
import { Branch, Table, Category, MenuItem, User } from '../src/models';
import generateQRCode from '../src/utils/generateQRCode';
import menuData from '../src/data/grabfood-menu.json';

const seedGrabFood = async (): Promise<void> => {
    try {
        // Connect to MongoDB
        await mongoose.connect(config.mongoUri);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            Branch.deleteMany({}),
            Table.deleteMany({}),
            Category.deleteMany({}),
            MenuItem.deleteMany({}),
            User.deleteMany({}),
        ]);
        console.log('🗑️ Cleared existing data');

        // 1. Create Branches & Users (Standard Setup)
        const branches = await Branch.create([
            {
                name: 'Chi nhánh Quận 1 (GrabFood)',
                address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                phone: '028-1234-5678',
                openTime: '08:00',
                closeTime: '22:00',
            }
        ]);

        // Users
        await User.create([
            {
                email: 'admin@restaurant.com',
                password: 'Admin@123',
                name: 'Admin',
                role: 'admin',
                branchId: branches[0]._id,
            },
            {
                email: 'cook@restaurant.com',
                password: 'Cook@123',
                name: 'Đầu bếp',
                role: 'cook',
                branchId: branches[0]._id,
            },
            {
                email: 'cashier@restaurant.com',
                password: 'Cashier@123',
                name: 'Thu ngân',
                role: 'cashier',
                branchId: branches[0]._id,
            }
        ]);

        // Tables
        const tables = Array.from({ length: 10 }, (_, i) => ({
            branchId: branches[0]._id,
            tableNumber: `B${String(i + 1).padStart(2, '0')}`,
            qrCode: generateQRCode(),
            capacity: 4,
        }));
        await Table.create(tables);
        console.log('🏢 Created basic infrastructure (Branch, Users, Tables)');

        // 2. Import Menu Data from GrabFood
        console.log('📥 Importing GrabFood menu data...');

        let sortOrder = 1;
        let totalItems = 0;

        for (const catData of menuData) {
            // Create Category
            const category = await Category.create({
                name: catData.category,
                sortOrder: sortOrder++,
                isActive: true
            });

            // Create Items
            const items = catData.items.map(item => {
                // Parse price: "178.000" -> 178000
                const price = typeof item.price === 'string'
                    ? parseInt(item.price.replace(/[^\d]/g, ''))
                    : item.price;

                return {
                    categoryId: category._id,
                    name: item.name,
                    description: item.description,
                    price: price || 0,
                    image: item.image,
                    isAvailable: true,
                    preparationTime: 15
                };
            });

            if (items.length > 0) {
                await MenuItem.create(items);
                totalItems += items.length;
            }
            console.log(`   - Added category "${catData.category}" with ${items.length} items`);
        }

        console.log(`\n✅ Import completed!`);
        console.log(`📊 Total Categories: ${menuData.length}`);
        console.log(`Ram Total Menu Items: ${totalItems}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedGrabFood();
