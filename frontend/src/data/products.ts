import { Product, Review, RecUser } from '../types';

export const USERS: RecUser[] = [
  {
    id: "USR_01",
    name: "Alex Johnson",
    avatarColor: "bg-blue-500",
    persona: "Tech Enthusiast",
    history: ["B00E_HEADPHONES", "B00E_KEYBOARD", "B00E_SSD"],
    preferredCategories: ["Electronics", "Office Products"]
  },
  {
    id: "USR_02",
    name: "Emily Smith",
    avatarColor: "bg-emerald-500",
    persona: "Home Chef & Baker",
    history: ["B00H_COFFEE", "B00H_AIRFRYER", "B00H_KNIVES"],
    preferredCategories: ["Home & Kitchen"]
  },
  {
    id: "USR_03",
    name: "Michael Chang",
    avatarColor: "bg-amber-500",
    persona: "Fitness & Outdoor Fanatic",
    history: ["B00S_YOGA", "B00S_BOTTLE", "B00S_SHOES"],
    preferredCategories: ["Sports & Outdoors"]
  },
  {
    id: "USR_04",
    name: "Sarah Parker",
    avatarColor: "bg-purple-500",
    persona: "Professional Writer / Avid Reader",
    history: ["B00B_PYTHON", "B00O_NOTEBOOK", "B00B_FINANCE"],
    preferredCategories: ["Books", "Office Products"]
  },
  {
    id: "USR_05",
    name: "David Miller",
    avatarColor: "bg-rose-500",
    persona: "General Shopper / Minimalist",
    history: ["B00O_DESK", "B00E_SPEAKER"],
    preferredCategories: ["Electronics", "Office Products", "Home & Kitchen"]
  }
];

