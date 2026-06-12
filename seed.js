const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./backend/config/db');

// Load models
const User = require('./backend/models/User');
const Category = require('./backend/models/Category');
const Product = require('./backend/models/Product');
const Review = require('./backend/models/Review');
const Coupon = require('./backend/models/Coupon');
const Wishlist = require('./backend/models/Wishlist');
const Order = require('./backend/models/Order');

// Load environment variables
dotenv.config();

// Curated Unsplash images for categories and products
const images = {
  makeup: [
    '/images/products/makeup1.jpg',
    '/images/products/makeup2.jpg',
    '/images/products/makeup3.jpg',
    '/images/products/makeup4.jpg',
    '/images/products/makeup5.jpg'
  ],
  skincare: [
    '/images/products/skincare1.jpg',
    '/images/products/skincare2.jpg',
    '/images/products/skincare3.jpg',
    '/images/products/skincare4.jpg',
    '/images/products/skincare5.jpg'
  ],
  haircare: [
    '/images/products/haircare1.jpg',
    '/images/products/haircare2.jpg',
    '/images/products/haircare3.jpg',
    '/images/products/haircare4.jpg',
    '/images/products/haircare5.jpg'
  ],
  fragrance: [
    '/images/products/fragrance1.jpg',
    '/images/products/fragrance2.jpg',
    '/images/products/fragrance3.jpg',
    '/images/products/fragrance4.jpg',
    '/images/products/fragrance5.jpg'
  ],
  bathbody: [
    '/images/products/bathbody1.jpg',
    '/images/products/bathbody2.jpg',
    '/images/products/bathbody3.jpg',
    '/images/products/bathbody4.jpg',
    '/images/products/bathbody5.jpg'
  ],
};

