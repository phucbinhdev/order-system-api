/**
 * GrabFood Menu Crawler
 * Crawl menu data from GrabFood restaurant pages
 * 
 * Usage: npx ts-node scripts/crawl-grabfood.ts <restaurant_url>
 * Example: npx ts-node scripts/crawl-grabfood.ts "https://food.grab.com/vn/vi/restaurant/jollibee-..."
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

interface MenuItem {
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    category: string;
}

interface CrawlResult {
    restaurantName: string;
    categories: string[];
    items: MenuItem[];
    crawledAt: string;
}

async function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function crawlGrabFood(url: string): Promise<CrawlResult> {
    console.log('🚀 Starting GrabFood Crawler...');
    console.log(`📍 URL: ${url}\n`);

    const browser: Browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page: Page = await browser.newPage();

        // Set viewport and user agent
        await page.setViewport({ width: 1366, height: 768 });
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        console.log('📄 Loading page...');
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Wait for menu to load
        await delay(3000);

        // Get restaurant name
        const restaurantName = await page.evaluate(() => {
            const titleEl = document.querySelector('h1, [class*="name___"], [class*="restaurantName"]');
            return titleEl?.textContent?.trim() || 'Unknown Restaurant';
        });
        console.log(`🏪 Restaurant: ${restaurantName}`);

        // Get all categories
        const categories = await page.evaluate(() => {
            const tabs = document.querySelectorAll('.ant-tabs-tab');
            return Array.from(tabs).map(tab => tab.textContent?.trim() || '').filter(Boolean);
        });
        console.log(`📂 Categories: ${categories.join(', ')}`);

        const allItems: MenuItem[] = [];

        // Scroll to load all items
        console.log('\n📜 Scrolling to load all items...');
        let previousHeight = 0;
        let scrollAttempts = 0;
        const maxScrollAttempts = 10;

        while (scrollAttempts < maxScrollAttempts) {
            const currentHeight = await page.evaluate(() => document.body.scrollHeight);
            if (currentHeight === previousHeight) {
                scrollAttempts++;
            } else {
                scrollAttempts = 0;
            }
            previousHeight = currentHeight;

            await page.evaluate(() => window.scrollBy(0, 500));
            await delay(500);
        }

        // Scroll back to top
        await page.evaluate(() => window.scrollTo(0, 0));
        await delay(1000);

        // Click through each category and extract items
        for (let i = 0; i < categories.length; i++) {
            const category = categories[i];
            console.log(`\n📑 Processing category: ${category}`);

            // Click on category tab
            await page.evaluate((catName) => {
                const tabs = document.querySelectorAll('.ant-tabs-tab');
                for (const tab of tabs) {
                    if (tab.textContent?.trim() === catName) {
                        (tab as HTMLElement).click();
                        break;
                    }
                }
            }, category);

            await delay(1500);

            // Extract items from current category
            const categoryItems = await page.evaluate((catName) => {
                const items: MenuItem[] = [];

                // Find all menu item containers
                const itemContainers = document.querySelectorAll('[class*="menuItem"], [class*="item___"]');

                itemContainers.forEach(container => {
                    try {
                        // Get name
                        const nameEl = container.querySelector('p[class*="itemName"], h3, [class*="name___"]');
                        const name = nameEl?.textContent?.trim() || '';

                        // Get description
                        const descEl = container.querySelector('p[class*="itemDescription"], [class*="description___"]');
                        const description = descEl?.textContent?.trim() || '';

                        // Get price
                        const priceEl = container.querySelector('p[class*="discountPrice"], [class*="price___"]');
                        const priceText = priceEl?.textContent?.trim() || '0';
                        const price = parseInt(priceText.replace(/[^\d]/g, '')) || 0;

                        // Get original price if exists
                        const oldPriceEl = container.querySelector('p[class*="oldPrice"]');
                        const oldPriceText = oldPriceEl?.textContent?.trim() || '';
                        const originalPrice = oldPriceText ? parseInt(oldPriceText.replace(/[^\d]/g, '')) : undefined;

                        // Get image
                        const imgEl = container.querySelector('img');
                        const image = imgEl?.src || '';

                        if (name && price > 0) {
                            items.push({
                                name,
                                description,
                                price,
                                originalPrice,
                                image,
                                category: catName
                            });
                        }
                    } catch (e) {
                        // Skip invalid items
                    }
                });

                return items;
            }, category);

            console.log(`   Found ${categoryItems.length} items`);

            // Add unique items only
            for (const item of categoryItems) {
                const exists = allItems.some(existing =>
                    existing.name === item.name && existing.price === item.price
                );
                if (!exists) {
                    allItems.push(item);
                }
            }
        }

        console.log(`\n✅ Total unique items: ${allItems.length}`);

        return {
            restaurantName,
            categories,
            items: allItems,
            crawledAt: new Date().toISOString()
        };

    } finally {
        await browser.close();
    }
}

function transformToSeedData(result: CrawlResult): object {
    // Create categories
    const categoryMap = new Map<string, string>();
    const categories = result.categories.map((name, index) => {
        const id = `cat_${index + 1}`;
        categoryMap.set(name, id);
        return {
            _id: id,
            name,
            sortOrder: index + 1,
            isActive: true
        };
    });

    // Create menu items
    const menuItems = result.items.map((item, index) => ({
        name: item.name,
        description: item.description || `Món ăn ngon từ ${result.restaurantName}`,
        price: item.price,
        category: item.category,
        image: item.image,
        preparationTime: 15, // Default 15 minutes
        isAvailable: true
    }));

    return {
        restaurantName: result.restaurantName,
        crawledAt: result.crawledAt,
        categories,
        menuItems
    };
}

async function main() {
    const url = process.argv[2] || 'https://food.grab.com/vn/vi/restaurant/jollibee-ti%E1%BA%BFn-b%E1%BB%99-plaza-h%C3%A0-n%E1%BB%99i-delivery/5-C7NFCUBXT722JT';

    try {
        const result = await crawlGrabFood(url);
        const seedData = transformToSeedData(result);

        // Save raw data
        const rawPath = path.join(__dirname, '../data/grabfood-raw.json');
        fs.mkdirSync(path.dirname(rawPath), { recursive: true });
        fs.writeFileSync(rawPath, JSON.stringify(result, null, 2), 'utf-8');
        console.log(`\n💾 Raw data saved to: ${rawPath}`);

        // Save seed data
        const seedPath = path.join(__dirname, '../data/grabfood-seed.json');
        fs.writeFileSync(seedPath, JSON.stringify(seedData, null, 2), 'utf-8');
        console.log(`💾 Seed data saved to: ${seedPath}`);

        console.log('\n🎉 Crawling completed successfully!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Restaurant: ${result.restaurantName}`);
        console.log(`   - Categories: ${result.categories.length}`);
        console.log(`   - Menu Items: ${result.items.length}`);

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

main();
