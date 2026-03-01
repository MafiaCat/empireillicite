const DAY_DURATION = 120000; // 2 minutes = 1 in-game day

// ============ INVENTORY ITEMS ============
const ITEMS_DATABASE = {
    premium_seeds: {
        id: 'premium_seeds',
        name: 'Graines Premium',
        desc: 'Fait pousser instantanément 10 plants actifs dans votre production.',
        icon: '🌟',
        type: 'consumable'
    },
    clean_money: {
        id: 'clean_money',
        name: 'Valise d\'Argent Propre',
        desc: 'Ajoute 5000$ directement sur votre compte.',
        icon: '🧳',
        type: 'consumable'
    }
};
// ============ CONFIGURATION ENTREPOTS ============
const WAREHOUSES = {
    small: {
        name: 'Petit Entrepôt',
        icon: '📦',
        capacity: 500,
        price: 5000,
        description: 'Stockage de 500g supplémentaires'
    },
    medium: {
        name: 'Entrepôt Moyen',
        icon: '🏪',
        capacity: 2000,
        price: 25000,
        description: 'Stockage de 2kg supplémentaires'
    },
    large: {
        name: 'Grand Entrepôt',
        icon: '🏭',
        capacity: 10000,
        price: 150000,
        description: 'Stockage de 10kg supplémentaires'
    },
    mega: {
        name: 'Méga Entrepôt',
        icon: '🏢',
        capacity: 50000,
        price: 1000000,
        description: 'Stockage de 50kg supplémentaires'
    }
};