export const PRODUCTS: Product[] = [
  // --- ELECTRONICS (6 items) ---
  {
    parent_asin: "B00E_HEADPHONES",
    title: "Sony WH-1000XM4 Wireless Noise Canceling Over-Ear Headphones",
    main_category: "Electronics",
    average_rating: 4.7,
    rating_number: 12450,
    price: 348.00,
    store: "Sony Electronics Store",
    categories: ["Electronics", "Audio & Headphones", "Over-Ear Headphones"],
    features: [
      "Industry-leading noise canceling with Dual Noise Sensor technology",
      "Next-level music with Edge-AI, co-developed with Sony Music Studios Tokyo",
      "Up to 30-hour battery life with quick charging (10 min charge for 5 hours of playback)",
      "Touch sensor controls to pause play skip tracks, control volume, activate voice assistant"
    ],
    description: [
      "Sony's intelligent industry-leading noise canceling headphones with premium sound elevate your listening experience with the ability to personalize and control everything you hear.",
      "With speak-to-chat, music is automatically paused when you initiate a conversation, and smart listening technologies adapt the sound output depending on your environment."
    ],
    details: {
      "Brand": "Sony",
      "Model Name": "WH1000XM4/B",
      "Color": "Black",
      "Form Factor": "Over Ear",
      "Connectivity": "Wireless, Bluetooth 5.0"
    },
    bought_together: ["B00E_CHARGER", "B00E_SSD", "B00O_LAMP"]
  },
  {
    parent_asin: "B00E_SMARTWATCH",
    title: "Apple Watch Series 9 GPS 45mm Smartwatch",
    main_category: "Electronics",
    average_rating: 4.8,
    rating_number: 8900,
    price: 429.00,
    store: "Apple Store",
    categories: ["Electronics", "Wearable Technology", "Smartwatches"],
    features: [
      "S9 chip enables a superb-bright display and a magical new way to quickly interact with your watch without touching the screen",
      "Advanced health sensors track blood oxygen, ECG, sleep phases, and temperature sensing",
      "Innovative safety features including Crash Detection and Fall Detection",
      "Fully customizable with dozens of bands and watch faces"
    ],
    description: [
      "Your essential companion for a healthy life is now even more powerful. The S9 chip enables a super-bright display and a magical new way to quickly and easily use your Apple Watch without touching the screen."
    ],
    details: {
      "Brand": "Apple",
      "Size": "45mm",
      "Style": "GPS",
      "Color": "Midnight Aluminum",
      "Battery Life": "Up to 18 hours"
    },
    bought_together: ["B00E_CHARGER", "B00S_BOTTLE"]
  },
  {
    parent_asin: "B00E_CHARGER",
    title: "Anker 3-in-1 Wireless Charging Station with Power Adapter",
    main_category: "Electronics",
    average_rating: 4.5,
    rating_number: 5620,
    price: 39.99,
    store: "Anker Official Store",
    categories: ["Electronics", "Accessories & Supplies", "Chargers & Power Adapters"],
    features: [
      "Simultaneously charge your smartphone, smartwatch, and wireless earbuds",
      "Designed for MagSafe compatibility with strong magnetic connection",
      "Sleek, foldable design perfect for bedside nightstands or travel",
      "Advanced safety control, temperature management, and surge protection"
    ],
    description: [
      "Power up your daily tech setup in one single place. This elegant wireless charging stand eliminates cable clutter and delivers fast, secure charging to your phone, watch, and wireless earbud cases."
    ],
    details: {
      "Brand": "Anker",
      "Connector Type": "USB Type C, Wireless",
      "Compatible Devices": "Smartphones, Smartwatches, Earbuds",
      "Wattage": "15 Watts"
    },
    bought_together: ["B00E_HEADPHONES", "B00E_SMARTWATCH"]
  },
  {
    parent_asin: "B00E_KEYBOARD",
    title: "Logitech MX Keys S Wireless Illuminated Keyboard",
    main_category: "Electronics",
    average_rating: 4.6,
    rating_number: 3410,
    price: 109.99,
    store: "Logitech",
    categories: ["Electronics", "Computers & Accessories", "Keyboards"],
    features: [
      "Fluid, ultra-precise typing with keys shaped for your fingertips",
      "Smart illumination keys light up the moment your hands approach",
      "Multi-device, multi-OS pairing via Bluetooth Low Energy or Logi Bolt",
      "USB-C rechargeable - stays powered for up to 10 days or 5 months with backlight off"
    ],
    description: [
      "Meet MX Keys S - the ultimate wireless illuminated keyboard designed for high-performance typing, speed, and precision. Comfort, stability, and tactical responsiveness combined in a low-profile premium frame."
    ],
    details: {
      "Brand": "Logitech",
      "Connectivity": "Bluetooth, Logi Bolt USB",
      "Keyboard Description": "Ergonomic, Low Profile, Backlit",
      "Material": "Aluminum, Plastic"
    },
    bought_together: ["B00O_CHAIR", "B00E_SSD"]
  },
  {
    parent_asin: "B00E_SSD",
    title: "Samsung T7 Shield 2TB Portable Solid State Drive",
    main_category: "Electronics",
    average_rating: 4.8,
    rating_number: 9540,
    price: 159.99,
    store: "Samsung Electronics",
    categories: ["Electronics", "Computers & Accessories", "Data Storage", "External SSDs"],
    features: [
      "Rugged durability with IP65 rating for water and dust resistance",
      "Super-fast read speeds up to 1,050 MB/s and write up to 1,000 MB/s",
      "Compatible with PC, Mac, Android, and gaming consoles",
      "Drop resistant up to 9.8 feet with rubberized exterior armor"
    ],
    description: [
      "Superfast external storage designed to withstand extreme environments. The Samsung T7 Shield offers high performance on the go, with drop-resistance, waterproofing, and high-speed data transfers for heavy creators."
    ],
    details: {
      "Brand": "Samsung",
      "Capacity": "2 TB",
      "Interface": "USB 3.2 Gen 2",
      "Color": "Shield Blue"
    },
    bought_together: ["B00E_HEADPHONES", "B00E_KEYBOARD"]
  },
  {
    parent_asin: "B00E_SPEAKER",
    title: "JBL Flip 6 Waterproof Portable Bluetooth Speaker",
    main_category: "Electronics",
    average_rating: 4.7,
    rating_number: 18230,
    price: 129.95,
    store: "JBL Store",
    categories: ["Electronics", "Portable Audio & Video", "Bluetooth Speakers"],
    features: [
      "Loud, crystal-clear, powerful 2-way speaker system",
      "IP67 waterproof and dustproof - bring it to the pool, beach, or park",
      "12 hours of playtime on a single charge of battery",
      "Bold, portable design fits easily into any backpack or cup holder"
    ],
    description: [
      "The beat goes on with the JBL Flip 6 2-way speaker system, engineered to deliver loud, crystal clear, powerful sound. This waterproof speaker is dustproof and supports PartyBoost linking."
    ],
    details: {
      "Brand": "JBL",
      "Speaker Type": "Outdoor, Portable",
      "Battery Life": "12 Hours",
      "Water Resistance": "IP67"
    },
    bought_together: ["B00S_BOTTLE", "B00S_SHOES"]
  },

  // --- HOME & KITCHEN (6 items) ---
  {
    parent_asin: "B00H_COFFEE",
    title: "Keurig K-Elite Single Serve Coffee Maker",
    main_category: "Home & Kitchen",
    average_rating: 4.6,
    rating_number: 14200,
    price: 189.99,
    store: "Keurig",
    categories: ["Home & Kitchen", "Kitchen & Dining", "Coffee Makers", "Single-Serve"],
    features: [
      "Brew multiple cup sizes: 4, 6, 8, 10, and 12oz of your favorite beverage",
      "Strong Brew button increases the strength and bold taste of your coffee",
      "Iced setting brews hot over ice for premium refreshing iced coffee",
      "Large 75oz removable water reservoir lets you brew 8 cups before refilling"
    ],
    description: [
      "The Keurig K-Elite single serve coffee maker blends a premium finish and programmable features to deliver both modern design and the ultimate in beverage customization."
    ],
    details: {
      "Brand": "Keurig",
      "Capacity": "75 Fluid Ounces",
      "Color": "Brushed Slate",
      "Special Feature": "Programmable, Iced Coffee Setting"
    },
    bought_together: ["B00H_KETTLE", "B00H_BLENDER"]
  },
  {
    parent_asin: "B00H_AIRFRYER",
    title: "COSORI Pro II Air Fryer Oven Combo, 5.8QT XL",
    main_category: "Home & Kitchen",
    average_rating: 4.7,
    rating_number: 28500,
    price: 119.99,
    store: "COSORI Store",
    categories: ["Home & Kitchen", "Kitchen & Dining", "Small Appliances", "Air Fryers"],
    features: [
      "12 customizable one-touch cooking presets for steak, poultry, seafood, bacon, veggies",
      "Rapid 360 air circulation cooks food fast with up to 85% less oil than deep frying",
      "Spacious 5.8-quart square nonstick basket fits a whole 5-lb chicken",
      "Dishwasher safe, BPA-free removable nonstick frying basket"
    ],
    description: [
      "Enjoy crispy, delicious meals with up to 85% less oil than traditional deep frying. The COSORI Pro II Air Fryer features customizable presets, a spacious XL square basket, and an included recipe book to inspire your home cooking."
    ],
    details: {
      "Brand": "COSORI",
      "Capacity": "5.8 Quarts",
      "Color": "Matte Black",
      "Wattage": "1700 Watts"
    },
    bought_together: ["B00H_KNIVES", "B00H_BLENDER"]
  },
  {
    parent_asin: "B00H_VACUUM",
    title: "Dyson V8 Cordless Vacuum Cleaner",
    main_category: "Home & Kitchen",
    average_rating: 4.5,
    rating_number: 11200,
    price: 469.99,
    store: "Dyson",
    categories: ["Home & Kitchen", "Vacuum Cleaners & Floor Care", "Vacuums", "Stick Vacuums"],
    features: [
      "Cordless convenience with powerful suction for whole-home deep cleaning",
      "Up to 40 minutes of fade-free run time under standard mode",
      "De-tangling Motorbar cleaner head deep cleans carpets and hard floors",
      "Converts to a handheld vacuum for cleaning cars, stairs, and upholstery"
    ],
    description: [
      "Engineered for deep homes with pets. The Dyson V8 cordless vacuum has powerful suction and a de-tangling Motorbar brush bar that automatically clears wrapped hair as you clean."
    ],
    details: {
      "Brand": "Dyson",
      "Power Source": "Battery Powered",
      "Filter Type": "HEPA Filtration",
      "Weight": "5.63 Pounds"
    },
    bought_together: ["B00H_KETTLE", "B00O_DESK"]
  },
  {
    parent_asin: "B00H_KETTLE",
    title: "Fellow Stagg EKG Electric Gooseneck Kettle",
    main_category: "Home & Kitchen",
    average_rating: 4.8,
    rating_number: 3100,
    price: 165.00,
    store: "Fellow",
    categories: ["Home & Kitchen", "Kitchen & Dining", "Small Appliances", "Electric Kettles"],
    features: [
      "Elegant gooseneck spout for an optimal, slow pour-over flow rate",
      "To-the-degree temperature control from 135°F to 212°F",
      "Quick heating element with 1200 watts of power to boil water fast",
      "60-minute temperature hold mode keeps water hot and ready"
    ],
    description: [
      "A beautiful aesthetic meets high utility. The Fellow Stagg EKG Gooseneck kettle is the professional barista choice for pour-over tea and coffee enthusiasts, featuring precise PID temperature tracking."
    ],
    details: {
      "Brand": "Fellow",
      "Capacity": "0.9 Liters",
      "Material": "Stainless Steel",
      "Color": "Matte Black"
    },
    bought_together: ["B00H_COFFEE", "B00H_BLENDER"]
  },
  {
    parent_asin: "B00H_KNIVES",
    title: "Mercer Culinary Genesis 6-Piece Forged Knife Block Set",
    main_category: "Home & Kitchen",
    average_rating: 4.7,
    rating_number: 6700,
    price: 149.00,
    store: "Mercer Culinary",
    categories: ["Home & Kitchen", "Kitchen & Dining", "Cutlery", "Knife Block Sets"],
    features: [
      "High-carbon German steel blades resist rust, corrosion, and discoloration",
      "Ergonomic Santoprene handle offers secure non-slip grip even when wet",
      "Taper-ground edge allows for added stability, easy sharpening, and long-lasting sharpness",
      "Sleek tempered glass knife block showcases professional cutlery"
    ],
    description: [
      "The Mercer Culinary Genesis 6-Piece Block Set combines safety, high performance, and visual elegance in one collection. Forged from German steel, these cutlery essentials will handle any kitchen prep task."
    ],
    details: {
      "Brand": "Mercer Culinary",
      "Blade Material": "High Carbon German Steel",
      "Handle Material": "Santoprene",
      "Block Type": "Glass Block"
    },
    bought_together: ["B00H_AIRFRYER", "B00H_BLENDER"]
  },
  {
    parent_asin: "B00H_BLENDER",
    title: "Vitamix 5200 Blender, Professional-Grade, 64oz",
    main_category: "Home & Kitchen",
    average_rating: 4.8,
    rating_number: 14320,
    price: 499.95,
    store: "Vitamix",
    categories: ["Home & Kitchen", "Kitchen & Dining", "Small Appliances", "Blenders", "Countertop Blenders"],
    features: [
      "Variable Speed Control: Easily adjust speed to achieve a variety of textures",
      "Large 64-ounce container is ideal for blending medium to large batches",
      "Hardened stainless-steel blades handle the toughest ingredients with ease",
      "Self-Cleaning: With a drop of dish soap and warm water, it cleans itself in 30-60 seconds"
    ],
    description: [
      "The Vitamix 5200 is the industry standard for professional-grade blending performance. From hot soups to frozen desserts, it delivers unmatched power and durability to the home chef."
    ],
    details: {
      "Brand": "Vitamix",
      "Capacity": "64 Fluid Ounces",
      "Color": "Black",
      "Voltage": "120 Volts"
    },
    bought_together: ["B00H_COFFEE", "B00H_AIRFRYER", "B00H_KNIVES"]
  },

  // --- SPORTS & OUTDOORS (6 items) ---
  {
    parent_asin: "B00S_YOGA",
    title: "Manduka PRO Yoga Mat, 6mm Extra Thick",
    main_category: "Sports & Outdoors",
    average_rating: 4.7,
    rating_number: 4500,
    price: 138.00,
    store: "Manduka Store",
    categories: ["Sports & Outdoors", "Sports & Fitness", "Yoga & Pilates", "Yoga Mats"],
    features: [
      "Ultra-dense 6mm cushioning provides superior joint support and spine protection",
      "Proprietary dot pattern bottom keeps the mat locked in place on any floor",
      "Closed-cell surface blocks moisture and sweat from seeping into the mat core",
      "Emissions-free manufacturing, 100% latex-free and OEKO-TEX certified"
    ],
    description: [
      "The world's premium professional yoga mat. The Manduka PRO is designed for lifetime durability, offering incredible support for rigorous yoga, hot pilates, or general fitness flows."
    ],
    details: {
      "Brand": "Manduka",
      "Material": "Eco-PVC",
      "Thickness": "6 Millimeters",
      "Weight": "7.5 Pounds"
    },
    bought_together: ["B00S_BOTTLE", "B00S_SHOES"]
  },
  {
    parent_asin: "B00S_BOTTLE",
    title: "Hydro Flask Wide Mouth Bottle with Flex Straw Lid",
    main_category: "Sports & Outdoors",
    average_rating: 4.8,
    rating_number: 19800,
    price: 44.95,
    store: "Hydro Flask",
    categories: ["Sports & Outdoors", "Outdoor Recreation", "Camping & Hiking", "Hydration", "Water Bottles"],
    features: [
      "TempShield double-wall vacuum insulation keeps drinks cold for up to 24 hours",
      "Leakproof Flex Straw cap makes sipping easy and reliable",
      "Made with professional-grade 18/8 stainless steel to ensure pure taste and no flavor transfer",
      "Color Last powder coat is dishwasher safe and non-slip"
    ],
    description: [
      "Cold drinks stay icy for 24 hours. The Hydro Flask vacuum insulated wide mouth water bottle with leakproof Flex Straw Cap is the perfect companion for hiking, sports, or the daily commute."
    ],
    details: {
      "Brand": "Hydro Flask",
      "Capacity": "32 Ounces",
      "Material": "18/8 Stainless Steel",
      "Color": "Pacific Blue"
    },
    bought_together: ["B00S_YOGA", "B00S_BACKPACK", "B00E_SPEAKER"]
  },
  {
    parent_asin: "B00S_BACKPACK",
    title: "Osprey Talon 22 Men's Hiking Backpack",
    main_category: "Sports & Outdoors",
    average_rating: 4.8,
    rating_number: 2900,
    price: 160.00,
    store: "Osprey",
    categories: ["Sports & Outdoors", "Outdoor Recreation", "Camping & Hiking", "Backpacks & Bags"],
    features: [
      "Dual-zippered panel access to spacious main compartment",
      "AirScape injection-molded, die-cut foam backpanel provides breathable comfort close to body",
      "Stow-on-the-Go trekking pole attachment allows quick storage",
      "Integrated BioStretch harness and continuous-wrap hipbelt allow dynamic movement"
    ],
    description: [
      "The Talon 22 is the perfect day hiking pack, featuring a highly breathable AirScape suspension, active-fit harness, and convenient external pockets for quick-access gear organization."
    ],
    details: {
      "Brand": "Osprey",
      "Capacity": "22 Liters",
      "Weight": "2.1 Pounds",
      "Material": "Recycled High Tenacity Nylon"
    },
    bought_together: ["B00S_BOTTLE", "B00S_TENT"]
  },
  {
    parent_asin: "B00S_DUMBBELLS",
    title: "Bowflex SelectTech 552 Adjustable Dumbbells (Pair)",
    main_category: "Sports & Outdoors",
    average_rating: 4.7,
    rating_number: 15400,
    price: 429.00,
    store: "Bowflex Store",
    categories: ["Sports & Outdoors", "Sports & Fitness", "Strength Training", "Dumbbells"],
    features: [
      "Replaces 15 pairs of traditional dumbbells in one compact design",
      "Adjusts from 5 lbs to 52.5 lbs using an intuitive selection dial system",
      "Durable molding around metal plates provides smooth liftoff and quiet workouts",
      "Includes free access to the JRNY on-demand strength training app"
    ],
    description: [
      "Eliminate clutter in your home gym. The Bowflex SelectTech 552 Adjustable Dumbbells combine 15 weights into one single, high-tech pair, letting you customize weight selections instantly."
    ],
    details: {
      "Brand": "Bowflex",
      "Weight Range": "5 to 52.5 lbs per dumbbell",
      "Item Dimensions": "15.75 x 7.87 x 9 inches",
      "Material": "Steel, Thermoplastic Rubber"
    },
    bought_together: ["B00S_YOGA", "B00S_SHOES"]
  },
  {
    parent_asin: "B00S_TENT",
    title: "Coleman Sundome 4-Person Camping Tent",
    main_category: "Sports & Outdoors",
    average_rating: 4.5,
    rating_number: 34100,
    price: 89.99,
    store: "Coleman",
    categories: ["Sports & Outdoors", "Outdoor Recreation", "Camping & Hiking", "Tents"],
    features: [
      "WeatherTec system with patented welded floors and inverted seams keeps you dry",
      "Dome tent structure with sleeve-pole design sets up easily in under 10 minutes",
      "Large windows and ground vent deliver superior ventilation and cooling airflow",
      "E-Port makes it easy to bring electrical cord power inside the tent"
    ],
    description: [
      "Enjoy classic outdoor camping with the Coleman Sundome 4-Person Dome Tent. Ideal for warm weather, it features spacious windows, a lightweight rainfly, and an easy setup."
    ],
    details: {
      "Brand": "Coleman",
      "Capacity": "4 Persons",
      "Material": "Polyester, Fiberglass Poles",
      "Setup Time": "10 Minutes"
    },
    bought_together: ["B00S_BACKPACK", "B00S_BOTTLE"]
  },
  {
    parent_asin: "B00S_SHOES",
    title: "Brooks Ghost 15 Men's Neutral Running Shoes",
    main_category: "Sports & Outdoors",
    average_rating: 4.6,
    rating_number: 11400,
    price: 139.95,
    store: "Brooks",
    categories: ["Sports & Outdoors", "Sports & Fitness", "Running", "Athletic Shoes"],
    features: [
      "DNA LOFT v2 cushioning offers soft, responsive support underfoot",
      "Engineered air mesh upper delivers highly breathable, secure structure",
      "Segmented Crash Pad transitions smoothly from heel to toe during runs",
      "Certified Carbon Neutral product made with recycled polyester fabric"
    ],
    description: [
      "The runner's favorite. The Brooks Ghost 15 provides a smooth ride with soft cushioning, adaptive mesh, and stable foot placements that make it excellent for road runs or daily training."
    ],
    details: {
      "Brand": "Brooks",
      "Support Type": "Neutral Support",
      "Cushioning": "Max DNA LOFT v2",
      "Terrain": "Road Running"
    },
    bought_together: ["B00S_YOGA", "B00E_SPEAKER"]
  },

  // --- OFFICE PRODUCTS (6 items) ---
  {
    parent_asin: "B00O_CHAIR",
    title: "Steelcase Gesture Ergonomic Office Chair",
    main_category: "Office Products",
    average_rating: 4.6,
    rating_number: 1450,
    price: 1399.00,
    store: "Steelcase Store",
    categories: ["Office Products", "Office Furniture", "Office Chairs", "Ergonomic Chairs"],
    features: [
      "LiveBack technology automatically mimics the natural movement of your spine",
      "Fully adjustable 360-degree rotating armrests support elbows in any task posture",
      "Pneumatic height adjustment, tilt lock, and seat depth slider",
      "Designed for long-term health and absolute comfort during 8+ hour workdays"
    ],
    description: [
      "The premier ergonomic office chair on the market. The Steelcase Gesture adaptively supports multiple device postures, reducing back strain and helping maintain premium focus and productivity."
    ],
    details: {
      "Brand": "Steelcase",
      "Material": "Premium Textile, Aluminum",
      "Adjustability": "Full 3D Adjustments",
      "Weight Capacity": "400 lbs"
    },
    bought_together: ["B00O_DESK", "B00O_LAMP", "B00E_KEYBOARD"]
  },
  {
    parent_asin: "B00O_DESK",
    title: "FLEXISPOT Essential Electric Standing Desk, 48x24",
    main_category: "Office Products",
    average_rating: 4.6,
    rating_number: 8900,
    price: 229.99,
    store: "Flexispot",
    categories: ["Office Products", "Office Furniture", "Desks", "Standing Desks"],
    features: [
      "Smooth electric height adjustment from 28.3 inches up to 47.6 inches",
      "Industrial-grade heavy-duty steel frame supports up to 154 lbs",
      "Spacious eco-friendly desktop fits two monitors and accessories",
      "Two-button controller offers straightforward and quiet desk transitions"
    ],
    description: [
      "Elevate your work wellness. The Flexispot standing desk allows you to easily transition from sitting to standing throughout your busy workday, boosting focus and dynamic movement."
    ],
    details: {
      "Brand": "Flexispot",
      "Desk Size": "48 x 24 Inches",
      "Material": "Alloy Steel, MDF Wood",
      "Color": "Maple Top + White Frame"
    },
    bought_together: ["B00O_CHAIR", "B00O_LAMP", "B00O_NOTEBOOK"]
  },
  {
    parent_asin: "B00O_LAMP",
    title: "BenQ ScreenBar LED Monitor Light Reading Lamp",
    main_category: "Office Products",
    average_rating: 4.8,
    rating_number: 4500,
    price: 109.00,
    store: "BenQ Store",
    categories: ["Office Products", "Office Supplies", "Desk Lighting", "Monitor Lamps"],
    features: [
      "Auto-dimming light uses a built-in sensor to detect ambient brightness",
      "Asymmetrical optical design illuminates only the desk, avoiding screen glare",
      "Specially designed clip mounts directly onto monitor, saving valuable desk space",
      "Adjustable color temperature from warm yellow to cool white"
    ],
    description: [
      "Care for your eyes during long late-night desk sessions. The BenQ ScreenBar delivers a glare-free, space-saving light bar that automatically balances workspace illumination."
    ],
    details: {
      "Brand": "BenQ",
      "Light Source": "LED",
      "Power Source": "USB Powered",
      "Material": "Aluminum Alloy"
    },
    bought_together: ["B00O_CHAIR", "B00E_KEYBOARD"]
  },
  {
    parent_asin: "B00O_NOTEBOOK",
    title: "Leuchtturm1917 Classic A5 Hardcover Dotted Notebook",
    main_category: "Office Products",
    average_rating: 4.7,
    rating_number: 12200,
    price: 24.50,
    store: "Leuchtturm1917",
    categories: ["Office Products", "Office Supplies", "Paper Products", "Notebooks & Writing pads"],
    features: [
      "251 numbered pages of ink-proof 80g/m acid-free dotted paper",
      "Includes blank table of contents, expandable inner back pocket, and double ribbon bookmarks",
      "Stitched thread binding opens completely flat for comfortable writing",
      "Durable, water-resistant synthetic leather hardcover"
    ],
    description: [
      "The classic design notebook for bullet journaling, sketching, or general notes. Meticulous German design ensures heavy paper quality that resists bleeding and ghosting from fine ink pens."
    ],
    details: {
      "Brand": "Leuchtturm1917",
      "Paper Size": "A5 (5.8 x 8.3 inches)",
      "Style": "Dotted Pages",
      "Color": "Emerald Green"
    },
    bought_together: ["B00O_PENS", "B00B_PYTHON"]
  },
  {
    parent_asin: "B00O_PENS",
    title: "Pilot G2 Premium Gel Ink Rollerball Pens, Fine Pt, 12-Pack",
    main_category: "Office Products",
    average_rating: 4.8,
    rating_number: 64100,
    price: 14.99,
    store: "Pilot Pens",
    categories: ["Office Products", "Office Supplies", "Writing Instruments", "Pens", "Gel Pens"],
    features: [
      "Super-smooth, long-lasting gel ink writes cleanly and doesn't smear",
      "Ergonomic contoured rubber grip offers comfortable, tireless writing support",
      "Retractable fine 0.7mm tip is convenient and protects pocket liners",
      "The ultimate go-to pen for offices, students, and daily lists"
    ],
    description: [
      "Discover the smooth, smear-free writing experience of America's #1 Selling Gel Pen. Pilot G2 pens write longer than other competitive gel brands and offer absolute comfort."
    ],
    details: {
      "Brand": "Pilot",
      "Ink Color": "Black",
      "Point Type": "Fine (0.7mm)",
      "Count": "12 Pens"
    },
    bought_together: ["B00O_NOTEBOOK", "B00B_FINANCE"]
  },
  {
    parent_asin: "B00O_ORGANIZER",
    title: "Jerry & Maggie Desktop Expandable Wood Storage Organizer",
    main_category: "Office Products",
    average_rating: 4.4,
    rating_number: 13500,
    price: 26.99,
    store: "Jerry & Maggie",
    categories: ["Office Products", "Office Furniture", "Desk Organizers & Accessories"],
    features: [
      "Natural wood construction is non-toxic, lightweight, and durable",
      "Features 2 main separate pieces that can be compressed, expanded, or rotated to fit small desk nooks",
      "Multiple compartments provide storage for books, pens, small plants, and files",
      "Easy assembly with screws and detailed instruction manual included"
    ],
    description: [
      "Clear off desktop clutter with this adjustable natural wood organizer. Its flexible dual-piece structure allows you to configure personalized shelves for books and accessories."
    ],
    details: {
      "Brand": "Jerry & Maggie",
      "Material": "Natural Wood",
      "Color": "White Wood Finish",
      "Dimensions": "15.7 x 13.8 x 6.7 inches"
    },
    bought_together: ["B00O_NOTEBOOK", "B00O_PENS"]
  },

  // --- BOOKS (6 items) ---
  {
    parent_asin: "B00B_PYTHON",
    title: "Python Crash Course, 3rd Edition: A Hands-On Project-Based Intro",
    main_category: "Books",
    average_rating: 4.8,
    rating_number: 5200,
    price: 36.50,
    store: "No Starch Press",
    categories: ["Books", "Computers & Technology", "Programming", "Python", "Software Engineering"],
    features: [
      "The world's best-selling introductory guide to Python programming",
      "Hands-on learning through active code exercises and 3 major project blocks",
      "Updated to cover the absolute latest Python 3.1x syntax and libraries",
      "Clear, jargon-free explanations perfect for both complete beginners and pros"
    ],
    description: [
      "Python Crash Course is the world's best-selling guide to the Python programming language. This fast-paced, thorough introduction will have you writing programs, solving problems, and developing working applications in no time."
    ],
    details: {
      "Author": "Eric Matthes",
      "Publisher": "No Starch Press",
      "Format": "Paperback, 552 pages",
      "Language": "English"
    },
    bought_together: ["B00B_SCIFI", "B00O_NOTEBOOK", "B00E_KEYBOARD"]
  },
  {
    parent_asin: "B00B_SCIFI",
    title: "Dune (Deluxe Hardcover Edition) by Frank Herbert",
    main_category: "Books",
    average_rating: 4.8,
    rating_number: 45600,
    price: 29.99,
    store: "Penguin Random House",
    categories: ["Books", "Science Fiction & Fantasy", "Science Fiction", "Classic Sci-Fi"],
    features: [
      "Beautiful deluxe hardcover with stained edges and custom endpapers",
      "Includes a fully detailed map of Arrakis and an extensive glossary of terms",
      "The definitive epic masterpiece of planetary colonization and interstellar intrigue",
      "Awarded the inaugural Hugo and Nebula Awards for best novel"
    ],
    description: [
      "Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only thing of value is the spice 'melange'."
    ],
    details: {
      "Author": "Frank Herbert",
      "Format": "Hardcover, 688 pages",
      "Publisher": "Ace Books",
      "Language": "English"
    },
    bought_together: ["B00B_PYTHON", "B00B_COOKBOOK"]
  },
  {
    parent_asin: "B00B_FINANCE",
    title: "The Psychology of Money: Timeless lessons on wealth and greed",
    main_category: "Books",
    average_rating: 4.7,
    rating_number: 35100,
    price: 16.99,
    store: "Harriman House",
    categories: ["Books", "Business & Money", "Personal Finance", "Investing", "Psychology"],
    features: [
      "19 short, highly engaging stories exploring the weird ways people think about money",
      "Practical advice on how to build long-term wealth, manage risk, and find financial peace",
      "Helps you understand that doing well with money isn't about what you know, but how you behave",
      "Acclaimed by business leaders and financial experts worldwide"
    ],
    description: [
      "Doing well with money isn't necessarily about what you know. It's about how you behave. And behavior is hard to teach, even to really smart people. This book explores the human psychology of wealth, greed, and happiness."
    ],
    details: {
      "Author": "Morgan Housel",
      "Format": "Paperback, 252 pages",
      "Publisher": "Harriman House",
      "Language": "English"
    },
    bought_together: ["B00B_PYTHON", "B00O_PENS", "B00O_NOTEBOOK"]
  },
  {
    parent_asin: "B00B_PRODUCTIVITY",
    title: "Atomic Habits: An Easy & Proven Way to Build Good Habits & Break Bad Ones",
    main_category: "Books",
    average_rating: 4.8,
    rating_number: 112000,
    price: 18.00,
    store: "Avery Publishing",
    categories: ["Books", "Self-Help", "Personal Transformation", "Productivity", "Habits"],
    features: [
      "Over 15 million copies sold worldwide of this ultimate habit-building blueprint",
      "Learn the Four Laws of Behavior Change to reshape your daily routines",
      "Practical tools and strategies to overcome lack of willpower or motivation",
      "Learn how tiny 1% improvements can stack up to monumental life results"
    ],
    description: [
      "No matter your goals, Atomic Habits offers a proven framework for improving—every day. James Clear, one of the world's leading experts on habit formation, reveals practical strategies that will teach you exactly how to form good habits, break bad ones, and master the tiny behaviors that lead to remarkable results."
    ],
    details: {
      "Author": "James Clear",
      "Format": "Hardcover, 320 pages",
      "Publisher": "Avery",
      "Language": "English"
    },
    bought_together: ["B00B_FINANCE", "B00O_NOTEBOOK"]
  },
  {
    parent_asin: "B00B_COOKBOOK",
    title: "The Food Lab: Better Home Cooking Through Science",
    main_category: "Books",
    average_rating: 4.8,
    rating_number: 12100,
    price: 45.00,
    store: "W. W. Norton & Company",
    categories: ["Books", "Cookbooks, Food & Wine", "Culinary Science", "Techniques & Science"],
    features: [
      "Over 1000 detailed step-by-step color photos illustrating chemical food reactions",
      "Scientifically verified techniques to make perfect roasts, stews, burgers, and eggs",
      "Explains the 'why' behind classic cooking rules to make you an intuitive chef",
      "Winner of the James Beard Award for Best General Cookbook"
    ],
    description: [
      "Ever wondered how to pan-fry a steak with a perfect crust and an even, tender interior? Author J. Kenji López-Alt shows that conventional methods don't always hold up, demonstrating how culinary science can elevate simple home dishes."
    ],
    details: {
      "Author": "J. Kenji López-Alt",
      "Format": "Hardcover, 958 pages",
      "Publisher": "W. W. Norton & Company",
      "Language": "English"
    },
    bought_together: ["B00H_KNIVES", "B00H_BLENDER", "B00B_SCIFI"]
  },
  {
    parent_asin: "B00B_SPACE",
    title: "Astrophysics for People in a Hurry by Neil deGrasse Tyson",
    main_category: "Books",
    average_rating: 4.7,
    rating_number: 28900,
    price: 14.95,
    store: "W. W. Norton & Company",
    categories: ["Books", "Science & Math", "Astronomy & Space Science", "Astrophysics"],
    features: [
      "Quick, witty, and deeply mind-expanding introduction to cosmic mysteries",
      "Covers the Big Bang, quantum mechanics, dark energy, and black holes in short bites",
      "Written in accessible, humorous language perfect for busy readers",
      "New York Times #1 Best Seller"
    ],
    description: [
      "What is the nature of space and time? How do we fit within the universe? Neil deGrasse Tyson brings the cosmos down to Earth succinctly and clearly, with sparkling wit, in tasty chapters consumable anytime, anywhere."
    ],
    details: {
      "Author": "Neil deGrasse Tyson",
      "Format": "Hardcover, 224 pages",
      "Publisher": "W. W. Norton & Company",
      "Language": "English"
    },
    bought_together: ["B00B_SCIFI", "B00B_PYTHON"]
  }
];

