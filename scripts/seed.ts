import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import config from '../src/config/env';
import { Branch, Table, Category, MenuItem, User } from '../src/models';
import generateQRCode from '../src/utils/generateQRCode';

const seedData = async (): Promise<void> => {
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

        // Create branches
        const branches = await Branch.create([
            {
                name: 'Chi nhánh Quận 1',
                address: '123 Nguyễn Huệ, Quận 1, TP.HCM',
                phone: '028-1234-5678',
                openTime: '08:00',
                closeTime: '22:00',
            },
            {
                name: 'Chi nhánh Quận 3',
                address: '456 Võ Văn Tần, Quận 3, TP.HCM',
                phone: '028-2345-6789',
                openTime: '09:00',
                closeTime: '23:00',
            },
        ]);
        console.log('🏢 Created branches');

        // Create tables for first branch
        const tables = [];
        for (let i = 1; i <= 10; i++) {
            tables.push({
                branchId: branches[0]._id,
                tableNumber: `A${String(i).padStart(2, '0')}`,
                qrCode: generateQRCode(),
                capacity: i <= 5 ? 4 : 6,
            });
        }
        await Table.create(tables);
        console.log('🪑 Created tables');

        // Create categories
        const categories = await Category.create([
            { name: 'Món khai vị', sortOrder: 1 },
            { name: 'Món chính', sortOrder: 2 },
            { name: 'Món phụ', sortOrder: 3 },
            { name: 'Đồ uống', sortOrder: 4 },
            { name: 'Tráng miệng', sortOrder: 5 },
        ]);
        console.log('📁 Created categories');

        // Create menu items
        const menuItems = [
            // Khai vị
            { categoryId: categories[0]._id, name: 'Gỏi cuốn tôm thịt', price: 45000, preparationTime: 10 },
            { categoryId: categories[0]._id, name: 'Chả giò', price: 50000, preparationTime: 15 },
            { categoryId: categories[0]._id, name: 'Súp măng cua', price: 55000, preparationTime: 12 },

            // Món chính
            { categoryId: categories[1]._id, name: 'Phở bò tái', price: 65000, preparationTime: 15 },
            { categoryId: categories[1]._id, name: 'Bún bò Huế', price: 70000, preparationTime: 15 },
            { categoryId: categories[1]._id, name: 'Cơm tấm sườn bì chả', price: 60000, preparationTime: 10 },
            { categoryId: categories[1]._id, name: 'Mì xào hải sản', price: 85000, preparationTime: 18 },
            { categoryId: categories[1]._id, name: 'Cá lóc kho tộ', price: 120000, preparationTime: 25 },
            { categoryId: categories[1]._id, name: 'Gà nướng mật ong', price: 180000, preparationTime: 30 },

            // Món phụ
            { categoryId: categories[2]._id, name: 'Rau muống xào tỏi', price: 40000, preparationTime: 8 },
            { categoryId: categories[2]._id, name: 'Đậu hũ chiên sả ớt', price: 45000, preparationTime: 10 },
            { categoryId: categories[2]._id, name: 'Canh chua cá', price: 55000, preparationTime: 15 },

            // Đồ uống
            { categoryId: categories[3]._id, name: 'Trà đá', price: 10000, preparationTime: 2 },
            { categoryId: categories[3]._id, name: 'Nước ngọt', price: 20000, preparationTime: 2 },
            { categoryId: categories[3]._id, name: 'Bia Saigon', price: 25000, preparationTime: 2 },
            { categoryId: categories[3]._id, name: 'Nước ép cam', price: 35000, preparationTime: 5 },
            { categoryId: categories[3]._id, name: 'Sinh tố bơ', price: 40000, preparationTime: 5 },

            // Tráng miệng
            { categoryId: categories[4]._id, name: 'Chè ba màu', price: 30000, preparationTime: 5 },
            { categoryId: categories[4]._id, name: 'Bánh flan', price: 25000, preparationTime: 3 },
            { categoryId: categories[4]._id, name: 'Kem dừa', price: 35000, preparationTime: 3 },
        ];
        await MenuItem.create(menuItems);
        console.log('🍜 Created menu items');

        // Create users
        await User.create([
            {
                email: 'superadmin@restaurant.com',
                password: 'Admin@123',
                name: 'Super Admin',
                role: 'superadmin',
                branchId: null,
            },
            {
                email: 'admin@restaurant.com',
                password: 'Admin@123',
                name: 'Admin Chi nhánh Q1',
                role: 'admin',
                branchId: branches[0]._id,
            },
            {
                email: 'cook@restaurant.com',
                password: 'Cook@123',
                name: 'Đầu bếp Minh',
                role: 'cook',
                branchId: branches[0]._id,
            },
            {
                email: 'waiter@restaurant.com',
                password: 'Waiter@123',
                name: 'Phục vụ Lan',
                role: 'waiter',
                branchId: branches[0]._id,
            },
            {
                email: 'cashier@restaurant.com',
                password: 'Cashier@123',
                name: 'Thu ngân Hoa',
                role: 'cashier',
                branchId: branches[0]._id,
            },
        ]);
        console.log('👥 Created users');

        console.log(`
✅ Seed completed successfully!

📋 Test accounts:
┌──────────────────────────────┬─────────────┬────────────┐
│ Email                        │ Password    │ Role       │
├──────────────────────────────┼─────────────┼────────────┤
│ superadmin@restaurant.com    │ Admin@123   │ superadmin │
│ admin@restaurant.com         │ Admin@123   │ admin      │
│ cook@restaurant.com          │ Cook@123    │ cook       │
│ waiter@restaurant.com        │ Waiter@123  │ waiter     │
│ cashier@restaurant.com       │ Cashier@123 │ cashier    │
└──────────────────────────────┴─────────────┴────────────┘

🪑 Tables created: 10 (A01-A10)
🍜 Menu items: ${menuItems.length}
    `);

        process.exit(0);
    } catch (error) {
        console.error('❌ Seed failed:', error);
        process.exit(1);
    }
};

seedData();
