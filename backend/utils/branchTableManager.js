import pool from '../config/mysql.js';

export const BRANCH_ENTITIES = [
  'cash_sessions',
  'customer_credits',
  'customer_payment_ledger',
  'customers',
  'damaged_products',
  'easypaisa',
  'expenses',
  'fuel_expenses',
  'items',
  'orders',
  'profit_reports',
  'purchase_credits',
  'purchases',
  'sale_product_history',
  'sales',
  'today_sales_history',
  'vendor_payment_ledger',
  'vendors'
];

/**
 * Derive a clean, safe, consistent branch prefix for any shop.
 * E.g. "Peshawar Branch" -> "peshawar_branch"
 *      "Mardan Branch"   -> "mardan_branch"
 *      "Attock Branch"   -> "attock_branch"
 *      "Swat Branch"     -> "swat_branch"
 */
export function getBranchPrefix(shop) {
  if (!shop) return 'peshawar_branch';
  const name = (typeof shop === 'string' ? shop : (shop.name || '')).trim().toLowerCase();
  const id = typeof shop === 'object' ? (shop.id || shop._id) : null;

  if (name.includes('peshawar') || name.includes('peshware')) return 'peshawar_branch';
  if (name.includes('mardan')) return 'mardan_branch';
  if (name.includes('attock')) return 'attock_branch';

  let clean = name.replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  if (!clean && id) clean = `shop_${id}`;
  if (!clean) clean = 'branch';
  if (!clean.endsWith('_branch')) clean = `${clean}_branch`;
  return clean;
}

/**
 * Clean up flat legacy tables outside the branch folders.
 * Specifically removes root customer_payment_ledger and vendor_payment_ledger so they don't clutter phpMyAdmin.
 */
export async function cleanFlatLegacyTables() {
  const flatClutterTables = [
    'customer_payment_ledger',
    'vendor_payment_ledger',
    'sale_product_history',
    'today_sales_history',
    'items',
    'sales',
    'purchases',
    'purchase_credits',
    'customers',
    'customer_credits',
    'expenses',
    'orders',
    'damaged_products',
    'cash_sessions',
    'profit_reports',
    'vendors',
    'sale_items',
    'order_items',
    'customer_cart_items'
  ];

  for (const t of flatClutterTables) {
    try {
      await pool.query(`DROP TABLE IF EXISTS \`${t}\``);
    } catch (_) {}
  }
}

/**
 * Full DDL generator for all 18 branch tables
 */