export const REVIEWS: Review[] = [
  // --- B00E_HEADPHONES (Sony WH-1000XM4) REVIEWS ---
  {
    rating: 5.0,
    title: "Absolute gold standard of noise cancellation!",
    text: "I travel constantly for business and these headphones are an absolute lifesaver. The active noise cancellation is spooky good - it literally makes airplane engine drone completely disappear. The sound is incredibly balanced and warm, and the battery lasts forever. I had the XM3s and this is a fantastic upgrade. Well worth the price!",
    asin: "B00E_HEADPHONES",
    parent_asin: "B00E_HEADPHONES",
    user_id: "USR_101",
    timestamp: 1699584000,
    verified_purchase: true,
    helpful_vote: 240
  },
  {
    rating: 4.0,
    title: "Incredible sound, but multi-point is a bit glitchy",
    text: "The audio quality and comfort are phenomenal. I can wear these all day during long work shifts without any ear pain. My only minor complaint is the multi-point Bluetooth pairing. Sometimes it gets confused switching between my iPhone and Mac, but restarting the app usually fixes it. Still easily 4.5 stars.",
    asin: "B00E_HEADPHONES",
    parent_asin: "B00E_HEADPHONES",
    user_id: "USR_102",
    timestamp: 1698201600,
    verified_purchase: true,
    helpful_vote: 56
  },
  {
    rating: 5.0,
    title: "Best headphones I have ever owned",
    text: "Anker charger combined with these makes my workspace perfect. The sound quality is deep and immersive, noise canceling blocks out my roommates perfectly. Highly recommended for remote workers!",
    asin: "B00E_HEADPHONES",
    parent_asin: "B00E_HEADPHONES",
    user_id: "USR_01", // Alex Johnson (Tech Enthusiast)
    timestamp: 1700102400,
    verified_purchase: true,
    helpful_vote: 12
  },

  // --- B00E_SMARTWATCH (Apple Watch 9) REVIEWS ---
  {
    rating: 5.0,
    title: "The double tap feature is a game changer!",
    text: "The double tap gesture is so useful when my hands are full or dirty from cooking. The screen is noticeably brighter than my old series 6, and the performance is lightning fast. Battery life gets me through a full day and sleep tracking with ease. Apple did it again.",
    asin: "B00E_SMARTWATCH",
    parent_asin: "B00E_SMARTWATCH",
    user_id: "USR_103",
    timestamp: 1701216000,
    verified_purchase: true,
    helpful_vote: 88
  },
  {
    rating: 4.0,
    title: "Great watch but incremental upgrade",
    text: "If you have a Series 7 or 8, you probably don't need this. The chip is faster and double tap is cool, but otherwise it feels exactly the same. However, if you are upgrading from an older watch or getting your first smartwatch, this is the absolute best on the market.",
    asin: "B00E_SMARTWATCH",
    parent_asin: "B00E_SMARTWATCH",
    user_id: "USR_104",
    timestamp: 1699920000,
    verified_purchase: false,
    helpful_vote: 14
  },

  // --- B00E_CHARGER (Anker Wireless Charger) REVIEWS ---
  {
    rating: 5.0,
    title: "Super clean nightstand setup!",
    text: "I love this charger! No more plugging in three different cables at night. My iPhone 15 magnets lock right into place, and my Apple Watch and AirPods charge quickly. The foldable stand design is awesome for packing in a backpack. Anker makes outstanding accessories as always.",
    asin: "B00E_CHARGER",
    parent_asin: "B00E_CHARGER",
    user_id: "USR_105",
    timestamp: 1700448000,
    verified_purchase: true,
    helpful_vote: 42
  },
  {
    rating: 3.0,
    title: "Slow charging if all three are used",
    text: "It does charge all devices, but when I have my iPhone, Apple Watch, and AirPods on at the same time, the charging speed drops significantly. It is fine for overnight charging, but don't buy this if you need a quick top-up during the day.",
    asin: "B00E_CHARGER",
    parent_asin: "B00E_CHARGER",
    user_id: "USR_106",
    timestamp: 1698710400,
    verified_purchase: true,
    helpful_vote: 9
  },

  // --- B00H_COFFEE (Keurig K-Elite) REVIEWS ---
  {
    rating: 5.0,
    title: "Makes the perfect iced coffee!",
    text: "The dedicated 'Iced' setting is incredible. It brews a highly concentrated hot shot over ice so it doesn't taste watered down. The hot water dispenser is also wonderful for quick tea or instant oatmeal. The slate grey finish looks very sleek in my kitchen.",
    asin: "B00H_COFFEE",
    parent_asin: "B00H_COFFEE",
    user_id: "USR_02", // Emily Smith (Home Chef)
    timestamp: 1700620800,
    verified_purchase: true,
    helpful_vote: 130
  },
  {
    rating: 4.0,
    title: "Huge water reservoir but noisy",
    text: "We brew 6-8 cups a day in our household, so the massive 75oz tank is perfect. However, it makes a pretty loud vibration sound when drawing water from the tank to heat. Otherwise, coffee is hot, delicious, and extremely fast.",
    asin: "B00H_COFFEE",
    parent_asin: "B00H_COFFEE",
    user_id: "USR_107",
    timestamp: 1699142400,
    verified_purchase: true,
    helpful_vote: 22
  },

  // --- B00H_AIRFRYER (Cosori Air Fryer) REVIEWS ---
  {
    rating: 5.0,
    title: "Haven't used my real oven since buying this",
    text: "This thing is a miracle. French fries, chicken wings, roasted brussels sprouts, and even salmon come out incredibly crispy in a fraction of the time. The square basket holds way more than circular ones of the same size. Cleaning is super simple because the nonstick is extremely high quality.",
    asin: "B00H_AIRFRYER",
    parent_asin: "B00H_AIRFRYER",
    user_id: "USR_02", // Emily Smith (Home Chef)
    timestamp: 1698028800,
    verified_purchase: true,
    helpful_vote: 310
  },
  {
    rating: 5.0,
    title: "Awesome appliance for meal prep",
    text: "So fast and easy to clean. Cooking chicken breast takes 12 minutes and it stays super juicy. Highly recommend for fitness enthusiasts or anyone trying to eat healthier with less oil.",
    asin: "B00H_AIRFRYER",
    parent_asin: "B00H_AIRFRYER",
    user_id: "USR_03", // Michael Chang (Fitness)
    timestamp: 1700880000,
    verified_purchase: true,
    helpful_vote: 19
  },

  // --- B00S_YOGA (Manduka Yoga Mat) REVIEWS ---
  {
    rating: 5.0,
    title: "The Rolls Royce of yoga mats",
    text: "Yes, it is heavy and expensive. Yes, you have to break it in with a salt scrub when you first get it. But once you do, the grip is absolutely unbeatable, and the 6mm thickness offers unmatched cushion for your knees. I expect this mat to easily last me another 10 years.",
    asin: "B00S_YOGA",
    parent_asin: "B00S_YOGA",
    user_id: "USR_03", // Michael Chang
    timestamp: 1699315200,
    verified_purchase: true,
    helpful_vote: 72
  },

  // --- B00O_CHAIR (Steelcase Gesture) REVIEWS ---
  {
    rating: 5.0,
    title: "Saved my lower back!",
    text: "I was having severe lumbar pain sitting 10 hours a day working from home. I tried three different chairs and finally bit the bullet on the Steelcase Gesture. Wow, the difference is immediate. The armrests adjust in any direction imaginable, and the back support reclines naturally while keeping you supported. It is an investment in your health.",
    asin: "B00O_CHAIR",
    parent_asin: "B00O_CHAIR",
    user_id: "USR_108",
    timestamp: 1700966400,
    verified_purchase: true,
    helpful_vote: 95
  },

  // --- B00B_PYTHON (Python Crash Course) REVIEWS ---
  {
    rating: 5.0,
    title: "The absolute best book to learn coding",
    text: "I tried multiple online video courses and kept getting stuck. This book is paced perfectly. It explains core concepts like loops, dictionaries, and classes beautifully, then guides you through creating a space invaders game, data visualizations with matplotlib, and a web app in Django. Best purchase ever!",
    asin: "B00B_PYTHON",
    parent_asin: "B00B_PYTHON",
    user_id: "USR_04", // Sarah Parker
    timestamp: 1698883200,
    verified_purchase: true,
    helpful_vote: 154
  },
  {
    rating: 5.0,
    title: "Clear, practical, and highly engaging",
    text: "This book coupled with a dotted notebook for planning my code was exactly what I needed. Everything is broken down logically. I went from zero coding knowledge to running my first neural network model in Python!",
    asin: "B00B_PYTHON",
    parent_asin: "B00B_PYTHON",
    user_id: "USR_01", // Alex Johnson
    timestamp: 1699584000,
    verified_purchase: true,
    helpful_vote: 45
  },

  // --- GENERAL POPULAR REVIEWS FOR OTHER ITEMS ---
  {
    rating: 5.0,
    title: "Phenomenal insulated bottle",
    text: "Hydro Flask water bottle is absolute perfection. My ice remains solid for over 24 hours. Flex straw is robust and 100% leakproof. Love the pacific blue color!",
    asin: "B00S_BOTTLE",
    parent_asin: "B00S_BOTTLE",
    user_id: "USR_03",
    timestamp: 1700361600,
    verified_purchase: true,
    helpful_vote: 204
  },
  {
    rating: 5.0,
    title: "Best standing desk for the money",
    text: "The Flexispot motorized adjustment is whisper quiet and ultra-smooth. Doesn't wobble even at full height extension. Matches beautifully with my ergonomic Steelcase chair.",
    asin: "B00O_DESK",
    parent_asin: "B00O_DESK",
    user_id: "USR_05",
    timestamp: 1700534400,
    verified_purchase: true,
    helpful_vote: 84
  },
  {
    rating: 5.0,
    title: "The psychology of money is a masterpiece",
    text: "Morgan Housel explains finance like no other. This book doesn't give you stock charts, it gives you deep wisdom on managing greed and defining your 'enough'. Highly recommend to everyone.",
    asin: "B00B_FINANCE",
    parent_asin: "B00B_FINANCE",
    user_id: "USR_04",
    timestamp: 1699756800,
    verified_purchase: true,
    helpful_vote: 410
  },
  {
    rating: 5.0,
    title: "Habit stacking actually works",
    text: "Atomic Habits is hands down the most practical self-help book I've ever read. The idea of getting 1% better every day is so encouraging, and James Clear gives actionable habits systems to make success automatic. Life changing.",
    asin: "B00B_PRODUCTIVITY",
    parent_asin: "B00B_PRODUCTIVITY",
    user_id: "USR_109",
    timestamp: 1700016000,
    verified_purchase: true,
    helpful_vote: 612
  },
  {
    rating: 5.0,
    title: "The ultimate culinary bible!",
    text: "Kenji Lopez-Alt is a genius. This book explains the scientific chemical reactions behind sear, emulsions, heat, and moisture, accompanied by delicious recipes. It is heavy like a dictionary but read like a thrilling novel!",
    asin: "B00B_COOKBOOK",
    parent_asin: "B00B_COOKBOOK",
    user_id: "USR_02",
    timestamp: 1699238400,
    verified_purchase: true,
    helpful_vote: 215
  },
  {
    rating: 4.0,
    title: "Compact and rugged speaker",
    text: "The JBL Flip 6 has a punchy bass and clean vocals for its size. Take it with me to camping trips inside my Osprey backpack, works perfectly under light rain. Waterproof seal is top tier.",
    asin: "B00E_SPEAKER",
    parent_asin: "B00E_SPEAKER",
    user_id: "USR_110",
    timestamp: 1698883200,
    verified_purchase: true,
    helpful_vote: 31
  }
];

