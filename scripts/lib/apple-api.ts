/**
 * Apple Catalog Specification and CDN Resource Matrix
 * Standartlar: AGENTS.md (Zero Emojis, TypeScript Strict, Separation of Concerns)
 */

export interface AppleColorEntry {
  name: string;
  hex: string;
  imageFile: string;
  imageUrl: string;
}

export interface AppleHardwareSpecs {
  screenSize: string;
  processor: string;
  ram: string;
  battery: string;
  camera: string;
  charging: string;
  os: string;
}

export interface AppleModelEntry {
  brand: 'Apple';
  series: string;
  model: string;
  modelCode: string;
  releaseYear: number;
  status: 'available' | 'upcoming';
  colors: AppleColorEntry[];
  storageOptions: string[];
  specs: AppleHardwareSpecs;
  images: string[];
}

export function getAppleCatalog(): AppleModelEntry[] {
  const models: AppleModelEntry[] = [
    // -------------------------------------------------------------------------
    // iPhone 18 Series (Latest Flagship)
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 18',
      model: 'iPhone 18 Pro Max',
      modelCode: 'iphone-18-pro-max',
      releaseYear: 2026,
      status: 'available',
      colors: [
        {
          name: 'Black',
          hex: '#1E1F21',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-9inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#E3E4E6',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-9inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Glacier',
          hex: '#D2DBE1',
          imageFile: 'glacier.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-9inch-glacier?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Burgundy',
          hex: '#5C2434',
          imageFile: 'burgundy.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-9inch-burgundy?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB', '2TB'],
      specs: {
        screenSize:
          '6.9 dyuym LTPO Super Retina XDR OLED, 120Hz ProMotion, Always-On, Dynamic Island, 3000 nits',
        processor: 'Apple A20 Pro (6-core CPU, 7-core GPU, Dual 16-core Neural Engine)',
        ram: '12GB LPDDR5X',
        battery: '5100 mAh (45 soatgacha video ijrosi)',
        camera:
          '48MP Pro Fusion (o‘zgaruvchan diafragma f/1.48-f/4.0) + 48MP ultra-keng + 48MP periscope telephoto',
        charging: 'USB-C (USB 3), 60W tezkor simli, 25W MagSafe va Qi2 simsiz',
        os: 'iOS 27',
      },
      images: ['black.png', 'silver.png', 'glacier.png', 'burgundy.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 18',
      model: 'iPhone 18 Pro',
      modelCode: 'iphone-18-pro',
      releaseYear: 2026,
      status: 'available',
      colors: [
        {
          name: 'Black',
          hex: '#1E1F21',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#E3E4E6',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Glacier',
          hex: '#D2DBE1',
          imageFile: 'glacier.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-glacier?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Burgundy',
          hex: '#5C2434',
          imageFile: 'burgundy.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-18-pro-finish-select-202609-6-3inch-burgundy?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.3 dyuym LTPO Super Retina XDR OLED, 120Hz ProMotion, Always-On, Dynamic Island, 3000 nits',
        processor: 'Apple A20 Pro (6-core CPU, 7-core GPU, Dual 16-core Neural Engine)',
        ram: '12GB LPDDR5X',
        battery: '3950 mAh',
        camera:
          '48MP Pro Fusion (o‘zgaruvchan diafragma f/1.48-f/4.0) + 48MP ultra-keng + 48MP periscope telephoto',
        charging: 'USB-C (USB 3), 60W tezkor simli, 25W MagSafe va Qi2 simsiz',
        os: 'iOS 27',
      },
      images: ['black.png', 'silver.png', 'glacier.png', 'burgundy.png'],
    },

    // -------------------------------------------------------------------------
    // iPhone 17 Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 17',
      model: 'iPhone 17 Pro Max',
      modelCode: 'iphone-17-pro-max',
      releaseYear: 2025,
      status: 'available',
      colors: [
        {
          name: 'Cosmic Orange',
          hex: '#D96B43',
          imageFile: 'cosmic-orange.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-9inch-cosmicorange?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Deep Blue',
          hex: '#2B3D54',
          imageFile: 'deep-blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-9inch-deepblue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#D7D8D9',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-9inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB', '2TB'],
      specs: {
        screenSize:
          '6.9 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island, 3000 nits',
        processor: 'Apple A19 Pro (6-core CPU, 6-core GPU, 16-core Neural Engine)',
        ram: '12GB',
        battery: '4850 mAh',
        camera: '48MP Pro Fusion (f/1.78) + 48MP ultra-keng (f/2.2) + 48MP telephoto',
        charging: 'USB-C, 35W simli, 25W MagSafe',
        os: 'iOS 19',
      },
      images: ['cosmic-orange.png', 'deep-blue.png', 'silver.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 17',
      model: 'iPhone 17 Pro',
      modelCode: 'iphone-17-pro',
      releaseYear: 2025,
      status: 'available',
      colors: [
        {
          name: 'Cosmic Orange',
          hex: '#D96B43',
          imageFile: 'cosmic-orange.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-cosmicorange?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Deep Blue',
          hex: '#2B3D54',
          imageFile: 'deep-blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-deepblue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#D7D8D9',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-pro-finish-select-202509-6-3inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.3 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island, 3000 nits',
        processor: 'Apple A19 Pro (6-core CPU, 6-core GPU, 16-core Neural Engine)',
        ram: '12GB',
        battery: '3700 mAh',
        camera: '48MP Pro Fusion (f/1.78) + 48MP ultra-keng (f/2.2) + 48MP telephoto',
        charging: 'USB-C, 35W simli, 25W MagSafe',
        os: 'iOS 19',
      },
      images: ['cosmic-orange.png', 'deep-blue.png', 'silver.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 17',
      model: 'iPhone 17',
      modelCode: 'iphone-17',
      releaseYear: 2025,
      status: 'available',
      colors: [
        {
          name: 'Black',
          hex: '#232527',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202509-black?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White',
          hex: '#F5F5F7',
          imageFile: 'white.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202509-white?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Lavender',
          hex: '#C8BCE3',
          imageFile: 'lavender.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202509-lavender?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Mist Blue',
          hex: '#A8C4D9',
          imageFile: 'mist-blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202509-mistblue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Sage',
          hex: '#9BB09E',
          imageFile: 'sage.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-17-finish-select-202509-sage?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB'],
      specs: {
        screenSize:
          '6.3 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island, 3000 nits',
        processor: 'Apple A19 (6-core CPU, 5-core GPU, 16-core Neural Engine)',
        ram: '8GB',
        battery: '3600 mAh',
        camera: '48MP Dual Fusion (48MP asosiy f/1.6 + 48MP ultra-keng f/2.2), 18MP selfie',
        charging: 'USB-C, 27W simli, 25W MagSafe',
        os: 'iOS 19',
      },
      images: ['black.png', 'white.png', 'lavender.png', 'mist-blue.png', 'sage.png'],
    },

    // -------------------------------------------------------------------------
    // iPhone 16 Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 16',
      model: 'iPhone 16 Pro Max',
      modelCode: 'iphone-16-pro-max',
      releaseYear: 2024,
      status: 'available',
      colors: [
        {
          name: 'Desert Titanium',
          hex: '#C5B6A5',
          imageFile: 'desert-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-deserttitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Natural Titanium',
          hex: '#9E9A95',
          imageFile: 'natural-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-naturaltitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White Titanium',
          hex: '#F2F1ED',
          imageFile: 'white-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-whitetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black Titanium',
          hex: '#3C3B3A',
          imageFile: 'black-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-9inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB'],
      specs: {
        screenSize: '6.9 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A18 Pro (3nm)',
        ram: '8GB',
        battery: '4685 mAh',
        camera:
          '48MP asosiy Fusion + 48MP ultra-keng + 12MP 5x telephoto, Camera Control tugmasi',
        charging: 'USB-C (USB 3), 30W simli, 25W MagSafe',
        os: 'iOS 18',
      },
      images: [
        'desert-titanium.png',
        'natural-titanium.png',
        'white-titanium.png',
        'black-titanium.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 16',
      model: 'iPhone 16 Pro',
      modelCode: 'iphone-16-pro',
      releaseYear: 2024,
      status: 'available',
      colors: [
        {
          name: 'Desert Titanium',
          hex: '#C5B6A5',
          imageFile: 'desert-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-deserttitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Natural Titanium',
          hex: '#9E9A95',
          imageFile: 'natural-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-naturaltitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White Titanium',
          hex: '#F2F1ED',
          imageFile: 'white-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-whitetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black Titanium',
          hex: '#3C3B3A',
          imageFile: 'black-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-pro-finish-select-202409-6-3inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize: '6.3 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A18 Pro (3nm)',
        ram: '8GB',
        battery: '3582 mAh',
        camera:
          '48MP Fusion + 48MP ultra-keng + 12MP 5x telephoto, Camera Control tugmasi',
        charging: 'USB-C (USB 3), 27W simli, 25W MagSafe',
        os: 'iOS 18',
      },
      images: [
        'desert-titanium.png',
        'natural-titanium.png',
        'white-titanium.png',
        'black-titanium.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 16',
      model: 'iPhone 16 Plus',
      modelCode: 'iphone-16-plus',
      releaseYear: 2024,
      status: 'available',
      colors: [
        {
          name: 'Ultramarine',
          hex: '#3E5C8B',
          imageFile: 'ultramarine.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-ultramarine?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Teal',
          hex: '#4A7C74',
          imageFile: 'teal.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-teal?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#E3A3B4',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-pink?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White',
          hex: '#F5F5F7',
          imageFile: 'white.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-white?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black',
          hex: '#2B2B2E',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-7inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.7 dyuym Super Retina XDR OLED, Dynamic Island',
        processor: 'Apple A18 (3nm)',
        ram: '8GB',
        battery: '4674 mAh',
        camera:
          '48MP Fusion + 12MP ultra-keng (makro fotosurat), Camera Control tugmasi',
        charging: 'USB-C, 27W simli, 25W MagSafe',
        os: 'iOS 18',
      },
      images: ['ultramarine.png', 'teal.png', 'pink.png', 'white.png', 'black.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 16',
      model: 'iPhone 16',
      modelCode: 'iphone-16',
      releaseYear: 2024,
      status: 'available',
      colors: [
        {
          name: 'Ultramarine',
          hex: '#3E5C8B',
          imageFile: 'ultramarine.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-ultramarine?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Teal',
          hex: '#4A7C74',
          imageFile: 'teal.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-teal?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#E3A3B4',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-pink?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White',
          hex: '#F5F5F7',
          imageFile: 'white.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-white?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black',
          hex: '#2B2B2E',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-16-finish-select-202409-6-1inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.1 dyuym Super Retina XDR OLED, Dynamic Island',
        processor: 'Apple A18 (3nm)',
        ram: '8GB',
        battery: '3561 mAh',
        camera: '48MP Fusion + 12MP ultra-keng, Camera Control tugmasi',
        charging: 'USB-C, 27W simli, 25W MagSafe',
        os: 'iOS 18',
      },
      images: ['ultramarine.png', 'teal.png', 'pink.png', 'white.png', 'black.png'],
    },

    // -------------------------------------------------------------------------
    // iPhone 15 Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 15',
      model: 'iPhone 15 Pro Max',
      modelCode: 'iphone-15-pro-max',
      releaseYear: 2023,
      status: 'available',
      colors: [
        {
          name: 'Natural Titanium',
          hex: '#9E9A95',
          imageFile: 'natural-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-naturaltitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Blue Titanium',
          hex: '#3B4454',
          imageFile: 'blue-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-bluetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White Titanium',
          hex: '#F2F1ED',
          imageFile: 'white-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-whitetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black Titanium',
          hex: '#3C3B3A',
          imageFile: 'black-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-7inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.7 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A17 Pro (3nm)',
        ram: '8GB',
        battery: '4422 mAh',
        camera:
          '48MP asosiy + 12MP ultra-keng + 12MP 5x periscope telephoto',
        charging: 'USB-C (USB 3), 27W simli, 15W MagSafe',
        os: 'iOS 17',
      },
      images: [
        'natural-titanium.png',
        'blue-titanium.png',
        'white-titanium.png',
        'black-titanium.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 15',
      model: 'iPhone 15 Pro',
      modelCode: 'iphone-15-pro',
      releaseYear: 2023,
      status: 'available',
      colors: [
        {
          name: 'Natural Titanium',
          hex: '#9E9A95',
          imageFile: 'natural-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-naturaltitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Blue Titanium',
          hex: '#3B4454',
          imageFile: 'blue-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-bluetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'White Titanium',
          hex: '#F2F1ED',
          imageFile: 'white-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-whitetitanium?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black Titanium',
          hex: '#3C3B3A',
          imageFile: 'black-titanium.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-pro-finish-select-202309-6-1inch-blacktitanium?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.1 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A17 Pro (3nm)',
        ram: '8GB',
        battery: '3274 mAh',
        camera: '48MP asosiy + 12MP ultra-keng + 12MP 3x telephoto',
        charging: 'USB-C (USB 3), 27W simli, 15W MagSafe',
        os: 'iOS 17',
      },
      images: [
        'natural-titanium.png',
        'blue-titanium.png',
        'white-titanium.png',
        'black-titanium.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 15',
      model: 'iPhone 15 Plus',
      modelCode: 'iphone-15-plus',
      releaseYear: 2023,
      status: 'available',
      colors: [
        {
          name: 'Blue',
          hex: '#D2DBE1',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-blue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#F2D3D8',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-pink?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Yellow',
          hex: '#F7E7A9',
          imageFile: 'yellow.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-yellow?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Green',
          hex: '#CAD7C7',
          imageFile: 'green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-green?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black',
          hex: '#35393B',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-7inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.7 dyuym Super Retina XDR OLED, Dynamic Island',
        processor: 'Apple A16 Bionic (4nm)',
        ram: '6GB',
        battery: '4383 mAh',
        camera: '48MP asosiy + 12MP ultra-keng',
        charging: 'USB-C, 20W simli, 15W MagSafe',
        os: 'iOS 17',
      },
      images: ['blue.png', 'pink.png', 'yellow.png', 'green.png', 'black.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 15',
      model: 'iPhone 15',
      modelCode: 'iphone-15',
      releaseYear: 2023,
      status: 'available',
      colors: [
        {
          name: 'Blue',
          hex: '#D2DBE1',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-blue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#F2D3D8',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-pink?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Yellow',
          hex: '#F7E7A9',
          imageFile: 'yellow.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-yellow?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Green',
          hex: '#CAD7C7',
          imageFile: 'green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-green?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Black',
          hex: '#35393B',
          imageFile: 'black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-15-finish-select-202309-6-1inch-black?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.1 dyuym Super Retina XDR OLED, Dynamic Island',
        processor: 'Apple A16 Bionic (4nm)',
        ram: '6GB',
        battery: '3349 mAh',
        camera: '48MP asosiy + 12MP ultra-keng',
        charging: 'USB-C, 20W simli, 15W MagSafe',
        os: 'iOS 17',
      },
      images: ['blue.png', 'pink.png', 'yellow.png', 'green.png', 'black.png'],
    },

    // -------------------------------------------------------------------------
    // iPhone 14 Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 14',
      model: 'iPhone 14 Pro Max',
      modelCode: 'iphone-14-pro-max',
      releaseYear: 2022,
      status: 'available',
      colors: [
        {
          name: 'Deep Purple',
          hex: '#4F4356',
          imageFile: 'deep-purple.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-deeppurple?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Gold',
          hex: '#F4E8CE',
          imageFile: 'gold.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-gold?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#F0ECE8',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Space Black',
          hex: '#3B3A39',
          imageFile: 'space-black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch-spaceblack?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.7 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A16 Bionic (4nm)',
        ram: '6GB',
        battery: '4323 mAh',
        camera: '48MP asosiy + 12MP ultra-keng + 12MP 3x telephoto',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 16',
      },
      images: ['deep-purple.png', 'gold.png', 'silver.png', 'space-black.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 14',
      model: 'iPhone 14 Pro',
      modelCode: 'iphone-14-pro',
      releaseYear: 2022,
      status: 'available',
      colors: [
        {
          name: 'Deep Purple',
          hex: '#4F4356',
          imageFile: 'deep-purple.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-deeppurple?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Gold',
          hex: '#F4E8CE',
          imageFile: 'gold.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-gold?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#F0ECE8',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-silver?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Space Black',
          hex: '#3B3A39',
          imageFile: 'space-black.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-1inch-spaceblack?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.1 dyuym Super Retina XDR OLED, 120Hz ProMotion, Dynamic Island',
        processor: 'Apple A16 Bionic (4nm)',
        ram: '6GB',
        battery: '3200 mAh',
        camera: '48MP asosiy + 12MP ultra-keng + 12MP 3x telephoto',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 16',
      },
      images: ['deep-purple.png', 'gold.png', 'silver.png', 'space-black.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 14',
      model: 'iPhone 14 Plus',
      modelCode: 'iphone-14-plus',
      releaseYear: 2022,
      status: 'available',
      colors: [
        {
          name: 'Blue',
          hex: '#A0B4C7',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-blue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Purple',
          hex: '#E6E0F1',
          imageFile: 'purple.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-purple?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Midnight',
          hex: '#232A31',
          imageFile: 'midnight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-midnight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Starlight',
          hex: '#FAF6F2',
          imageFile: 'starlight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-7inch-starlight?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.7 dyuym Super Retina XDR OLED, 60Hz',
        processor: 'Apple A15 Bionic (5-core GPU)',
        ram: '6GB',
        battery: '4325 mAh',
        camera: '12MP asosiy + 12MP ultra-keng',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 16',
      },
      images: ['blue.png', 'purple.png', 'midnight.png', 'starlight.png'],
    },
    {
      brand: 'Apple',
      series: 'iPhone 14',
      model: 'iPhone 14',
      modelCode: 'iphone-14',
      releaseYear: 2022,
      status: 'available',
      colors: [
        {
          name: 'Blue',
          hex: '#A0B4C7',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-blue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Purple',
          hex: '#E6E0F1',
          imageFile: 'purple.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-purple?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Midnight',
          hex: '#232A31',
          imageFile: 'midnight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-midnight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Starlight',
          hex: '#FAF6F2',
          imageFile: 'starlight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-starlight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Product Red',
          hex: '#B81E29',
          imageFile: 'product-red.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-product-red?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Yellow',
          hex: '#F7E7A9',
          imageFile: 'yellow.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-14-finish-select-202209-6-1inch-yellow?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.1 dyuym Super Retina XDR OLED, 60Hz',
        processor: 'Apple A15 Bionic (5-core GPU)',
        ram: '6GB',
        battery: '3279 mAh',
        camera: '12MP asosiy + 12MP ultra-keng',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 16',
      },
      images: [
        'blue.png',
        'purple.png',
        'midnight.png',
        'starlight.png',
        'product-red.png',
        'yellow.png',
      ],
    },

    // -------------------------------------------------------------------------
    // iPhone 13 Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone 13',
      model: 'iPhone 13 Pro Max',
      modelCode: 'iphone-13-pro-max',
      releaseYear: 2021,
      status: 'available',
      colors: [
        {
          name: 'Sierra Blue',
          hex: '#9BB5CE',
          imageFile: 'sierra-blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-blue-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Graphite',
          hex: '#52514D',
          imageFile: 'graphite.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-graphite-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Gold',
          hex: '#F4E8CE',
          imageFile: 'gold.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-gold-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#F0ECE8',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-silver-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Alpine Green',
          hex: '#505E4C',
          imageFile: 'alpine-green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-max-green-select?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.7 dyuym Super Retina XDR OLED, 120Hz ProMotion, Klassik cho‘ntak (notch)',
        processor: 'Apple A15 Bionic (5-core GPU)',
        ram: '6GB',
        battery: '4352 mAh',
        camera: '12MP asosiy + 12MP ultra-keng + 12MP 3x telephoto',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 15',
      },
      images: [
        'sierra-blue.png',
        'graphite.png',
        'gold.png',
        'silver.png',
        'alpine-green.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 13',
      model: 'iPhone 13 Pro',
      modelCode: 'iphone-13-pro',
      releaseYear: 2021,
      status: 'available',
      colors: [
        {
          name: 'Sierra Blue',
          hex: '#9BB5CE',
          imageFile: 'sierra-blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-blue-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Graphite',
          hex: '#52514D',
          imageFile: 'graphite.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-graphite-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Gold',
          hex: '#F4E8CE',
          imageFile: 'gold.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-gold-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Silver',
          hex: '#F0ECE8',
          imageFile: 'silver.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-silver-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Alpine Green',
          hex: '#505E4C',
          imageFile: 'alpine-green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-pro-green-select?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB', '1TB'],
      specs: {
        screenSize:
          '6.1 dyuym Super Retina XDR OLED, 120Hz ProMotion, Klassik cho‘ntak (notch)',
        processor: 'Apple A15 Bionic (5-core GPU)',
        ram: '6GB',
        battery: '3095 mAh',
        camera: '12MP asosiy + 12MP ultra-keng + 12MP 3x telephoto',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 15',
      },
      images: [
        'sierra-blue.png',
        'graphite.png',
        'gold.png',
        'silver.png',
        'alpine-green.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 13',
      model: 'iPhone 13',
      modelCode: 'iphone-13',
      releaseYear: 2021,
      status: 'available',
      colors: [
        {
          name: 'Midnight',
          hex: '#232A31',
          imageFile: 'midnight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-midnight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Starlight',
          hex: '#FAF6F2',
          imageFile: 'starlight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-starlight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#F9DFDC',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-pink?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Blue',
          hex: '#276787',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-blue?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Green',
          hex: '#3B4E3E',
          imageFile: 'green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-green?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Product Red',
          hex: '#B81E29',
          imageFile: 'product-red.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-finish-select-202207-product-red?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '6.1 dyuym Super Retina XDR OLED, Klassik cho‘ntak (notch)',
        processor: 'Apple A15 Bionic (4-core GPU)',
        ram: '4GB',
        battery: '3227 mAh',
        camera: '12MP keng + 12MP ultra-keng',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 15',
      },
      images: [
        'midnight.png',
        'starlight.png',
        'pink.png',
        'blue.png',
        'green.png',
        'product-red.png',
      ],
    },
    {
      brand: 'Apple',
      series: 'iPhone 13',
      model: 'iPhone 13 mini',
      modelCode: 'iphone-13-mini',
      releaseYear: 2021,
      status: 'available',
      colors: [
        {
          name: 'Midnight',
          hex: '#232A31',
          imageFile: 'midnight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-midnight-select-2021?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Starlight',
          hex: '#FAF6F2',
          imageFile: 'starlight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-starlight-select-2021?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Pink',
          hex: '#F9DFDC',
          imageFile: 'pink.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-pink-select-2021?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Blue',
          hex: '#276787',
          imageFile: 'blue.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-blue-select-2021?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Green',
          hex: '#3B4E3E',
          imageFile: 'green.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-green-select?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Product Red',
          hex: '#B81E29',
          imageFile: 'product-red.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-13-mini-product-red-select-2021?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['128GB', '256GB', '512GB'],
      specs: {
        screenSize: '5.4 dyuym Super Retina XDR OLED, Ixcham korpus',
        processor: 'Apple A15 Bionic (4-core GPU)',
        ram: '4GB',
        battery: '2406 mAh',
        camera: '12MP keng + 12MP ultra-keng',
        charging: 'Lightning, 20W simli, 15W MagSafe',
        os: 'iOS 15',
      },
      images: [
        'midnight.png',
        'starlight.png',
        'pink.png',
        'blue.png',
        'green.png',
        'product-red.png',
      ],
    },

    // -------------------------------------------------------------------------
    // iPhone SE Series
    // -------------------------------------------------------------------------
    {
      brand: 'Apple',
      series: 'iPhone SE',
      model: 'iPhone SE (3-avlod)',
      modelCode: 'iphone-se-3rd-gen',
      releaseYear: 2022,
      status: 'available',
      colors: [
        {
          name: 'Midnight',
          hex: '#1F2022',
          imageFile: 'midnight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-se-finish-select-202207-midnight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Starlight',
          hex: '#F2F1EC',
          imageFile: 'starlight.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-se-finish-select-202207-starlight?wid=940&hei=1112&fmt=png-alpha',
        },
        {
          name: 'Product Red',
          hex: '#B81E29',
          imageFile: 'product-red.png',
          imageUrl:
            'https://store.storeimages.cdn-apple.com/4982/as-images.apple.com/is/iphone-se-finish-select-202207-product-red?wid=940&hei=1112&fmt=png-alpha',
        },
      ],
      storageOptions: ['64GB', '128GB', '256GB'],
      specs: {
        screenSize: '4.7 dyuym Retina HD displey, Touch ID Home tugmasi',
        processor: 'Apple A15 Bionic',
        ram: '4GB',
        battery: '2018 mAh',
        camera: '12MP keng burchakli kamera',
        charging: 'Lightning, 20W simli, Qi simsiz',
        os: 'iOS 15',
      },
      images: ['midnight.png', 'starlight.png', 'product-red.png'],
    },
  ];

  return models;
}