function getTableDDL(entity, pfx) {
  const tName = `${pfx}__${entity}`;
  switch (entity) {
    case 'cash_sessions':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) DEFAULT NULL,
          \`status\` varchar(50) DEFAULT 'open',
          \`openingCash\` decimal(15,2) DEFAULT 0.00,
          \`closingCash\` decimal(15,2) DEFAULT 0.00,
          \`totalSales\` decimal(15,2) DEFAULT 0.00,
          \`totalReturns\` decimal(15,2) DEFAULT 0.00,
          \`expectedCash\` decimal(15,2) DEFAULT 0.00,
          \`actualCash\` decimal(15,2) DEFAULT 0.00,
          \`openedBy\` varchar(255) DEFAULT NULL,
          \`closedBy\` varchar(255) DEFAULT NULL,
          \`notes\` text DEFAULT NULL,
          \`openedAt\` datetime DEFAULT current_timestamp(),
          \`closedAt\` datetime DEFAULT NULL,
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_cs_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'customer_credits':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`customerId\` int(11) DEFAULT NULL,
          \`saleId\` int(11) DEFAULT NULL,
          \`customerName\` varchar(255) NOT NULL,
          \`customerPhone\` varchar(100) DEFAULT '',
          \`customerEmail\` varchar(255) DEFAULT '',
          \`totalAmount\` decimal(12,2) DEFAULT 0.00,
          \`paidAmount\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`status\` varchar(50) DEFAULT 'UNPAID',
          \`notes\` text DEFAULT NULL,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`transactionId\` varchar(255) DEFAULT '',
          \`paymentProof\` text DEFAULT NULL,
          \`lastPaymentDate\` datetime DEFAULT NULL,
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_cc_shop\` (\`shopId\`),
          KEY \`idx_${pfx}_cc_cust\` (\`customerId\`),
          KEY \`idx_${pfx}_cc_sale\` (\`saleId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'customer_payment_ledger':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` varchar(255) NOT NULL,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`saleId\` varchar(255) DEFAULT NULL,
          \`invoiceNumber\` varchar(100) DEFAULT NULL,
          \`customerName\` varchar(255) DEFAULT NULL,
          \`customerPhone\` varchar(50) DEFAULT NULL,
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`itemsDescription\` text DEFAULT NULL,
          \`petisBought\` decimal(10,2) DEFAULT 0.00,
          \`eggsBought\` int(11) DEFAULT 0,
          \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`cashPaid\` decimal(12,2) DEFAULT 0.00,
          \`bankPaid\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`status\` varchar(50) DEFAULT 'PAID',
          \`date\` datetime NOT NULL DEFAULT current_timestamp(),
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          \`items\` longtext DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_cpl_shopId\` (\`shopId\`),
          KEY \`idx_${pfx}_cpl_date\` (\`date\`),
          KEY \`idx_${pfx}_cpl_invoice\` (\`invoiceNumber\`),
          KEY \`idx_${pfx}_cpl_customer\` (\`customerName\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'customers':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`fullName\` varchar(255) NOT NULL,
          \`email\` varchar(255) NOT NULL,
          \`password\` varchar(255) NOT NULL,
          \`phone\` varchar(50) DEFAULT '',
          \`address\` text DEFAULT NULL,
          \`shopId\` int(11) NOT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          \`cart\` longtext DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_cust_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'damaged_products':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL,
          \`productName\` varchar(255) NOT NULL,
          \`productId\` int(11) DEFAULT NULL,
          \`quantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`petiQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`trayQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`eggQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`unitType\` varchar(50) DEFAULT 'egg',
          \`deductedEggs\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`unitPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`totalLoss\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`reason\` enum('Egg Breakage / Crack','Spoiled / Expired','Transport Damage','Storage Loss','Other') NOT NULL DEFAULT 'Egg Breakage / Crack',
          \`damageDate\` datetime NOT NULL DEFAULT current_timestamp(),
          \`notes\` text DEFAULT NULL,
          \`reportedBy\` varchar(255) DEFAULT 'System',
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_dp_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'easypaisa':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`customerName\` varchar(255) NOT NULL,
          \`mobileNumber\` varchar(50) NOT NULL,
          \`amount\` decimal(10,2) NOT NULL,
          \`paymentType\` varchar(50) DEFAULT 'Received',
          \`trxId\` varchar(100) DEFAULT '',
          \`notes\` text DEFAULT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_ep_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'expenses':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`title\` varchar(255) NOT NULL,
          \`category\` varchar(100) NOT NULL,
          \`amount\` decimal(12,2) NOT NULL,
          \`paymentMethod\` varchar(50) NOT NULL DEFAULT 'CASH',
          \`paymentSource\` varchar(50) DEFAULT 'MAIN_DRAWER',
          \`expenseDate\` datetime NOT NULL DEFAULT current_timestamp(),
          \`notes\` text DEFAULT NULL,
          \`createdBy\` varchar(255) DEFAULT 'Shop Admin',
          \`shopId\` int(11) NOT NULL,
          \`vehicleNumber\` varchar(100) DEFAULT NULL,
          \`driverName\` varchar(255) DEFAULT NULL,
          \`chalanNumber\` varchar(100) DEFAULT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_exp_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'fuel_expenses':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL,
          \`vehicleNo\` varchar(100) NOT NULL,
          \`vehicleName\` varchar(255) DEFAULT '',
          \`driverName\` varchar(255) DEFAULT '',
          \`driverPhone\` varchar(50) DEFAULT '',
          \`purpose\` varchar(255) DEFAULT 'Shop Delivery',
          \`fuelType\` varchar(50) DEFAULT 'Diesel',
          \`liters\` decimal(10,2) NOT NULL DEFAULT 0.00,
          \`ratePerLiter\` decimal(10,2) NOT NULL DEFAULT 0.00,
          \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`paidAmount\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`petrolPump\` varchar(255) DEFAULT '',
          \`odometerReading\` varchar(100) DEFAULT '',
          \`expenseDate\` datetime NOT NULL DEFAULT current_timestamp(),
          \`notes\` text DEFAULT NULL,
          \`receiptImage\` text DEFAULT NULL,
          \`createdBy\` varchar(255) DEFAULT 'Shop Admin',
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_fuel_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'items':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`name\` varchar(255) NOT NULL,
          \`stock\` int(11) NOT NULL DEFAULT 0,
          \`category\` varchar(100) NOT NULL DEFAULT 'Eggs',
          \`costPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`price\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`trayPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`petiPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`piecePrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`khulaPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`unitType\` enum('egg','peti','tray','piece','khula') NOT NULL DEFAULT 'peti',
          \`petiQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`trayQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`eggQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`khulaQuantity\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`totalStock\` int(11) NOT NULL DEFAULT 0,
          \`supplier\` varchar(255) DEFAULT '',
          \`expiryDate\` date DEFAULT NULL,
          \`lastUpdated\` date DEFAULT NULL,
          \`shopId\` int(11) NOT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          \`isOnline\` tinyint(1) NOT NULL DEFAULT 0,
          \`onlinePrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`description\` text DEFAULT NULL,
          \`eggSize\` enum('Small','Medium','Large','Extra Large') DEFAULT 'Large',
          \`eggColor\` enum('White','Brown','Desi') DEFAULT 'White',
          \`images\` longtext DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_items_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'orders':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`orderNumber\` varchar(100) NOT NULL,
          \`customerId\` int(11) NOT NULL,
          \`customerName\` varchar(255) NOT NULL,
          \`customerPhone\` varchar(50) NOT NULL,
          \`customerEmail\` varchar(255) DEFAULT '',
          \`deliveryAddress\` text NOT NULL,
          \`shopId\` int(11) NOT NULL,
          \`totalAmount\` decimal(12,2) NOT NULL,
          \`paymentMethod\` varchar(50) NOT NULL DEFAULT 'COD',
          \`paymentProof\` text DEFAULT NULL,
          \`transactionId\` varchar(255) DEFAULT '',
          \`status\` varchar(50) NOT NULL DEFAULT 'PENDING',
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          \`items\` longtext DEFAULT NULL,
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_orders_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'profit_reports':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`reportDate\` date NOT NULL,
          \`revenue\` decimal(15,2) DEFAULT 0.00,
          \`cogs\` decimal(15,2) DEFAULT 0.00,
          \`grossProfit\` decimal(15,2) DEFAULT 0.00,
          \`overhead\` decimal(15,2) DEFAULT 0.00,
          \`damageLoss\` decimal(15,2) DEFAULT 0.00,
          \`fuelExpense\` decimal(15,2) DEFAULT 0.00,
          \`netProfit\` decimal(15,2) DEFAULT 0.00,
          \`status\` varchar(50) DEFAULT 'GENERATED',
          \`generatedBy\` varchar(255) DEFAULT 'System',
          \`notes\` text DEFAULT NULL,
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_pr_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'purchase_credits':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`supplier\` varchar(255) NOT NULL,
          \`supplierPhone\` varchar(100) DEFAULT '',
          \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`paidAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`status\` varchar(50) DEFAULT 'UNPAID',
          \`purchaseDate\` datetime DEFAULT current_timestamp(),
          \`notes\` text DEFAULT NULL,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_pc_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'purchases':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`supplier\` varchar(255) NOT NULL,
          \`supplierPhone\` varchar(100) DEFAULT '',
          \`productName\` varchar(255) NOT NULL,
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`petiQuantity\` decimal(10,2) DEFAULT 0.00,
          \`eggQuantity\` int(11) DEFAULT 0,
          \`unitType\` varchar(50) DEFAULT 'peti',
          \`costPrice\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`totalPurchaseCost\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`cashPaid\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'Cash',
          \`purchaseDate\` datetime DEFAULT current_timestamp(),
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_purch_shop\` (\`shopId\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'sale_product_history':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` varchar(255) NOT NULL,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`saleId\` varchar(255) DEFAULT NULL,
          \`invoiceNumber\` varchar(100) DEFAULT NULL,
          \`saleDate\` datetime NOT NULL DEFAULT current_timestamp(),
          \`productId\` varchar(255) DEFAULT NULL,
          \`productName\` varchar(255) NOT NULL DEFAULT 'Eggs',
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`customerName\` varchar(255) DEFAULT 'Walk-in Customer',
          \`customerPhone\` varchar(50) DEFAULT '',
          \`petisSold\` decimal(10,2) DEFAULT 0.00,
          \`eggsSold\` int(11) DEFAULT 0,
          \`sellingRate\` decimal(12,2) DEFAULT 0.00,
          \`totalAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`cashPaid\` decimal(12,2) DEFAULT 0.00,
          \`bankPaid\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`productImage\` text DEFAULT NULL,
          \`notes\` text DEFAULT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_sph_shop\` (\`shopId\`),
          KEY \`idx_${pfx}_sph_date\` (\`saleDate\`),
          KEY \`idx_${pfx}_sph_inv\` (\`invoiceNumber\`),
          KEY \`idx_${pfx}_sph_prod\` (\`productName\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'sales':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`invoiceNumber\` varchar(100) NOT NULL,
          \`customerName\` varchar(255) NOT NULL DEFAULT 'Walk-in Customer',
          \`customerPhone\` varchar(50) DEFAULT '',
          \`totalAmount\` decimal(12,2) NOT NULL,
          \`paymentMethod\` varchar(50) NOT NULL DEFAULT 'CASH',
          \`cashPaid\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`bankPaid\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`saleDate\` datetime NOT NULL DEFAULT current_timestamp(),
          \`shopId\` int(11) NOT NULL,
          \`items\` longtext DEFAULT NULL,
          \`itemsDescription\` text DEFAULT NULL,
          \`petisBought\` decimal(10,2) DEFAULT 0.00,
          \`eggsBought\` int(11) DEFAULT 0,
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_sales_shop_date\` (\`shopId\`,\`saleDate\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'today_sales_history':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` varchar(255) NOT NULL,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`reportDate\` date NOT NULL,
          \`invoiceNumber\` varchar(100) DEFAULT NULL,
          \`saleId\` varchar(255) DEFAULT NULL,
          \`customerName\` varchar(255) DEFAULT 'Walk-in Customer',
          \`customerPhone\` varchar(50) DEFAULT '',
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`itemsSummary\` text DEFAULT NULL,
          \`grossSale\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`cashPaid\` decimal(12,2) DEFAULT 0.00,
          \`bankPaid\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'CASH',
          \`shopExpense\` decimal(12,2) DEFAULT 0.00,
          \`fuelExpense\` decimal(12,2) DEFAULT 0.00,
          \`damagedLoss\` decimal(12,2) DEFAULT 0.00,
          \`netResult\` decimal(12,2) DEFAULT 0.00,
          \`cashInDrawer\` decimal(12,2) DEFAULT 0.00,
          \`notes\` text DEFAULT NULL,
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_tsh_shop\` (\`shopId\`),
          KEY \`idx_${pfx}_tsh_date\` (\`reportDate\`),
          KEY \`idx_${pfx}_tsh_inv\` (\`invoiceNumber\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'vendor_payment_ledger':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` varchar(255) NOT NULL,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`purchaseId\` varchar(255) DEFAULT NULL,
          \`supplierName\` varchar(255) DEFAULT NULL,
          \`supplierPhone\` varchar(50) DEFAULT NULL,
          \`supplierLocation\` varchar(255) DEFAULT NULL,
          \`productName\` varchar(255) DEFAULT NULL,
          \`category\` varchar(100) DEFAULT 'Eggs',
          \`petisPurchased\` decimal(10,2) DEFAULT 0.00,
          \`eggQuantity\` int(11) DEFAULT 0,
          \`unitType\` varchar(50) DEFAULT 'peti',
          \`buyCost\` decimal(12,2) DEFAULT 0.00,
          \`totalCost\` decimal(12,2) NOT NULL DEFAULT 0.00,
          \`amountPaid\` decimal(12,2) DEFAULT 0.00,
          \`cashPaid\` decimal(12,2) DEFAULT 0.00,
          \`bankPaid\` decimal(12,2) DEFAULT 0.00,
          \`dueAmount\` decimal(12,2) DEFAULT 0.00,
          \`paymentMethod\` varchar(50) DEFAULT 'Cash',
          \`status\` varchar(50) DEFAULT 'PAID',
          \`date\` datetime NOT NULL DEFAULT current_timestamp(),
          \`createdAt\` datetime NOT NULL DEFAULT current_timestamp(),
          \`updatedAt\` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_vpl_shop\` (\`shopId\`),
          KEY \`idx_${pfx}_vpl_date\` (\`date\`),
          KEY \`idx_${pfx}_vpl_supp\` (\`supplierName\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    case 'vendors':
      return `
        CREATE TABLE IF NOT EXISTS \`${tName}\` (
          \`id\` int(11) NOT NULL AUTO_INCREMENT,
          \`shopId\` int(11) NOT NULL DEFAULT 1,
          \`name\` varchar(255) NOT NULL,
          \`phone\` varchar(100) DEFAULT '',
          \`email\` varchar(255) DEFAULT '',
          \`location\` varchar(255) DEFAULT '',
          \`farmLocation\` varchar(255) DEFAULT '',
          \`notes\` text DEFAULT NULL,
          \`status\` varchar(50) DEFAULT 'active',
          \`createdAt\` datetime DEFAULT current_timestamp(),
          \`updatedAt\` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
          PRIMARY KEY (\`id\`),
          KEY \`idx_${pfx}_vend_shop\` (\`shopId\`),
          KEY \`idx_${pfx}_vend_name\` (\`name\`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `;
    default:
      return null;
  }
}