// Dynamically generate default reviews for products that don't have explicit reviews
PRODUCTS.forEach(product => {
  const hasReviews = REVIEWS.some(r => r.parent_asin === product.parent_asin);
  if (!hasReviews) {
    // Generate 2 generic high-quality reviews matching the product profile
    REVIEWS.push({
      rating: Math.floor(product.average_rating) || 5,
      title: `Highly impressed with this ${product.main_category} item`,
      text: `This ${product.title} is an absolute must-buy! It arrived on time and functions exactly as described. The details list: "${Object.entries(product.details).map(([k, v]) => `${k}: ${v}`).join(', ')}" is very accurate. Definite recommend!`,
      asin: product.parent_asin,
      parent_asin: product.parent_asin,
      user_id: `GEN_${product.parent_asin.slice(4, 8)}`,
      timestamp: 1699401600,
      verified_purchase: true,
      helpful_vote: Math.floor(Math.random() * 20) + 2
    });
    
    REVIEWS.push({
      rating: Math.round(product.average_rating) || 4,
      title: "Great value and build quality",
      text: `I've been using this for a few weeks now in my daily routine and the results have been great. Some highlights: ${product.features[0]}. It represents the ${product.store} brand exceptionally well.`,
      asin: product.parent_asin,
      parent_asin: product.parent_asin,
      user_id: "USR_GEN_ALT",
      timestamp: 1698624000,
      verified_purchase: true,
      helpful_vote: Math.floor(Math.random() * 8)
    });
  }
});