// Days of the week cycle
const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ============ CONFIGURATION MERCENAIRES ============
const MERCENARIES = [
    { id: 'sbire', name: 'Sbire (Batte)', price: 500, force: 1, icon: '🏏' },
    { id: 'soldat', name: 'Soldat (Glock)', price: 2000, force: 5, icon: '🔫' },
    { id: 'veteran', name: 'Vétéran (AK-47)', price: 8000, force: 25, icon: '💂' },
    { id: 'elite', name: 'Commando (RPG)', price: 50000, force: 150, icon: '🚀' }
];
const ACHIEVEMENTS = [
    // --- FORTUNE (10) ---
    { id: 'money_1', name: 'Premiers Billets', desc: 'Avoir $1,000', category: 'Fortune', threshold: 1000, type: 'cash', points: 10 },
    { id: 'money_2', name: 'Liasse Épaisse', desc: 'Avoir $10,000', category: 'Fortune', threshold: 10000, type: 'cash', points: 20 },
    { id: 'money_3', name: 'Valise Pleine', desc: 'Avoir $50,000', category: 'Fortune', threshold: 50000, type: 'cash', points: 50 },
    { id: 'money_4', name: 'Compte Offshore', desc: 'Avoir $100,000', category: 'Fortune', threshold: 100000, type: 'cash', points: 100 },
    { id: 'money_5', name: 'Blanchiment Pro', desc: 'Avoir $500,000', category: 'Fortune', threshold: 500000, type: 'cash', points: 200 },
    { id: 'money_6', name: 'Millionnaire', desc: 'Avoir $1,000,000', category: 'Fortune', threshold: 1000000, type: 'cash', points: 500 },
    { id: 'money_7', name: 'Multi-Millionnaire', desc: 'Avoir $5,000,000', category: 'Fortune', threshold: 5000000, type: 'cash', points: 1000 },
    { id: 'money_8', name: 'Banquier de l\'Ombre', desc: 'Avoir $10,000,000', category: 'Fortune', threshold: 10000000, type: 'cash', points: 2000 },
    { id: 'money_9', name: 'Trésor de Guerre', desc: 'Avoir $50,000,000', category: 'Fortune', threshold: 50000000, type: 'cash', points: 5000 },
    { id: 'money_10', name: 'Roi de la Finance', desc: 'Avoir $100,000,000', category: 'Fortune', threshold: 100000000, type: 'cash', points: 10000 },

    // --- PRODUCTION (10) ---
    { id: 'prod_1', name: 'Main Verte', desc: 'Produire 100g au total', category: 'Production', threshold: 100, type: 'totalProd', points: 10 },
    { id: 'prod_2', name: 'Jardinier', desc: 'Produire 1kg au total', category: 'Production', threshold: 1000, type: 'totalProd', points: 25 },
    { id: 'prod_3', name: 'Culture Intensive', desc: 'Produire 10kg au total', category: 'Production', threshold: 10000, type: 'totalProd', points: 50 },
    { id: 'prod_4', name: 'Fournisseur', desc: 'Produire 50kg au total', category: 'Production', threshold: 50000, type: 'totalProd', points: 100 },
    { id: 'prod_5', name: 'Grossiste', desc: 'Produire 100kg au total', category: 'Production', threshold: 100000, type: 'totalProd', points: 250 },
    { id: 'prod_6', name: 'Industriel', desc: 'Produire 500kg au total', category: 'Production', threshold: 500000, type: 'totalProd', points: 500 },
    { id: 'prod_7', name: 'Baron de la Prod', desc: 'Produire 1 Tonne au total', category: 'Production', threshold: 1000000, type: 'totalProd', points: 1000 },
    { id: 'prod_8', name: 'Monopole', desc: 'Produire 5 Tonnes au total', category: 'Production', threshold: 5000000, type: 'totalProd', points: 2500 },
    { id: 'prod_9', name: 'Cartel de Prod', desc: 'Produire 10 Tonnes au total', category: 'Production', threshold: 10000000, type: 'totalProd', points: 5000 },
    { id: 'prod_10', name: 'Légende Verte', desc: 'Produire 50 Tonnes au total', category: 'Production', threshold: 50000000, type: 'totalProd', points: 10000 },

    // --- BUSINESS IMMO (10) ---
    { id: 'immo_1', name: 'Squatteur', desc: 'Posséder 1 propriété', category: 'Business', threshold: 1, type: 'props', points: 10 },
    { id: 'immo_2', name: 'Locataire', desc: 'Posséder 3 propriétés', category: 'Business', threshold: 3, type: 'props', points: 30 },
    { id: 'immo_3', name: 'Proprio', desc: 'Posséder 5 propriétés', category: 'Business', threshold: 5, type: 'props', points: 50 },
    { id: 'immo_4', name: 'Investisseur', desc: 'Posséder 10 propriétés', category: 'Business', threshold: 10, type: 'props', points: 100 },
    { id: 'immo_5', name: 'Rentier', desc: 'Posséder 15 propriétés', category: 'Business', threshold: 15, type: 'props', points: 200 },
    { id: 'immo_6', name: 'Magnat de l\'Immo', desc: 'Posséder 20 propriétés', category: 'Business', threshold: 20, type: 'props', points: 400 },
    { id: 'immo_7', name: 'Constructeur', desc: 'Posséder 25 propriétés', category: 'Business', threshold: 25, type: 'props', points: 800 },
    { id: 'immo_8', name: 'Promoteur', desc: 'Posséder 30 propriétés', category: 'Business', threshold: 30, type: 'props', points: 1500 },
    { id: 'immo_9', name: 'Maire de la Ville', desc: 'Posséder 40 propriétés', category: 'Business', threshold: 40, type: 'props', points: 3000 },
    { id: 'immo_10', name: 'Roi de la Brique', desc: 'Posséder 50 propriétés', category: 'Business', threshold: 50, type: 'props', points: 5000 },

    // --- TRAFIC & VENTE (10) ---
    { id: 'deal_1', name: 'Première Vente', desc: 'Vendre pour $100', category: 'Trafic', threshold: 100, type: 'totalSales', points: 10 },
    { id: 'deal_2', name: 'Dealer Actif', desc: 'Vendre pour $1,000', category: 'Trafic', threshold: 1000, type: 'totalSales', points: 25 },
    { id: 'deal_3', name: 'Bon Vendeur', desc: 'Vendre pour $10,000', category: 'Trafic', threshold: 10000, type: 'totalSales', points: 50 },
    { id: 'deal_4', name: 'Fourgue Pro', desc: 'Vendre pour $50,000', category: 'Trafic', threshold: 50000, type: 'totalSales', points: 100 },
    { id: 'deal_5', name: 'Trafiquant', desc: 'Vendre pour $100,000', category: 'Trafic', threshold: 100000, type: 'totalSales', points: 250 },
    { id: 'deal_6', name: 'Exportateur', desc: 'Vendre pour $500,000', category: 'Trafic', threshold: 500000, type: 'totalSales', points: 500 },
    { id: 'deal_7', name: 'Grossiste Inter.', desc: 'Vendre pour $1,000,000', category: 'Trafic', threshold: 1000000, type: 'totalSales', points: 1000 },
    { id: 'deal_8', name: 'Baron du Deal', desc: 'Vendre pour $5,000,000', category: 'Trafic', threshold: 5000000, type: 'totalSales', points: 2500 },
    { id: 'deal_9', name: 'Réseau Mondial', desc: 'Vendre pour $10,000,000', category: 'Trafic', threshold: 10000000, type: 'totalSales', points: 5000 },
    { id: 'deal_10', name: 'Monopole du Marché', desc: 'Vendre pour $50,000,000', category: 'Trafic', threshold: 50000000, type: 'totalSales', points: 10000 },

    // --- INFLUENCE & LEVEL (10) ---
    { id: 'level_1', name: 'Débutant', desc: 'Atteindre le niveau 2', category: 'Influence', threshold: 2, type: 'level', points: 10 },
    { id: 'level_2', name: 'Respecté', desc: 'Atteindre le niveau 5', category: 'Influence', threshold: 5, type: 'level', points: 25 },
    { id: 'level_3', name: 'Chef de Bande', desc: 'Atteindre le niveau 10', category: 'Influence', threshold: 10, type: 'level', points: 50 },
    { id: 'level_4', name: 'Parrain Local', desc: 'Atteindre le niveau 15', category: 'Influence', threshold: 15, type: 'level', points: 100 },
    { id: 'level_5', name: 'Caïd', desc: 'Atteindre le niveau 20', category: 'Influence', threshold: 20, type: 'level', points: 200 },
    { id: 'level_6', name: 'Boss', desc: 'Atteindre le niveau 25', category: 'Influence', threshold: 25, type: 'level', points: 500 },
    { id: 'level_7', name: 'Capo', desc: 'Atteindre le niveau 30', category: 'Influence', threshold: 30, type: 'level', points: 1000 },
    { id: 'level_8', name: 'Don', desc: 'Atteindre le niveau 40', category: 'Influence', threshold: 40, type: 'level', points: 2500 },
    { id: 'level_9', name: 'Empereur', desc: 'Atteindre le niveau 50', category: 'Influence', threshold: 50, type: 'level', points: 5000 },
    { id: 'level_10', name: 'Dieu de la Rue', desc: 'Atteindre le niveau 60', category: 'Influence', threshold: 60, type: 'level', points: 10000 },

    // --- COLLECTION & LUXE (10) ---
    { id: 'collec_1', name: 'Premier Plaisir', desc: 'Acheter 1 objet de luxe', category: 'Collection', threshold: 1, type: 'luxury', points: 10 },
    { id: 'collec_2', name: 'Petit Collectionneur', desc: 'Acheter 3 objets de luxe', category: 'Collection', threshold: 3, type: 'luxury', points: 25 },
    { id: 'collec_3', name: 'Amateur d\'Art', desc: 'Acheter 5 objets de luxe', category: 'Collection', threshold: 5, type: 'luxury', points: 50 },
    { id: 'collec_4', name: 'Flambeur', desc: 'Acheter 10 objets de luxe', category: 'Collection', threshold: 10, type: 'luxury', points: 100 },
    { id: 'collec_5', name: 'Grand Seigneur', desc: 'Acheter 15 objets de luxe', category: 'Collection', threshold: 15, type: 'luxury', points: 250 },
    { id: 'collec_6', name: 'Mylène Farmer', desc: 'Acheter 20 objets de luxe', category: 'Collection', threshold: 20, type: 'luxury', points: 500 },
    { id: 'collec_7', name: 'Musée Privé', desc: 'Acheter 30 objets de luxe', category: 'Collection', threshold: 30, type: 'luxury', points: 1000 },
    { id: 'collec_8', name: 'Milliardaire Excentrique', desc: 'Acheter 40 objets de luxe', category: 'Collection', threshold: 40, type: 'luxury', points: 2500 },
    { id: 'collec_9', name: 'Tout Puissant', desc: 'Acheter 50 objets de luxe', category: 'Collection', threshold: 50, type: 'luxury', points: 5000 },
    { id: 'collec_10', name: 'L\'Homme qui a Tout', desc: 'Acheter 60 objets de luxe', category: 'Collection', threshold: 60, type: 'luxury', points: 10000 }
];
const VEHICLE_STATS = {
    dealer_pied: { name: 'Dealer à pied', price: 0, tripCost: 0, capacity: 50, duration: 10, icon: '🚶‍♂️', desc: 'Livraison de quartier très basique (50g)' },
    car: { name: 'Voiture', price: 5000, tripCost: 500, capacity: 10000, duration: 60, icon: '🚗', desc: 'Livraison locale rapide (10kg)' },
    pickup: { name: 'Pickup', price: 15000, tripCost: 1200, capacity: 50000, duration: 120, icon: '🚙', desc: 'Livraison régionale (50kg)' },
    van: { name: 'Van', price: 50000, tripCost: 3000, capacity: 200000, duration: 240, icon: '🚐', desc: 'Livraison nationale (200kg)' },
    truck: { name: 'Camion', price: 200000, tripCost: 10000, capacity: 1000000, duration: 480, icon: '🚛', desc: 'Convoi lourd (1T)' },
    plane: { name: 'Avion', price: 1000000, tripCost: 50000, capacity: 10000000, duration: 960, icon: '✈️', desc: 'Cargo international (10T)' }
};
const purchasableAssets = [
    // === Production : GÉRÉ PAR PRODUCTION_PATH DÉSORMAIS ===
    // Les anciens items sont retirés de cette liste.

    // === STOCKAGE (Entrepôts) ===
    { id: 'storage-box', type: 'storage', name: 'Box de Stockage', bonus: 100, price: 2000, icon: '📦', desc: '+100g de capacité' },
    { id: 'storage-warehouse', type: 'storage', name: 'Entrepôt ZI', bonus: 1000, price: 15000, icon: '🏭', desc: '+1kg de capacité' },
    { id: 'storage-hangar', type: 'storage', name: 'Hangar Sécurisé', bonus: 10000, price: 100000, icon: '🏗️', desc: '+10kg de capacité' },

    // === LOCATIF (Revenus Hebdomadaires) ===
    { id: 'parking-rent', type: 'rental', name: 'Place de Parking', price: 10000, icon: '🅿️', desc: '', income: 100 },
    { id: 'box-garage', type: 'rental', name: 'Box Garage', price: 25000, icon: '🚪', desc: '', income: 250 },
    { id: 'studio-rent', type: 'rental', name: 'Studio Etudiant', price: 80000, icon: '🎓', desc: '', income: 500 },
    { id: 'appartment-rent', type: 'rental', name: 'Appartement F3', price: 250000, icon: '🏢', desc: '', income: 1500 },
    { id: 'building-rent', type: 'rental', name: 'Immeuble de Rapport', price: 2000000, icon: '🏘️', desc: '', income: 15000 },

    // === BUSINESS (Revenus Hebdomadaires) ===
    { id: 'laundromat', type: 'business', name: 'Laverie Automatique', price: 50000, icon: '🧺', desc: '', income: 500 },
    { id: 'carwash', type: 'business', name: 'Station de Lavage', price: 150000, icon: '🚿', desc: '', income: 1500 },
    { id: 'nightclub', type: 'business', name: 'Boîte de Nuit', price: 500000, icon: '🕺', desc: '', income: 5000 },
    { id: 'restaurant', type: 'business', name: 'Restaurant Chic', price: 1500000, icon: '🍽️', desc: '', income: 12000 },
    { id: 'casino', type: 'business', name: 'Casino Privé', price: 10000000, icon: '🎰', desc: '', income: 150000 },

    // === VOITURES (Cosmétique / Flex) ===
    { id: 'twingo', type: 'car', name: 'Twingo d\'Occasion', price: 2000, icon: '🚗', desc: 'Ça roule, c\'est déjà ça.' },
    { id: 'golf', type: 'car', name: 'Golf GTI', price: 35000, icon: '🚗', desc: 'Un classique efficace.' },
    { id: 'bmw-m3', type: 'car', name: 'BMW M3', price: 85000, icon: '🏎️', desc: 'Pour les go-fast.' },
    { id: 'porsche-911', type: 'car', name: 'Porsche 911', price: 150000, icon: '🏎️', desc: 'Le statut commence ici.' },
    { id: 'lamborghini', type: 'car', name: 'Lamborghini Huracán', price: 250000, icon: '🏎️', desc: 'M\'as-tu-vu ?' },
    { id: 'ferrari-sf90', type: 'car', name: 'Ferrari SF90', price: 500000, icon: '🏎️', desc: 'La puissance italienne.' },
    { id: 'bugatti', type: 'car', name: 'Bugatti Chiron', price: 3000000, icon: '🏎️', desc: 'Le sommet de la chaîne alimentaire.' },

    // === ART (Flex / Blanchiment fictif) ===
    { id: 'print-banksy', type: 'art', name: 'Print Banksy', price: 500, icon: '🖼️', desc: 'Une copie numérotée.' },
    { id: 'sculpture-moderne', type: 'art', name: 'Sculpture Moderne', price: 5000, icon: '🗿', desc: 'Personne ne comprend, mais c\'est cher.' },
    { id: 'tableau-maitre', type: 'art', name: 'Tableau de Maître', price: 50000, icon: '🎨', desc: 'Un petit Renoir pour le salon.' },
    { id: 'monet', type: 'art', name: 'Les Nymphéas (Monet)', price: 800000, icon: '🖼️', desc: 'Une pièce de musée.' },
    { id: 'picasso', type: 'art', name: 'Original Picasso', price: 5000000, icon: '🎨', desc: 'L\'ultime investissement.' },
    { id: 'da-vinci', type: 'art', name: 'Esquisse de Da Vinci', price: 20000000, icon: '📜', desc: 'Inestimable.' },

    // === BIJOUX ===
    { id: 'montre-ag', type: 'jewelry', name: 'Montre Argent', price: 1000, icon: '⌚', desc: 'Simple et efficace.' },
    { id: 'chaine-or', type: 'jewelry', name: 'Chaîne en Or', price: 5000, icon: '⛓️', desc: 'Du 18 carats.' },
    { id: 'rolex', type: 'jewelry', name: 'Rolex Submariner', price: 15000, icon: '⌚', desc: 'La base.' },
    { id: 'patek', type: 'jewelry', name: 'Patek Philippe', price: 100000, icon: '⌚', desc: 'Tu ne la possèdes pas vraiment...' },
    { id: 'diamond-ring', type: 'jewelry', name: 'Bague Diamant 5ct', price: 500000, icon: '💍', desc: 'Ça brille.' },
    { id: 'crown-jewels', type: 'jewelry', name: 'Diadème Royal', price: 10000000, icon: '👑', desc: 'Volé dans un musée ?' },

    // === IMMOBILIER (Luxe / Vie perso) ===

    { id: 'studio-city', type: 'real-estate', name: 'Studio Centre-Ville', price: 150000, icon: '🏢', desc: 'Pour les pieds-à-terre.' },
    { id: 'loft', type: 'real-estate', name: 'Loft Industriel', price: 500000, icon: '🏗️', desc: 'Espace ouvert et briques apparentes.' },
    { id: 'villa-sea', type: 'real-estate', name: 'Villa Bord de Mer', price: 2000000, icon: '🏖️', desc: 'Vue imprenable.' },
    { id: 'manor', type: 'real-estate', name: 'Manoir Historique', price: 10000000, icon: '🏰', desc: 'Avec majordome fantôme inclus.' },
    { id: 'private-island', type: 'real-estate', name: 'Île Privée', price: 50000000, icon: '🏝️', desc: 'Votre propre pays, ou presque.' },
    { id: 'skyscraper', type: 'real-estate', name: 'Gratte-ciel', price: 250000000, icon: '🏙️', desc: 'Dominez la ville.' }
];
const PRODUCTION_PATH = [
    {
        level: 0,
        name: 'Placard à balais',
        territory: null,
        defense: 0,
        cap: 10,
        price: 0,
        trophy: null,
        icon: '🧹'
    },
    {
        level: 1,
        name: 'Petit studio miteux',
        territory: null,
        defense: 0,
        cap: 30,
        price: 800,
        trophy: 'Une lampe HPS grillée',
        icon: '🛋️'
    },
    {
        level: 2,
        name: 'Appartement Étudiant',
        territory: 'Cité HLM',
        defense: 50,
        cap: 100,
        price: 3500,
        trophy: 'Une pile de cartons à pizza',
        icon: '🍕'
    },
    {
        level: 3,
        name: 'Pavillon de Banlieue',
        territory: 'Quartier Résidentiel',
        defense: 250,
        cap: 500,
        price: 15000,
        trophy: 'Un Nain de jardin (cachette)',
        icon: '🏡'
    },
    {
        level: 4,
        name: 'Hangar Désaffecté',
        territory: 'Zone Industrielle',
        defense: 1000,
        cap: 2500,
        price: 75000,
        trophy: 'Un transpalette rouillé',
        icon: '🏭'
    },
    {
        level: 5,
        name: 'Corps de Ferme',
        territory: 'Campagne Reculée',
        defense: 4000,
        cap: 12000,
        price: 400000,
        trophy: 'Un vieux fusil de chasse',
        icon: '🚜'
    },
    {
        level: 6,
        name: 'Labo Souterrain',
        territory: 'Zone Frontalière',
        defense: 15000,
        cap: 60000,
        price: 2500000,
        trophy: 'Une combinaison Hazmat jaune',
        icon: '🔬'
    },
    {
        level: 7,
        name: 'Complexe Industriel',
        territory: 'Île Privée',
        defense: 70000,
        cap: 300000,
        price: 15000000,
        trophy: 'La première brique d\'or pur',
        icon: '🏢'
    },
    {
        level: 8,
        name: 'Monopole National',
        territory: 'État Narco',
        defense: 300000,
        cap: 999999999,
        price: 150000000,
        trophy: 'L\'Écharpe Présidentielle',
        image: 'assets/images/bases/base_8.jpg'
    }
];
const LEVEL_TITLES = {
    1: 'Guetteur Débutant',
    2: 'Mule',
    3: 'Dealer de Coin',
    4: 'Vendeur de Sachets',
    5: 'Dealer de Quartier',
    6: 'Fournisseur de Rue',
    7: 'Chef de Point',
    8: 'Trafiquant Local',
    9: 'Grossiste de Rue',
    10: 'Dealer Multi-Produits',
    11: 'Importateur',
    12: 'Chimiste Amateur',
    13: 'Cuisinier',
    14: 'Chef de Labo',
    15: 'Distributeur Régional',
    16: 'Blanchisseur',
    17: 'Boss de Secteur',
    18: 'Fournisseur Grossiste',
    19: 'Lieutenant du Cartel',
    20: 'Baron de la Drogue',
    21: 'Parrain du Réseau',
    22: 'Roi du Trafic',
    23: 'Maître du Laboratoire',
    24: 'Seigneur de la Rue',
    25: 'Empereur du Deal',
    26: 'Magnat de la Poudre',
    27: 'Baron International',
    28: 'Prince du Cartel',
    29: 'Architecte du Réseau',
    30: 'Parrain Régional',
    31: 'Directeur du Cartel',
    32: 'PDG du Crime',
    33: 'Magnat du Trafic',
    34: 'Monopoleur',
    35: 'Roi du Blanchiment',
    36: 'Empereur du Cartel',
    37: 'Seigneur des Routes',
    38: 'Maître des Flux',
    39: 'Tsar de la Cocaïne',
    40: 'Roi du Narco-Trafic',
    41: 'Parrain International',
    42: 'Baron Mondial',
    43: 'Empereur du Narcotrafic',
    44: 'Dieu du Trafic',
    45: 'Légende du Cartel',
    46: 'Mythe Vivant',
    47: 'Parrain Absolu',
    48: 'Empereur Narco',
    49: 'Seigneur Suprême',
    50: 'El Patrón',
    51: 'Légende du Narcotrafic',
    52: 'Mythe de la Rue',
    53: 'Fantôme du Cartel',
    54: 'Immortel du Trafic',
    55: 'Demi-Dieu Narco',
    56: 'Dieu de la Drogue',
    57: 'Entité du Trafic',
    58: 'Essence du Cartel',
    59: 'Singularité Narco',
    60: 'El Jefe Supremo'
};

const QUEST_TYPES = [
    { id: 'harvest', desc: 'Récolter {target}g', base: 100, reward: 5 },
    { id: 'deliver', desc: 'Faire {target} livraisons', base: 3, reward: 5 },
    { id: 'earn', desc: 'Gagner ${target}', base: 5000, reward: 10 },
    { id: 'job', desc: 'Faire le job {target} fois', base: 5, reward: 5 }
];


