import pool from '../config/mysql.js';

export async function initPaymentLedgerTables() {
  console.log('🚀 Initializing dynamic MySQL tables for Customer & Vendor Payment Ledgers across all branches...');

  const branches = [
    { shopId: 1, prefix: 'peshawar_branch', name: 'Peshawar Branch' },
    { shopId: 2, prefix: 'mardan_branch', name: 'Mardan Branch' },
    { shopId: 3, prefix: 'attock_branch', name: 'Attock Branch' },
    { shopId: 4, prefix: 'peshawar_branch', name: 'Peshawar Karkhano' }
  ];

  try {
    const [shops] = await pool.query('SELECT id, name FROM shops');
    for (const s of shops) {
      const sName = (s.name || '').toLowerCase();
      let pfx = 'peshawar_branch';
      if (sName.includes('mardan')) pfx = 'mardan_branch';
      else if (sName.includes('attock')) pfx = 'attock_branch';
      else if (sName.includes('peshawar') || sName.includes('peshawer')) pfx = 'peshawar_branch';
      else pfx = `shop_${s.id}_branch`;

      if (!branches.some(b => b.shopId === s.id)) {
        branches.push({ shopId: s.id, prefix: pfx, name: s.name });
      }
    }
  } catch (err) {
    console.warn('Could not query shops table, using default branch list:', err.message);
  }

  // For each branch, create isolated table inside that branch: branch_prefix__customer_payment_ledger & branch_prefix__vendor_payment_ledger
  const distinctPrefixes = [...new Set(branches.map(b => b.prefix))];

  for (const pfx of distinctPrefixes) {
    const custTable = `${pfx}__customer_payment_ledger`;
    const vndTable = `${pfx}__vendor_payment_ledger`;

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${custTable}\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`shopId\` INT NOT NULL DEFAULT 1,
        \`saleId\` VARCHAR(255) NULL,
        \`invoiceNumber\` VARCHAR(100) NULL,
        \`customerName\` VARCHAR(255) NULL,
        \`customerPhone\` VARCHAR(50) NULL,
        \`category\` VARCHAR(100) DEFAULT 'Eggs',
        \`itemsDescription\` TEXT NULL,
        \`petisBought\` DECIMAL(10,2) DEFAULT 0.00,
        \`eggsBought\` INT DEFAULT 0,
        \`totalAmount\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`cashPaid\` DECIMAL(12,2) DEFAULT 0.00,
        \`bankPaid\` DECIMAL(12,2) DEFAULT 0.00,
        \`dueAmount\` DECIMAL(12,2) DEFAULT 0.00,
        \`paymentMethod\` VARCHAR(50) DEFAULT 'CASH',
        \`status\` VARCHAR(50) DEFAULT 'PAID',
        \`date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY \`idx_cust_ledger_shopId\` (\`shopId\`),
        KEY \`idx_cust_ledger_date\` (\`date\`),
        KEY \`idx_cust_ledger_invoice\` (\`invoiceNumber\`),
        KEY \`idx_cust_ledger_customer\` (\`customerName\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS \`${vndTable}\` (
        \`id\` VARCHAR(255) PRIMARY KEY,
        \`shopId\` INT NOT NULL DEFAULT 1,
        \`purchaseId\` VARCHAR(255) NULL,
        \`supplierName\` VARCHAR(255) NULL,
        \`supplierPhone\` VARCHAR(50) NULL,
        \`supplierLocation\` VARCHAR(255) NULL,
        \`productName\` VARCHAR(255) NULL,
        \`category\` VARCHAR(100) DEFAULT 'Eggs',
        \`petisPurchased\` DECIMAL(10,2) DEFAULT 0.00,
        \`eggQuantity\` INT DEFAULT 0,
        \`unitType\` VARCHAR(50) DEFAULT 'peti',
        \`buyCost\` DECIMAL(12,2) DEFAULT 0.00,
        \`totalCost\` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
        \`amountPaid\` DECIMAL(12,2) DEFAULT 0.00,
        \`cashPaid\` DECIMAL(12,2) DEFAULT 0.00,
        \`bankPaid\` DECIMAL(12,2) DEFAULT 0.00,
        \`dueAmount\` DECIMAL(12,2) DEFAULT 0.00,
        \`paymentMethod\` VARCHAR(50) DEFAULT 'Cash',
        \`status\` VARCHAR(50) DEFAULT 'PAID',
        \`date\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        KEY \`idx_vnd_ledger_shopId\` (\`shopId\`),
        KEY \`idx_vnd_ledger_date\` (\`date\`),
        KEY \`idx_vnd_ledger_supplier\` (\`supplierName\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log(`✅ Verified MySQL branch tables inside branch: \`${custTable}\` & \`${vndTable}\``);
  }

  // Remove outside root tables so they only appear inside branch folders in phpMyAdmin
  try {
    await pool.query('DROP TABLE IF EXISTS `customer_payment_ledger`');
    await pool.query('DROP TABLE IF EXISTS `vendor_payment_ledger`');
    console.log('🧹 Cleaned up outside root tables (tables are now strictly inside branch folders).');
  } catch (cleanErr) {
    console.warn('Notice dropping outside tables:', cleanErr.message);
  }

  // 4. Populate / Sync Initial Data from Sales and Purchases into Branch Tables
  try {
    for (const b of branches) {
      const pfx = b.prefix;
      const sId = b.shopId;
      const salesTable = `${pfx}__sales`;
      const purchasesTable = `${pfx}__purchases`;
      const custTable = `${pfx}__customer_payment_ledger`;
      const vndTable = `${pfx}__vendor_payment_ledger`;

      // Sync sales into custTable if custTable is empty
      const [existingCust] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${custTable}\` WHERE shopId = ?`, [sId]).catch(() => [[{ cnt: 0 }]]);
      if (!existingCust || existingCust[0]?.cnt === 0) {
        // Check if sales exist
        const [salesRows] = await pool.query(`SELECT * FROM \`${salesTable}\` WHERE shopId = ?`, [sId]).catch(() => [[]]);
        if (salesRows && salesRows.length > 0) {
          for (const s of salesRows) {
            const sid = s.id || s._id;
            const total = Number(s.totalAmount || 0);
            const cash = Number(s.cashPaid || 0);
            const bank = Number(s.bankPaid || 0);
            const due = Number(s.dueAmount || 0);
            await pool.query(`
              INSERT IGNORE INTO \`${custTable}\`
              (id, shopId, saleId, invoiceNumber, customerName, customerPhone, category, itemsDescription, petisBought, eggsBought, totalAmount, cashPaid, bankPaid, dueAmount, paymentMethod, status, date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              `cpl-${sid}`,
              sId,
              String(sid),
              s.invoiceNumber || `INV-${sid}`,
              s.customerName || 'Walk-in Customer',
              s.customerPhone || '',
              s.category || 'Eggs',
              s.itemsDescription || 'Eggs Stock',
              Number(s.petisBought || 0),
              Number(s.eggsBought || 0),
              total,
              cash,
              bank,
              due,
              s.paymentMethod || 'CASH',
              due === 0 ? 'PAID' : (cash > 0 || bank > 0 ? 'PARTIAL' : 'CREDIT'),
              s.saleDate || s.createdAt || new Date()
            ]).catch(() => {});
          }
        }
      }

      // Sync purchases into vndTable if vndTable is empty
      const [existingVnd] = await pool.query(`SELECT COUNT(*) AS cnt FROM \`${vndTable}\` WHERE shopId = ?`, [sId]).catch(() => [[{ cnt: 0 }]]);
      if (!existingVnd || existingVnd[0]?.cnt === 0) {
        const [purchRows] = await pool.query(`SELECT * FROM \`${purchasesTable}\` WHERE shopId = ?`, [sId]).catch(() => [[]]);
        if (purchRows && purchRows.length > 0) {
          for (const p of purchRows) {
            const pid = p.id || p._id;
            const total = Number(p.totalCost || 0);
            const paid = Number(p.amountPaid || 0);
            const cash = Number(p.cashPaid || 0);
            const bank = Number(p.bankPaid || 0);
            const due = Number(p.dueAmount || 0);
            await pool.query(`
              INSERT IGNORE INTO \`${vndTable}\`
              (id, shopId, purchaseId, supplierName, supplierPhone, supplierLocation, productName, category, petisPurchased, eggQuantity, unitType, buyCost, totalCost, amountPaid, cashPaid, bankPaid, dueAmount, paymentMethod, status, date)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `, [
              `vpl-${pid}`,
              sId,
              String(pid),
              p.supplierName || 'Farm Vendor',
              p.supplierPhone || '',
              p.supplierLocation || '',
              p.productName || 'Eggs Stock',
              p.category || 'Eggs',
              Number(p.petisPurchased || p.petiQuantity || 0),
              Number(p.eggQuantity || 0),
              p.unitType || 'peti',
              Number(p.buyCost || 0),
              total,
              paid,
              cash,
              bank,
              due,
              p.paymentMethod || 'Cash',
              due === 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'CREDIT'),
              p.purchaseDate || p.createdAt || new Date()
            ]).catch(() => {});
          }
        }
      }
    }
  } catch (syncErr) {
    console.warn('Initial ledger table data sync notice:', syncErr.message);
  }

  console.log('✨ All MySQL Customer & Vendor Payment Ledger tables created and ready for all branches!');
}

export default initPaymentLedgerTables;
