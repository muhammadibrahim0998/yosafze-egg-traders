import Shop from '../models/Shop.js';

export async function resolveShopId(inputShopId) {
  if (!inputShopId) return null;

  const raw = String(inputShopId).trim();

  // 1. Direct ID lookup in MySQL
  const sById = await Shop.findById(raw);
  if (sById) return String(sById.id);

  // 2. Find by name keyword (e.g. 'peshawar', 'attock', 'mardan')
  const sByName = await Shop.findOne({ name: { $regex: raw }, status: 'active' });
  if (sByName) return String(sByName.id);

  // 3. Fallback to first active shop in database
  const first = await Shop.findOne({ status: 'active' });
  return first ? String(first.id) : raw;
}