// 100 Products split equally (20 per category)
const rawProducts = {
  makeup: [
    { name: "Velvet Rose Liquid Lipstick", price: 950, discount: 15, tags: ["matte", "long-lasting", "pigmented"], desc: "Achieve the ultimate luxury lip with our rich, velvet matte finish liquid lipstick. Enriched with jojoba oil to keep lips soft and hydrated all day." },
    { name: "Silk Glow Luminous Foundation", price: 1850, discount: 10, tags: ["glow", "dewy", "hydration"], desc: "A breathable, light-to-medium coverage foundation that mimics the natural luminosity of real skin. Infused with hyaluronic acid." },
    { name: "Hydra-Matte Lip Crayon", price: 799, discount: 20, tags: ["matte", "precision", "vegan"], desc: "Easy-to-apply lip crayon that gives a precision matte line and high-density color payoff. Vegan-friendly and smudge-proof." },
    { name: "Starlight Eyeshadow Palette", price: 2400, discount: 15, tags: ["metallic", "shimmer", "luxury"], desc: "12 celestial shades featuring buttery mattes, intense shimmers, and metallic duochromes. Perfect for luxury day-to-night looks." },
    { name: "Precision HD Waterproof Eyeliner", price: 650, discount: 5, tags: ["waterproof", "matte", "black"], desc: "An ultra-fine felt tip liquid liner that glides on smoothly, delivering intense black pigment with a 24-hour waterproof hold." },
    { name: "Infinite Lash Volumizing Mascara", price: 899, discount: 12, tags: ["volume", "length", "lash-lift"], desc: "Instant high-definition volume and dramatic length. Formulated with olive wax and provitamin B5 to strengthen lashes." },
    { name: "Radiant Cream Blush", price: 799, discount: 10, tags: ["cream", "dewy", "flush"], desc: "A buildable cream blush that melts effortlessly into the skin for a natural, flushed-from-within glow. Non-comedogenic." },
    { name: "Satin Soft Translucent Powder", price: 1100, discount: 18, tags: ["setting", "matte", "anti-shine"], desc: "Micro-milled translucent setting powder that locks in makeup, blurs pores, and controls shine without flashback." },
    { name: "Golden Hour Powder Highlighter", price: 1250, discount: 15, tags: ["highlighter", "shimmer", "glow"], desc: "Captures the beauty of sunset lighting with a silky-soft powder formula. Gives a seamless, high-impact golden finish." },
    { name: "Matte Setting Mist", price: 999, discount: 10, tags: ["setting-spray", "matte", "refreshing"], desc: "A weightless setting spray that locks makeup in place for 16 hours. Infused with green tea extract for oil control." },
    { name: "Tinted Brow Definer", price: 599, discount: 8, tags: ["brows", "waterproof", "natural"], desc: "A dual-ended brow pencil and gel that shapes, defines, and fills in sparse areas with natural-looking hair strokes." },
    { name: "Prime & Protect Velvet Primer", price: 1150, discount: 25, tags: ["primer", "poreless", "matte"], desc: "A velvety, smoothing face primer that minimizes the appearance of pores and fine lines, preparing the skin for seamless makeup." },
    { name: "Color Correcting Palette", price: 899, discount: 10, tags: ["correct", "conceal", "creamy"], desc: "Six creamy, color-correcting shades to neutralize redness, dark circles, and dullness. Suitable for all skin tones." },
    { name: "Plush Lip Oil", price: 699, discount: 15, tags: ["lip-oil", "glossy", "shine"], desc: "A hydrating, high-shine lip oil that combines the shine of a gloss with the soothing comfort of an oil. Non-sticky." },
    { name: "Metallic Liquid Eye Shimmer", price: 750, discount: 12, tags: ["liquid-eyeshadow", "glitter", "metallic"], desc: "A water-infused liquid eyeshadow that packs a punch of high-impact glitter and metallic shine in just one swipe." },
    { name: "Jelly Highlight Gel", price: 850, discount: 10, tags: ["gel-highlighter", "glossy", "face-and-body"], desc: "A bouncy jelly gel formula that applies like a refreshing splash of hydration and dries to a luminous glass-skin finish." },
    { name: "Velvet Cream Concealer", price: 950, discount: 15, tags: ["concealer", "full-coverage", "creamy"], desc: "A crease-proof, full-coverage liquid concealer that brightens dark circles and conceals blemishes with a natural finish." },
    { name: "Nail Lacquer High Shine", price: 399, discount: 20, tags: ["nails", "glossy", "chip-resistant"], desc: "A luxury gel-like nail polish with a high-shine finish. Long-lasting, chip-resistant, and free of toxic chemicals." },
    { name: "Ultra-Precise Lip Liner", price: 499, discount: 5, tags: ["lip-liner", "matte", "definition"], desc: "A highly pigmented, creamy lip liner pencil that glides on smoothly to define, reshape, and prevent color bleeding." },
    { name: "Sculpting Contour Powder", price: 1050, discount: 15, tags: ["contour", "matte", "sculpt"], desc: "A cool-toned matte contour powder designed to create natural-looking shadows that sculpt and define your facial features." }
  ],
  skincare: [
    { name: "Hydra-Boost Hyaluronic Acid Serum", price: 1499, discount: 15, tags: ["serum", "hydrating", "plumping"], desc: "A multi-molecular hyaluronic acid serum that delivers deep, multi-layer hydration for bouncy, plumped skin." },
    { name: "24K Gold Youth Elixir Oil", price: 2499, discount: 20, tags: ["oil", "anti-aging", "luxury"], desc: "An opulent face oil infused with pure 24K gold flakes, rosehip oil, and vitamin E to restore skin elasticity and radiance." },
    { name: "Vitamin C Radiance Booster", price: 1699, discount: 10, tags: ["vit-c", "brightening", "dark-spots"], desc: "Formulated with 15% pure L-ascorbic acid and ferulic acid to brighten dull skin, fade dark spots, and defend against aging." },
    { name: "Velvet Night Recovery Cream", price: 1950, discount: 12, tags: ["night-cream", "repair", "nourishing"], desc: "A rich, velvety overnight moisturizer that repairs the skin barrier, locks in moisture, and reduces appearance of wrinkles." },
    { name: "Matcha Green Tea Cleanser", price: 899, discount: 10, tags: ["cleanser", "gentle", "antioxidant"], desc: "A low-pH, foaming gel cleanser infused with Japanese matcha and hemp seed oil. Deeply cleanses without stripping skin." },
    { name: "Rose Water Balance Toner", price: 799, discount: 5, tags: ["toner", "rose", "soothing"], desc: "A hydrating, alcohol-free toner made with 100% natural Bulgarian rose water. Soothes irritation and refines pores." },
    { name: "AHA/BHA Exfoliating Glow Liquid", price: 1399, discount: 15, tags: ["exfoliator", "glow", "peel"], desc: "A gentle daily liquid exfoliant containing glycolic acid and salicylic acid to sweep away dead skin cells and clear pores." },
    { name: "Bakuchiol Retinol Alternative Serum", price: 1799, discount: 18, tags: ["bakuchiol", "anti-aging", "gentle"], desc: "A natural, plant-based retinol alternative that targets fine lines and uneven texture without the irritation or purging." },
    { name: "Ceramide Barrier Repair Cream", price: 1590, discount: 15, tags: ["barrier-repair", "ceramide", "soothing"], desc: "A deeply comforting cream packed with 3 essential ceramides and cholesterol to repair dry, compromised, or sensitized skin." },
    { name: "Bright Eyes Peptide Gel", price: 1199, discount: 10, tags: ["eye-gel", "peptides", "dark-circles"], desc: "A cooling gel formula targeting puffiness, dark circles, and fine lines around the delicate eye area using caffeine and peptides." },
    { name: "Cucumber Soothing Sheet Mask", price: 199, discount: 15, tags: ["mask", "cucumber", "cooling"], desc: "A biocellulose sheet mask saturated with cucumber extract and aloe vera to instantly calm and cool irritated, dry skin." },
    { name: "Whipped Shea Face Butter", price: 1299, discount: 20, tags: ["moisturizer", "shea-butter", "dry-skin"], desc: "An ultra-nourishing whipped face cream ideal for dry, flaky skin. Restores lipids and protects against cold weather." },
    { name: "Mineral Shield SPF 50 Sunscreen", price: 1100, discount: 10, tags: ["sunscreen", "spf-50", "no-white-cast"], desc: "A lightweight, physical mineral sunscreen providing broad-spectrum UVA/UVB protection with a matte, non-greasy finish." },
    { name: "Clarifying Tea Tree Spot Oil", price: 699, discount: 5, tags: ["acne", "spot-treatment", "tea-tree"], desc: "A targeted antibacterial spot treatment containing pure Australian tea tree oil to quickly dry out active blemishes." },
    { name: "Collagen Boosting Peptide Ampoules", price: 2199, discount: 25, tags: ["peptides", "collagen", "firming"], desc: "A 7-day intensive treatment program to boost collagen production, firm sagging skin, and restore youthfulness." },
    { name: "Nourishing Avocado Sleep Mask", price: 1450, discount: 15, tags: ["sleep-mask", "avocado", "overnight"], desc: "An overnight cream mask rich in avocado fruit lipids and honey. Wake up to intensely soft, plump, and radiant skin." },
    { name: "Ginseng Energizing Mist", price: 890, discount: 12, tags: ["face-mist", "ginseng", "energizing"], desc: "A revitalizing face mist formulated with red ginseng extract to instantly wake up tired, dull skin with a burst of moisture." },
    { name: "Ultra-Mild Oat Milk Cleanser", price: 950, discount: 10, tags: ["cleanser", "sensitive-skin", "soothing"], desc: "A non-foaming, creamy milk cleanser designed for extremely sensitive or eczema-prone skin. Infused with colloidal oat." },
    { name: "Squalane Facial Oil", price: 1299, discount: 15, tags: ["oil", "squalane", "lightweight"], desc: "100% plant-derived squalane oil that mimics skin's natural sebum. Provides lightweight, non-comedogenic hydration." },
    { name: "Daily Gentle Exfoliating Scrub", price: 799, discount: 10, tags: ["scrub", "jojoba-beads", "gentle"], desc: "A gentle physical exfoliant using biodegradable jojoba wax beads to polish skin texture without causing micro-tears." }
  ],
  haircare: [
    { name: "Argan Oil Therapy Shampoo", price: 899, discount: 10, tags: ["shampoo", "argan-oil", "damaged-hair"], desc: "Restore shine and softness to dry, damaged hair with our gold standard shampoo enriched with cold-pressed Moroccan argan oil." },
    { name: "Macadamia Moisture Conditioner", price: 950, discount: 12, tags: ["conditioner", "moisturizing", "frizz-control"], desc: "A deeply detangling conditioner infused with macadamia nut oil. Locks in moisture and tames flyaways." },
    { name: "Royal Honey & Silk Hair Mask", price: 1399, discount: 15, tags: ["hair-mask", "deep-conditioning", "shine"], desc: "An intensive weekly treatment that repairs split ends and deeply conditions hair strands with organic honey and silk proteins." },
    { name: "Keratin Smooth Infusion Serum", price: 1199, discount: 10, tags: ["serum", "keratin", "heat-protection"], desc: "A lightweight smoothing hair serum that coats hair fibers with liquid keratin to block humidity and add brilliant shine." },
    { name: "Nourishing Rosemary Hair Oil", price: 799, discount: 5, tags: ["hair-oil", "rosemary", "hair-growth"], desc: "A concentrated scalp and hair oil containing rosemary, mint, and castor oil. Strengthens hair roots and stimulates growth." },
    { name: "Coconut Milk Volume Spray", price: 699, discount: 15, tags: ["volume", "coconut", "fine-hair"], desc: "A weightless mist that lifts fine, flat hair from the roots, adding natural body and a soft, tropical coconut aroma." },
    { name: "Biotin Fortifying Scalp Tonic", price: 1250, discount: 18, tags: ["scalp-tonic", "biotin", "thinning-hair"], desc: "A daily leave-in tonic for thinning hair. Formulated with biotin, niacinamide, and peptides to encourage thicker, healthier growth." },
    { name: "Aloe Soothing Anti-Dandruff Shampoo", price: 850, discount: 10, tags: ["shampoo", "anti-dandruff", "soothing"], desc: "A sulfate-free scalp clarifying shampoo containing zinc pyrithione and organic aloe vera to eliminate flakes and soothe itchiness." },
    { name: "Shea Butter Leave-In Conditioner", price: 999, discount: 15, tags: ["leave-in", "shea-butter", "curly-hair"], desc: "A rich, curl-defining leave-in conditioner that moisturizes coarse, curly, or coily hair types. Prevents breakage." },
    { name: "Sea Salt Texturizing Spray", price: 650, discount: 10, tags: ["texture", "sea-salt", "beachy-waves"], desc: "Get effortless, wind-swept beachy waves. Adds light hold, matte texture, and volume without drying out your hair." },
    { name: "Herbal Scalp Revitalizing Treatment", price: 1499, discount: 20, tags: ["scalp-treatment", "herbal", "detox"], desc: "A weekly scalp detox treatment powered by tea tree, ginger, and clay to absorb oil, remove product buildup, and refresh." },
    { name: "Silk Protein Blowout Cream", price: 1100, discount: 12, tags: ["blowout-cream", "heat-protect", "smooth"], desc: "A heat-activated styling cream that cuts blow-dry time in half while creating sleek, salon-smooth results. Protects up to 230°C." },
    { name: "Marula Miracle Hair Oil", price: 1599, discount: 15, tags: ["hair-oil", "marula", "luxury"], desc: "An ultra-premium, lightweight hair oil that absorbs instantly to seal split ends, eliminate frizz, and add mirror-like shine." },
    { name: "Apple Cider Vinegar Clarifying Rinse", price: 890, discount: 10, tags: ["hair-rinse", "acv", "clarifying"], desc: "A low-foaming liquid rinse that uses raw ACV to rebalance scalp pH, seal the hair cuticle, and remove hard water mineral buildup." },
    { name: "Caffeine Hair Density Serum", price: 1899, discount: 25, tags: ["serum", "caffeine", "hair-growth"], desc: "An advanced scalp serum clinical formula containing 5% caffeine and redensyl to visibly increase hair density in 3 months." },
    { name: "Lavender Sleep Hair Treatment", price: 1299, discount: 15, tags: ["night-treatment", "lavender", "aromatherapy"], desc: "An overnight hair treatment that repairs dry strands while you sleep, releasing a relaxing lavender scent to support deep sleep." },
    { name: "Castor Oil Eyelash & Brow Elixir", price: 499, discount: 5, tags: ["lash-elixir", "castor-oil", "natural"], desc: "100% organic, cold-pressed castor oil elixir with fine applicator brushes. Promotes thicker eyelashes and bolder eyebrows." },
    { name: "Heat Protect Defending Shield", price: 799, discount: 10, tags: ["heat-protect", "mist", "damage-control"], desc: "A weightless thermal defense spray that shields hair from heat styling damage caused by flat irons and curling wands." },
    { name: "Moroccan Argan Scalp Scrub", price: 1150, discount: 15, tags: ["scalp-scrub", "argan", "exfoliator"], desc: "A detoxifying sea salt scalp scrub that exfoliates buildup while nourishing dry scalps with organic argan oil." },
    { name: "Volume Boost Thickening Mousse", price: 850, discount: 12, tags: ["mousse", "volume", "thickening"], desc: "A whipped styling mousse that expands hair fibers to provide long-lasting, flexible volume and bounce without stiffness." }
  ],
  fragrance: [
    { name: "Majestic Amber Eau De Parfum", price: 4999, discount: 10, tags: ["perfume", "amber", "oriental"], desc: "An opulent, warm oriental fragrance combining sweet amber, rich vanilla, and spicy cardamom. A long-lasting unisex scent." },
    { name: "Velvet Oud Intense Perfume", price: 5999, discount: 15, tags: ["perfume", "oud", "woody"], desc: "A dark, mysterious fragrance centered around rare Cambodian oud, smoky leather, and sweet damask rose. Highly luxury scent." },
    { name: "Jasmine & Wild Rose Cologne", price: 3499, discount: 10, tags: ["cologne", "floral", "rose"], desc: "A fresh, romantic floral cologne capturing the essence of wild English roses and night-blooming jasmine blossoms." },
    { name: "Citrus Infusion Fresh Body Mist", price: 1299, discount: 20, tags: ["body-mist", "citrus", "fresh"], desc: "A light, refreshing body mist bursting with notes of pink grapefruit, sweet mandarin, and fresh bergamot." },
    { name: "Sweet Vanilla & Sandalwood Scent", price: 3999, discount: 12, tags: ["perfume", "vanilla", "sandalwood"], desc: "A warm, comforting gourmand fragrance. Rich madagascar vanilla bean blended with creamy, earthy Mysore sandalwood." },
    { name: "Lavender Dream Pillow Mist", price: 1100, discount: 5, tags: ["pillow-mist", "lavender", "calming"], desc: "A soothing aromatherapy mist for pillows and linens. Crafted with pure French lavender oil to induce peaceful sleep." },
    { name: "Musk Royale Perfume Oil", price: 2999, discount: 15, tags: ["perfume-oil", "musk", "long-lasting"], desc: "An alcohol-free, highly concentrated perfume oil that melts into the skin, releasing a clean, warm, sensual white musk aroma." },
    { name: "Neroli Blossom Eau De Toilette", price: 3200, discount: 10, tags: ["edt", "neroli", "citrus"], desc: "A sun-drenched Mediterranean fragrance featuring sweet neroli, orange blossom, and a base of clean white musk." },
    { name: "Spiced Patchouli Warm Parfum", price: 4500, discount: 18, tags: ["parfum", "patchouli", "spicy"], desc: "A bold, earthy fragrance with elements of aged patchouli, spicy black pepper, and warm cinnamon bark." },
    { name: "White Tea & Sage Cologne", price: 2899, discount: 10, tags: ["cologne", "clean", "fresh"], desc: "An elegant, minimalist scent blending calming white tea leaves, earthy clary sage, and a touch of clean cucumber." },
    { name: "Peony Blush Floral Scent", price: 3850, discount: 15, tags: ["perfume", "floral", "peony"], desc: "A charming, flirtatious fragrance featuring blooming pink peonies, red apple top notes, and a base of soft suede." },
    { name: "Midnight Orchid Exotic Parfum", price: 5200, discount: 20, tags: ["parfum", "orchid", "exotic"], desc: "A dramatic, seductive scent built around rare black orchids, dark plum, and rich dark chocolate. Absolutely luxurious." },
    { name: "Cedarwood & Vetiver Cologne", price: 3499, discount: 12, tags: ["cologne", "woody", "vetiver"], desc: "A clean, masculine-leaning woody scent blending Atlas cedarwood, smokey vetiver, and crisp green pine needles." },
    { name: "Bergamot Splash Refreshing Mist", price: 1399, discount: 15, tags: ["mist", "bergamot", "fresh"], desc: "An invigorating daily fragrance mist featuring cold-pressed Italian bergamot, lime zest, and green tea." },
    { name: "Golden Honey Eau De Parfum", price: 4299, discount: 10, tags: ["perfume", "honey", "sweet"], desc: "A sweet, intoxicating fragrance reminiscent of golden honeycomb, warm beeswax, and soft amber vanilla." },
    { name: "Coconut Beach Summer Mist", price: 1199, discount: 8, tags: ["body-mist", "coconut", "summer"], desc: "A carefree, summery fragrance spray with notes of toasted coconut, solar flowers, and warm ocean breeze." },
    { name: "Forest Pine Woods Eau De Toilette", price: 3100, discount: 15, tags: ["edt", "forest", "woody"], desc: "Bring the outdoors in. A refreshing fragrance combining Siberian pine, spruce needles, and damp forest moss." },
    { name: "Cherry Blossom Romantic Perfume", price: 3800, discount: 12, tags: ["perfume", "cherry-blossom", "floral"], desc: "A poetic, delicate floral fragrance capturing the brief, beautiful springtime bloom of Japanese cherry blossoms." },
    { name: "Velvet Rose & Vanilla Oil", price: 2799, discount: 10, tags: ["perfume-oil", "rose", "vanilla"], desc: "A roll-on perfume oil combining the timeless elegance of damask rose with warm, creamy vanilla bean." },
    { name: "Ocean Breeze Fresh Eau De Parfum", price: 4100, discount: 15, tags: ["perfume", "fresh", "aquatic"], desc: "A clean, aquatic fragrance that captures the mineral saltiness of sea air, water lily, and white driftwood." }
  ],
  bathbody: [
    { name: "French Lavender Soothing Body Wash", price: 699, discount: 15, tags: ["body-wash", "lavender", "relaxing"], desc: "A gentle, sulfate-free body wash infused with organic French lavender oil. Relaxes the senses and hydrates the skin." },
    { name: "Velvet Rose Moisturizing Lotion", price: 850, discount: 10, tags: ["body-lotion", "rose", "moisturizer"], desc: "A lightweight, fast-absorbing body lotion that leaves skin smelling of fresh roses and feeling silky smooth." },
    { name: "Exfoliating Himalayan Pink Salt Scrub", price: 899, discount: 12, tags: ["scrub", "exfoliator", "himalayan-salt"], desc: "Reveal radiant skin with this mineral-rich pink salt scrub. Gently polishes away dead skin cells and stimulates circulation." },
    { name: "Nourishing Shea Butter Bath Bomb", price: 299, discount: 5, tags: ["bath-bomb", "shea-butter", "relaxing"], desc: "Turn your bath into a luxury spa experience. Releases nourishing shea butter and a soothing vanilla scent." },
    { name: "Eucalyptus & Mint Cooling Gel", price: 750, discount: 15, tags: ["shower-gel", "cooling", "mint"], desc: "An invigorating cooling body wash that awakens the body and mind. Infused with pure eucalyptus and peppermint oils." },
    { name: "Almond Milk Comforting Body Butter", price: 1199, discount: 20, tags: ["body-butter", "almond", "dry-skin"], desc: "An ultra-rich body butter crafted for extremely dry skin. Provides 48-hour moisture with organic sweet almond oil." },
    { name: "Whipped Coconut Body Cream", price: 999, discount: 15, tags: ["body-cream", "coconut", "whipped"], desc: "A light-as-air whipped body cream that melts into skin, providing intense moisture and a tropical coconut scent." },
    { name: "Jasmine Infused Bath & Shower Oil", price: 1450, discount: 10, tags: ["bath-oil", "jasmine", "luxury"], desc: "A luxurious foaming shower oil that transforms into a milky cleanser upon contact with water. Perfumed with jasmine." },
    { name: "Tea Tree Clarifying Soap Bar", price: 250, discount: 5, tags: ["soap", "tea-tree", "clarifying"], desc: "A hand-crafted charcoal soap bar infused with tea tree oil. Deeply cleanses and purifies body skin to prevent acne." },
    { name: "Sweet Orange Energizing Lotion", price: 799, discount: 10, tags: ["body-lotion", "orange", "energizing"], desc: "A refreshing body lotion packed with vitamin C and citrus oils to brighten skin tone and energize your morning." },
    { name: "Hydrating Aloe Vera Gel", price: 399, discount: 8, tags: ["aloe-vera", "soothing", "sunburn"], desc: "100% pure organic aloe vera gel. Perfect for soothing sunburns, insect bites, or general skin dryness. Multi-use." },
    { name: "Organic Beeswax Foot Cream", price: 599, discount: 15, tags: ["foot-cream", "beeswax", "cracked-heels"], desc: "A thick, healing foot balm made with beeswax, peppermint, and tea tree oil to heal dry, cracked heels overnight." },
    { name: "Hand & Cuticle Recovery Cream", price: 499, discount: 10, tags: ["hand-cream", "cuticles", "shea-butter"], desc: "A highly concentrated, non-greasy hand cream that repairs dry, cracked hands and strengthens cuticles." },
    { name: "Vitamin E Nourishing Body Oil", price: 1100, discount: 15, tags: ["body-oil", "vit-e", "stretch-marks"], desc: "A rich body oil packed with vitamin E, sweet almond, and jojoba oils. Restores skin elasticity and reduces stretch marks." },
    { name: "White Musk Soft Body Mist", price: 950, discount: 12, tags: ["body-mist", "musk", "clean"], desc: "A soft, clean everyday body fragrance mist. Features base notes of white musk, cotton flower, and powdery notes." },
    { name: "Rosemary & Mint Foot Scrub", price: 650, discount: 10, tags: ["foot-scrub", "exfoliating", "refreshing"], desc: "A pumice-based foot scrub that buffs away rough calluses while refreshing tired feet with cooling peppermint oil." },
    { name: "Vanilla Bean Soothing Soap", price: 299, discount: 5, tags: ["soap", "vanilla", "gentle"], desc: "A gentle, moisturizing glycerin soap bar made with real vanilla bean seeds to provide light, natural exfoliation." },
    { name: "Oatmeal & Honey Gentle Body Polish", price: 890, discount: 15, tags: ["body-scrub", "oatmeal", "sensitive-skin"], desc: "A gentle body polishing scrub made with finely ground oatmeal and wild honey. Formulated for sensitive skin." },
    { name: "Cherry Blossom Hand Cream", price: 399, discount: 10, tags: ["hand-cream", "floral", "cherry-blossom"], desc: "Keep hands soft and lightly fragranced on the go with this moisturizing cherry blossom infused hand lotion." },
    { name: "Bath Soaking Mineral Salts", price: 799, discount: 12, tags: ["bath-salts", "epsom-salt", "muscle-relief"], desc: "A blend of Epsom salt, dead sea salt, and chamomile oil to soothe sore muscles, relieve stress, and soften skin." }
  ]
};