/**
 * Automatically creates all 18 branch tables for a shop.
 * Uses CREATE TABLE ... LIKE if reference branch table exists, else fallback DDL.
 */
export async function createBranchTablesForShop(shop) {
  if (!shop) return;
  const pfx = getBranchPrefix(shop);
  const shopId = Number(shop.id || shop._id || 1);
  console.log(`🚀 Creating dynamic branch tables for [${shop.name || pfx}] -> prefix: \`${pfx}\`...`);

  for (const entity of BRANCH_ENTITIES) {
    const tableName = `${pfx}__${entity}`;
    let created = false;
    
    // If not peshawar_branch, try copying schema from peshawar_branch table
    if (pfx !== 'peshawar_branch') {
      try {
        await pool.query(`CREATE TABLE IF NOT EXISTS \`${tableName}\` LIKE \`peshawar_branch__${entity}\``);
        created = true;
      } catch (_) {}
    }

    // Fallback DDL execution if LIKE was skipped or failed
    if (!created) {
      const ddl = getTableDDL(entity, pfx);
      if (ddl) {
        await pool.query(ddl);
      }
    }
  }

  // Auto-populate / sync histories from sales
  await syncAllSalesToHistoriesForBranch(pfx, shopId);
  console.log(`✅ Verified all 18 branch tables for \`${pfx}\``);
}

