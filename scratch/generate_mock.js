const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'output');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// ── MOCK DATA CHO CONTENT-BASED BOTS ──
const cbBots = [
    {
        botId: 1,
        botName: 'Bot_Apple_Fan',
        inputData: { title: 'Apple iPhone 16 Pro Max, 512GB, Titanium', description: 'The latest iPhone with A18 Pro chip, titanium design, and advanced camera system.' },
        expectedOutput: [
            'iPhone 16 Pro Max Clear Case with MagSafe',
            'Apple 20W USB-C Power Adapter',
            'AirPods Pro (2nd Generation)',
            'Apple Watch Series 9',
            'Screen Protector for iPhone 16 Pro Max'
        ],
        myModelOutput: [
            'iPhone 16 Pro Max Clear Case with MagSafe', // Match
            'Samsung Galaxy S24 Ultra Silicone Case',    // No match
            'Apple 20W USB-C Power Adapter',             // Match
        ]
    },
    {
        botId: 2,
        botName: 'Bot_Samsung_Loyal',
        inputData: { title: 'Samsung Galaxy S25 Ultra 5G, 256GB, Phantom Black', description: 'Galaxy S25 Ultra featuring Galaxy AI, Snapdragon 8 Gen 4, S Pen included.' },
        expectedOutput: [
            'Samsung Galaxy Buds 3 Pro',
            'Samsung 45W Super Fast Charging Wall Charger',
            'Galaxy S25 Ultra Leather Case',
            'Galaxy Watch 7 Classic'
        ],
        myModelOutput: [
            'Samsung Galaxy Buds 3 Pro', // Match
            'Galaxy S25 Ultra Leather Case', // Match
            'Spigen Tough Armor Case for Galaxy S25 Ultra' // Partial/Match depending on Jaccard
        ]
    },
    {
        botId: 3,
        botName: 'Bot_Gamer',
        inputData: { title: 'ASUS ROG Phone 9 Pro, Gaming Smartphone, 16GB RAM', description: 'Ultimate gaming phone with 165Hz display and AeroActive Cooler.' },
        expectedOutput: [
            'AeroActive Cooler X for ROG Phone 9',
            'ASUS ROG Kunai 3 Gamepad',
            'ROG Cetra True Wireless Gaming Earbuds'
        ],
        myModelOutput: [
            'AeroActive Cooler X for ROG Phone 9', // Match
            'Razer Kishi V2 Mobile Gaming Controller', // No match
            'ASUS ROG Kunai 3 Gamepad' // Match
        ]
    }
];

cbBots.forEach(b => {
    fs.writeFileSync(path.join(outDir, `content-based-bot-${b.botId}.json`), JSON.stringify(b, null, 2));
});

// ── MOCK DATA CHO COLLAB FILTERING BOTS ──
const cfBots = [
    {
        botId: 1,
        botName: 'Bot_Gia_Dinh',
        scenario: 'Tìm đồ gia dụng thông minh',
        inputData: { originalKeywords: ['Robot Vacuum', 'Air Purifier', 'Smart Lock'] },
        amazonGroundTruth: [
            'Roborock S8 Pro Ultra Robot Vacuum and Mop',
            'Dyson Purifier Cool Gen1',
            'August Home Wi-Fi Smart Lock',
            'Ring Video Doorbell Plus'
        ],
        collabModelOutput: [
            'Roborock S8 Pro Ultra Robot Vacuum and Mop',
            'August Home Wi-Fi Smart Lock',
            'Philips Hue Smart Bulb Starter Kit'
        ]
    },
    {
        botId: 2,
        botName: 'Bot_Cong_Nghe',
        scenario: 'Xây dựng PC Gaming',
        inputData: { originalKeywords: ['RTX 4090', 'AMD Ryzen 9 7950X', 'Corsair 32GB DDR5'] },
        amazonGroundTruth: [
            'ASUS ROG Strix GeForce RTX 4090 OC Edition',
            'NZXT Kraken Elite 360 RGB AIO Cooler',
            'Corsair RM1000x 1000W Gold Power Supply',
            'Samsung 990 PRO 2TB NVMe SSD'
        ],
        collabModelOutput: [
            'Samsung 990 PRO 2TB NVMe SSD',
            'ASUS ROG Strix GeForce RTX 4090 OC Edition',
            'Logitech G502 LIGHTSPEED Wireless Mouse'
        ]
    }
];

cfBots.forEach(b => {
    fs.writeFileSync(path.join(outDir, `collab-bot-${b.botId}.json`), JSON.stringify(b, null, 2));
});

console.log('✅ Generated mock data for all bots successfully!');