// Seed script execution
const runSeeder = async () => {
  try {
    await connectDB();

    console.log('Clearing existing database collections...');
    await User.deleteMany();
    await Category.deleteMany();
    await Product.deleteMany();
    await Review.deleteMany();
    await Coupon.deleteMany();
    await Wishlist.deleteMany();
    await Order.deleteMany();
    console.log('Database cleared!');

    console.log('Creating default users...');
    const adminUser = await User.create({
      name: 'Lumora Admin',
      email: 'admin@lumora.com',
      password: 'admin123',
      phone: '9999999999',
      role: 'admin',
      addresses: [{
        street: 'Lumora Beauty HQ, 101 Gold Tower',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: true
      }]
    });

    const customerUser = await User.create({
      name: 'Sanchita Sen',
      email: 'user@lumora.com',
      password: 'user123',
      phone: '9876543210',
      role: 'user',
      addresses: [{
        street: 'Apt 2B, Sunset Boulevard, Bandra West',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400050',
        country: 'India',
        isDefault: true
      }]
    });
    console.log(`Users created! Admin: admin@lumora.com, Customer: user@lumora.com`);

    console.log('Creating categories...');
    const catData = [
      { name: 'Makeup', slug: 'makeup', description: 'Luxury cosmetic products for face, eyes, lips, and nails.', image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop' },
      { name: 'Skincare', slug: 'skincare', description: 'Serums, cleansers, and moisturizers for premium skin hydration.', image: 'https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=800&auto=format&fit=crop' },
      { name: 'Haircare', slug: 'haircare', description: 'Treatments, oils, and styling solutions for silky, strong hair.', image: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a3ef?q=80&w=800&auto=format&fit=crop' },
      { name: 'Fragrance', slug: 'fragrance', description: 'Exotic perfume oils, Eau de Parfum, and relaxing body sprays.', image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=800&auto=format&fit=crop' },
      { name: 'Bath & Body', slug: 'bath-body', description: 'Nourishing body scrubs, body washes, and hydrating lotions.', image: 'https://images.unsplash.com/photo-1607006342411-9a90327f272a?q=80&w=800&auto=format&fit=crop' }
    ];

    const categoryMap = {};
    for (const c of catData) {
      const createdCat = await Category.create(c);
      categoryMap[c.slug] = createdCat._id;
    }
    console.log('Categories created!');

    console.log('Creating 100 products (20 per category)...');
    const createdProducts = [];
    const categoryKeys = ['makeup', 'skincare', 'haircare', 'fragrance', 'bathbody'];

    for (const key of categoryKeys) {
      const catId = categoryMap[key === 'bathbody' ? 'bath-body' : key];
      const productList = rawProducts[key];
      const imageList = images[key];

      for (let i = 0; i < productList.length; i++) {
        const item = productList[i];

        // Select images cyclically
        const prodImages = [
          imageList[i % imageList.length],
          imageList[(i + 1) % imageList.length],
          imageList[(i + 2) % imageList.length]
        ];

        // Random stocks & ratings
        const stock = Math.floor(Math.random() * 100) + 15; // 15 to 114
        const rating = (Math.random() * 0.9 + 4.0).toFixed(1); // 4.0 to 4.9

        // Flag assignments
        const isBestseller = i < 4; // First 4 are bestsellers
        const isNewArrival = i >= 4 && i < 8; // Next 4 are new arrivals
        const isTrending = i >= 8 && i < 12; // Next 4 are trending

        const product = await Product.create({
          name: item.name,
          slug: `${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          description: item.desc,
          price: item.price,
          discount: item.discount,
          rating: Number(rating),
          numReviews: Math.floor(Math.random() * 45) + 5, // 5 to 49 reviews
          images: prodImages,
          category: catId,
          stock,
          brand: 'Lumora Beauty',
          isBestseller,
          isNewArrival,
          isTrending,
          tags: item.tags
        });

        createdProducts.push(product);
      }
    }
    console.log(`Successfully created ${createdProducts.length} products!`);

    console.log('Populating related and frequently bought together products...');
    for (const prod of createdProducts) {
      // Find other products in the same category
      const sameCategoryProds = createdProducts.filter(
        p => p.category.toString() === prod.category.toString() && p._id.toString() !== prod._id.toString()
      );

      // Select 3 random related products
      const related = [];
      const tempSameCat = [...sameCategoryProds];
      for (let j = 0; j < 3 && tempSameCat.length > 0; j++) {
        const idx = Math.floor(Math.random() * tempSameCat.length);
        related.push(tempSameCat[idx]._id);
        tempSameCat.splice(idx, 1);
      }

      // Select 2 random frequently bought together
      const fbt = [];
      const tempSameCatFbt = [...sameCategoryProds];
      for (let j = 0; j < 2 && tempSameCatFbt.length > 0; j++) {
        const idx = Math.floor(Math.random() * tempSameCatFbt.length);
        fbt.push(tempSameCatFbt[idx]._id);
        tempSameCatFbt.splice(idx, 1);
      }

      prod.relatedProducts = related;
      prod.frequentlyBoughtTogether = fbt;
      await prod.save();
    }
    console.log('Related and frequently bought together products associated!');

    console.log('Creating coupons...');
    const coupons = [
      { code: 'WELCOME10', discountType: 'percentage', discountValue: 10, minCartValue: 500, maxDiscount: 150, expiryDate: new Date('2028-12-31'), isActive: true },
      { code: 'LUMORA20', discountType: 'percentage', discountValue: 20, minCartValue: 2500, maxDiscount: 1000, expiryDate: new Date('2028-12-31'), isActive: true },
      { code: 'FESTIVE15', discountType: 'percentage', discountValue: 15, minCartValue: 1200, maxDiscount: 300, expiryDate: new Date('2028-12-31'), isActive: true },
      { code: 'FREESHIP', discountType: 'flat', discountValue: 100, minCartValue: 1000, expiryDate: new Date('2028-12-31'), isActive: true }
    ];
    await Coupon.create(coupons);
    console.log('Coupons created!');

    console.log('Creating initial customer reviews for bestsellers...');
    const bestsellers = createdProducts.filter(p => p.isBestseller);
    const reviewComments = [
      "Absolutely love this! It feels so premium and works beautifully. Will buy again.",
      "The packaging is gorgeous, and the product itself exceeded my expectations. 5 stars!",
      "Perfect color and texture. Highly recommend it to anyone looking for luxury quality.",
      "Amazing scent and formulation. The rose gold detailing is beautiful.",
      "Highly effective and gentle on my skin. Worth every rupee."
    ];

    for (const bs of bestsellers) {
      // Create 2 reviews per bestseller
      for (let r = 0; r < 2; r++) {
        const rating = Math.floor(Math.random() * 2) + 4; // 4 or 5
        const comment = reviewComments[Math.floor(Math.random() * reviewComments.length)];

        await Review.create({
          user: customerUser._id,
          product: bs._id,
          name: customerUser.name,
          rating,
          comment
        });
      }
    }
    console.log('Initial reviews created!');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error(`Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

runSeeder();