/**
 * Permanently drops all 18 tables for a deleted branch.
 */
export async function dropBranchTablesForShop(shop) {
  if (!shop) return;
  const pfx = getBranchPrefix(shop);
  console.log(`🗑️ Dropping all 18 branch tables for \`${pfx}\`...`);

  for (const entity of BRANCH_ENTITIES) {
    const tableName = `${pfx}__${entity}`;
    try {
      await pool.query(`DROP TABLE IF EXISTS \`${tableName}\``);
    } catch (err) {
      console.warn(`Could not drop ${tableName}:`, err.message);
    }
  }
  console.log(`✅ Successfully removed all database tables for \`${pfx}\``);
}

/**
 * Syncs a single sale into sale_product_history and today_sales_history
 */
export async function syncSaleToBranchHistories(sale, shopId) {
  if (!sale) return;
  const targetId = Number(shopId || sale.shopId || 1);
  const pfx = getBranchPrefix({ id: targetId });

  const saleId = String(sale.id || sale._id);
  const inv = sale.invoiceNumber || `INV-${saleId}`;
  const saleDate = sale.saleDate ? new Date(sale.saleDate) : (sale.createdAt ? new Date(sale.createdAt) : new Date());
  const reportDateStr = saleDate.toISOString().split('T')[0];
  const total = Number(sale.totalAmount || 0);
  const cash = Number(sale.cashPaid || 0);
  const bank = Number(sale.bankPaid || 0);
  const due = Number(sale.dueAmount || 0);
  const custName = sale.customerName || 'Walk-in Customer';
  const custPhone = sale.customerPhone || '';
  const payMethod = sale.paymentMethod || 'CASH';

  let items = [];
  if (Array.isArray(sale.items)) items = sale.items;
  else if (typeof sale.items === 'string' && sale.items.trim()) {
    try { items = JSON.parse(sale.items); if (typeof items === 'string') items = JSON.parse(items); } catch {}
  }

  // 1. Sync into sale_product_history
  const sphTable = `${pfx}__sale_product_history`;
  try {
    // Delete previous lines for this sale
    await pool.query(`DELETE FROM \`${sphTable}\` WHERE \`saleId\` = ?`, [saleId]);

    if (items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const lineId = `sph-${saleId}-${i + 1}`;
        const pName = item.name || item.title || 'Eggs';
        const pId = item.productId || item.id || null;
        const cat = item.category || sale.category || 'Eggs';
        const qty = Number(item.quantity) || 1;
        const petis = item.petis ? Number(item.petis) : (qty > 10 ? Number((qty / 360).toFixed(2)) : qty);
        const eggs = item.totalEggs ? Number(item.totalEggs) : Math.round(petis * 360);
        const rate = Number(item.price || item.rate || 0);
        const lineTotal = Number(item.total || (qty * rate) || total);

        await pool.query(`
          INSERT INTO \`${sphTable}\`
            (\`id\`, \`shopId\`, \`saleId\`, \`invoiceNumber\`, \`saleDate\`, \`productId\`, \`productName\`, \`category\`,
             \`customerName\`, \`customerPhone\`, \`petisSold\`, \`eggsSold\`, \`sellingRate\`, \`totalAmount\`, \`paymentMethod\`,
             \`cashPaid\`, \`bankPaid\`, \`dueAmount\`, \`productImage\`, \`notes\`)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          lineId, targetId, saleId, inv, saleDate, pId, pName, cat,
          custName, custPhone, petis, eggs, rate, lineTotal, payMethod,
          cash, bank, due, item.image || null, sale.notes || ''
        ]);
      }
    } else {
      const lineId = `sph-${saleId}-1`;
      const petis = Number(sale.petisBought || 0);
      const eggs = Number(sale.eggsBought || 0);
      await pool.query(`
        INSERT INTO \`${sphTable}\`
          (\`id\`, \`shopId\`, \`saleId\`, \`invoiceNumber\`, \`saleDate\`, \`productId\`, \`productName\`, \`category\`,
           \`customerName\`, \`customerPhone\`, \`petisSold\`, \`eggsSold\`, \`sellingRate\`, \`totalAmount\`, \`paymentMethod\`,
           \`cashPaid\`, \`bankPaid\`, \`dueAmount\`, \`productImage\`, \`notes\`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        lineId, targetId, saleId, inv, saleDate, null, 'Eggs', sale.category || 'Eggs',
        custName, custPhone, petis, eggs, total > 0 ? (total / (petis || 1)) : 0, total, payMethod,
        cash, bank, due, null, sale.notes || ''
      ]);
    }
  } catch (err) {
    console.warn(`[syncSaleToBranchHistories] error updating ${sphTable}:`, err.message);
  }

  // 2. Sync into today_sales_history
  const tshTable = `${pfx}__today_sales_history`;
  try {
    const tshId = `tsh-${saleId}`;
    const itemsSummary = items.map(it => `${it.name || 'Eggs'} (x${it.quantity || 1})`).join(', ') || sale.itemsDescription || 'Eggs';
    await pool.query(`DELETE FROM \`${tshTable}\` WHERE \`saleId\` = ?`, [saleId]);
    await pool.query(`
      INSERT INTO \`${tshTable}\`
        (\`id\`, \`shopId\`, \`reportDate\`, \`invoiceNumber\`, \`saleId\`, \`customerName\`, \`customerPhone\`,
         \`category\`, \`itemsSummary\`, \`grossSale\`, \`cashPaid\`, \`bankPaid\`, \`dueAmount\`, \`paymentMethod\`,
         \`shopExpense\`, \`fuelExpense\`, \`damagedLoss\`, \`netResult\`, \`cashInDrawer\`, \`notes\`)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tshId, targetId, reportDateStr, inv, saleId, custName, custPhone,
      sale.category || 'Eggs', itemsSummary, total, cash, bank, due, payMethod,
      0, 0, 0, total, cash, sale.notes || ''
    ]);
  } catch (err) {
    console.warn(`[syncSaleToBranchHistories] error updating ${tshTable}:`, err.message);
  }
}

/**
 * Remove sale records from sale_product_history and today_sales_history upon deletion
 */
export async function removeSaleFromBranchHistories(saleId, shopId) {
  if (!saleId) return;
  const pfx = getBranchPrefix({ id: shopId });
  const sid = String(saleId);
  try {
    await pool.query(`DELETE FROM \`${pfx}__sale_product_history\` WHERE \`saleId\` = ?`, [sid]);
  } catch (_) {}
  try {
    await pool.query(`DELETE FROM \`${pfx}__today_sales_history\` WHERE \`saleId\` = ?`, [sid]);
  } catch (_) {}
}

/**
 * Auto-populate existing sales into sale_product_history and today_sales_history
 */
export async function syncAllSalesToHistoriesForBranch(pfx, shopId) {
  try {
    const salesTable = `${pfx}__sales`;
    const sphTable = `${pfx}__sale_product_history`;
    const tshTable = `${pfx}__today_sales_history`;

    const [countRows] = await pool.query(`SELECT count(*) as c FROM \`${sphTable}\``).catch(() => [[{ c: 0 }]]);
    if (countRows[0]?.c > 0) return; // Already populated

    const [sales] = await pool.query(`SELECT * FROM \`${salesTable}\``).catch(() => [[]]);
    if (!sales || sales.length === 0) return;

    console.log(`🔄 Populating ${sales.length} sales into \`${sphTable}\` & \`${tshTable}\`...`);
    for (const s of sales) {
      await syncSaleToBranchHistories(s, shopId);
    }
  } catch (_) {}
}

/**
 * Self-healing on server startup:
 * 1. Drops flat clutter tables (customer_payment_ledger, vendor_payment_ledger, etc.)
 * 2. Ensures all 18 tables exist for every active shop branch in the database
 * 3. Populates histories
 */
export async function ensureAllBranchTablesExist() {
  console.log('🚀 Running Multi-Branch Dynamic Database Manager...');

  // 1. Clean flat legacy clutter outside branch folders
  await cleanFlatLegacyTables();

  // 2. Fetch all shops from database
  try {
    const [shops] = await pool.query('SELECT id, name, status FROM shops');
    for (const s of shops) {
      await createBranchTablesForShop(s);
    }
  } catch (err) {
    console.warn('Could not query shops table, using fallback branches:', err.message);
    await createBranchTablesForShop({ id: 1, name: 'Peshawar Branch' });
    await createBranchTablesForShop({ id: 2, name: 'Mardan Branch' });
    await createBranchTablesForShop({ id: 3, name: 'Attock Branch' });
  }

  // 3. Final drop of any root clutter tables to ensure clean phpMyAdmin tree
  await cleanFlatLegacyTables();
  console.log('🎉 Multi-Branch Dynamic Database verified! All 18 tables per branch exist cleanly inside their respective branch folders.');
}

/**
 * Helper to get branch prefix dynamically from shopId
 */
export async function getBranchPrefixForShopId(shopId) {
  if (!shopId) return 'peshawar_branch';
  try {
    const [rows] = await pool.query('SELECT id, name FROM shops WHERE id = ?', [shopId]);
    if (rows && rows.length > 0) {
      return getBranchPrefix(rows[0]);
    }
  } catch (_) {}
  if (String(shopId) === '2') return 'mardan_branch';
  if (String(shopId) === '3') return 'attock_branch';
  return 'peshawar_branch';
}

/**
 * Dynamic Today Financial Calculation Engine:
 * All expenses (shop expenses, vehicle fuel, damaged loss) are strictly deducted ONLY from Today Sale.
 * Total Sale (cumulative gross sales) is 100% UNTOUCHED and NEVER deducted.
 * If expenses + damage + fuel exceed today sale, result is negative (in minus, DEFICIT).
 */
export async function getBranchTodayFinancialSummary(shopId, targetDateStr = null) {
  try {
    const pfx = await getBranchPrefixForShopId(shopId);
    const todayStr = targetDateStr || new Date().toISOString().split('T')[0];

    // 1. Cumulative All-Time Gross Sales across this branch (100% PURE, NEVER DEDUCTED)
    let totalAllTimeSales = 0;
    let totalAllTimeSalesCount = 0;
    try {
      const [allSales] = await pool.query(
        `SELECT COALESCE(SUM(totalAmount), 0) AS totalRevenue, COUNT(*) AS totalCount FROM \`${pfx}__sales\``
      );
      totalAllTimeSales = Number(allSales[0]?.totalRevenue || 0);
      totalAllTimeSalesCount = Number(allSales[0]?.totalCount || 0);
    } catch (_) {}

    // 2. Today's Gross Sales for this branch
    let todayGrossSale = 0;
    let todaySalesCash = 0;
    let todaySalesBank = 0;
    let todaySalesCredit = 0;
    let todayBillsCount = 0;
    try {
      const [todaySales] = await pool.query(
        `SELECT 
          COALESCE(SUM(totalAmount), 0) AS revenue,
          COUNT(*) AS count,
          COALESCE(SUM(COALESCE(cashPaid, 0)), 0) AS cash,
          COALESCE(SUM(COALESCE(bankPaid, 0)), 0) AS bank,
          COALESCE(SUM(COALESCE(dueAmount, 0)), 0) AS credit
        FROM \`${pfx}__sales\`
        WHERE DATE(COALESCE(saleDate, createdAt)) = ?`,
        [todayStr]
      );
      todayGrossSale = Number(todaySales[0]?.revenue || 0);
      todayBillsCount = Number(todaySales[0]?.count || 0);
      todaySalesCash = Number(todaySales[0]?.cash || 0);
      todaySalesBank = Number(todaySales[0]?.bank || 0);
      todaySalesCredit = Number(todaySales[0]?.credit || 0);
    } catch (_) {}

    // 3. Today's Shop Overhead Expenses
    let todayExpenses = 0;
    let todayExpensesCount = 0;
    let todayExpensesCash = 0;
    let todayExpensesBank = 0;
    try {
      const [todayExp] = await pool.query(
        `SELECT 
          COALESCE(SUM(amount), 0) AS total,
          COUNT(*) AS count,
          COALESCE(SUM(CASE WHEN UPPER(COALESCE(paymentMethod, 'CASH')) = 'CASH' THEN amount ELSE 0 END), 0) AS cash,
          COALESCE(SUM(CASE WHEN UPPER(COALESCE(paymentMethod, '')) IN ('BANK', 'BANK_TRANSFER', 'ONLINE', 'EASYPAISA') THEN amount ELSE 0 END), 0) AS bank
        FROM \`${pfx}__expenses\`
        WHERE DATE(COALESCE(expenseDate, createdAt, date)) = ?`,
        [todayStr]
      );
      todayExpenses = Number(todayExp[0]?.total || 0);
      todayExpensesCount = Number(todayExp[0]?.count || 0);
      todayExpensesCash = Number(todayExp[0]?.cash || 0);
      todayExpensesBank = Number(todayExp[0]?.bank || 0);
    } catch (_) {}

    // 4. Today's Vehicle Fuel Expenses
    let todayFuelExpense = 0;
    let todayFuelCount = 0;
    let todayFuelLiters = 0;
    try {
      const [todayFuel] = await pool.query(
        `SELECT 
          COALESCE(SUM(totalAmount), 0) AS total,
          COUNT(*) AS count,
          COALESCE(SUM(liters), 0) AS liters
        FROM \`${pfx}__fuel_expenses\`
        WHERE DATE(COALESCE(expenseDate, createdAt, date)) = ?`,
        [todayStr]
      );
      todayFuelExpense = Number(todayFuel[0]?.total || 0);
      todayFuelCount = Number(todayFuel[0]?.count || 0);
      todayFuelLiters = Number(todayFuel[0]?.liters || 0);
    } catch (_) {}

    // 5. Today's Damaged Products Loss
    let todayDamagedLoss = 0;
    let todayDamagedCount = 0;
    let todayDamagedEggs = 0;
    try {
      const [todayDam] = await pool.query(
        `SELECT 
          COALESCE(SUM(COALESCE(totalLoss, lossAmount, 0)), 0) AS total,
          COUNT(*) AS count,
          COALESCE(SUM(COALESCE(deductedEggs, eggQuantity, 0)), 0) AS eggs
        FROM \`${pfx}__damaged_products\`
        WHERE DATE(COALESCE(damageDate, createdAt, date)) = ?`,
        [todayStr]
      );
      todayDamagedLoss = Number(todayDam[0]?.total || 0);
      todayDamagedCount = Number(todayDam[0]?.count || 0);
      todayDamagedEggs = Number(todayDam[0]?.eggs || 0);
    } catch (_) {}

    // 6. EXACT CALCULATION:
    // Deduct expenses, fuel, and damage strictly from Today Sale only!
    // NEVER deduct from Total Sale!
    const todayTotalDeductions = todayExpenses + todayFuelExpense + todayDamagedLoss;
    const todayNetResult = todayGrossSale - todayTotalDeductions;
    const isProfit = todayNetResult >= 0;
    const netCashInDrawer = todaySalesCash - todayExpensesCash;

    return {
      success: true,
      shopId,
      branchPrefix: pfx,
      reportDate: todayStr,
      // Total Sales (Pure, Untouched)
      totalAllTimeSales,
      totalAllTimeSalesCount,
      // Today Breakdown
      todayGrossSale,
      todayBillsCount,
      todaySalesCash,
      todaySalesBank,
      todaySalesCredit,
      // Today Deductions
      todayExpenses,
      todayExpensesCount,
      todayExpensesCash,
      todayExpensesBank,
      todayFuelExpense,
      todayFuelCount,
      todayFuelLiters,
      todayDamagedLoss,
      todayDamagedCount,
      todayDamagedEggs,
      todayTotalDeductions,
      // Net Performance
      todayNetResult,
      isProfit,
      netCashInDrawer
    };
  } catch (err) {
    console.error('[getBranchTodayFinancialSummary] error:', err);
    return {
      success: false,
      error: err.message,
      todayGrossSale: 0,
      todayTotalDeductions: 0,
      todayNetResult: 0,
      isProfit: true,
      totalAllTimeSales: 0
    };
  }
}


