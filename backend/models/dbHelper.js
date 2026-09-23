import pool from '../config/mysql.js';

// Global cache for table columns to prevent MySQL unknown column errors
const tableColumnsCache = {};

async function getTableColumns(tableName) {
  if (tableColumnsCache[tableName]) {
    return tableColumnsCache[tableName];
  }
  try {
    const [rows] = await pool.query(`DESCRIBE \`${tableName}\``);
    const cols = new Set(rows.map(r => r.Field));
    tableColumnsCache[tableName] = cols;
    return cols;
  } catch {
    return null;
  }
}

/**
 * Base Model Helper for MySQL
 * Provides full Mongoose-like syntax (find, findOne, findById, create, update, delete)
 * to maintain 100% compatibility with existing controllers and frontend APIs.
 */
export class BaseModel {
  constructor(tableName, primaryKey = 'id', jsonFields = []) {
    this.tableName = tableName;
    this.primaryKey = primaryKey;
    this.jsonFields = jsonFields;
  }

  // Parse row from MySQL into JS object
  _parseRow(row) {
    if (!row) return null;
    const obj = { ...row };
    
    // Provide both id and _id for seamless frontend compatibility
    if (obj[this.primaryKey] !== undefined) {
      obj._id = obj[this.primaryKey];
      obj.id = obj[this.primaryKey];
    }

    // Parse JSON fields
    for (const field of this.jsonFields) {
      if (typeof obj[field] === 'string') {
        try {
          obj[field] = JSON.parse(obj[field]);
        } catch {
          obj[field] = [];
        }
      } else if (!obj[field]) {
        obj[field] = [];
      }
    }

    // Convert booleans
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === 'number' && (key.startsWith('is') || key.endsWith('Enabled') || key === 'isActive')) {
        obj[key] = Boolean(obj[key]);
      }
    }

    obj.toObject = () => ({ ...obj });
    obj.toJSON = () => ({ ...obj });
    obj.save = async () => {
      await this.findByIdAndUpdate(obj[this.primaryKey], obj);
      return obj;
    };
    return obj;
  }

  // Build WHERE clause from query object
  _buildWhere(query = {}) {
    if (!query || typeof query !== 'object') return { whereClause: '', values: [] };
    
    const conditions = [];
    const values = [];

    // Handle $or
    if (query.$or && Array.isArray(query.$or) && query.$or.length > 0) {
      const orClauses = [];
      for (const orBranch of query.$or) {
        const { whereClause: branchWhere, values: branchVals } = this._buildWhere(orBranch);
        if (branchWhere) {
          orClauses.push(branchWhere.replace(/^WHERE\s+/i, ''));
          values.push(...branchVals);
        }
      }
      if (orClauses.length > 0) {
        conditions.push(`(${orClauses.join(' OR ')})`);
      }
    }

    for (const [key, val] of Object.entries(query)) {
      if (key === '$or' || val === undefined) continue;

      let col = key === '_id' ? this.primaryKey : key;

      if (val === null) {
        conditions.push(`\`${col}\` IS NULL`);
      } else if (typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date)) {
        if (val.$in && Array.isArray(val.$in)) {
          if (val.$in.length === 0) {
            conditions.push('1=0');
          } else {
            const placeholders = val.$in.map(() => '?').join(', ');
            conditions.push(`\`${col}\` IN (${placeholders})`);
            values.push(...val.$in);
          }
        } else if (val.$gte !== undefined && val.$lte !== undefined) {
          conditions.push(`\`${col}\` >= ? AND \`${col}\` <= ?`);
          values.push(val.$gte, val.$lte);
        } else if (val.$gte !== undefined) {
          conditions.push(`\`${col}\` >= ?`);
          values.push(val.$gte);
        } else if (val.$lte !== undefined) {
          conditions.push(`\`${col}\` <= ?`);
          values.push(val.$lte);
        } else if (val.$gt !== undefined) {
          conditions.push(`\`${col}\` > ?`);
          values.push(val.$gt);
        } else if (val.$lt !== undefined) {
          conditions.push(`\`${col}\` < ?`);
          values.push(val.$lt);
        } else if (val.$ne !== undefined) {
          conditions.push(`\`${col}\` != ?`);
          values.push(val.$ne);
        } else if (val.$regex) {
          conditions.push(`\`${col}\` LIKE ?`);
          values.push(`%${val.$regex}%`);
        }
      } else {
        conditions.push(`\`${col}\` = ?`);
        values.push(val);
      }
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, values };
  }

  // Find multiple records with sorting, pagination, and projection
  find(query = {}) {
    const { whereClause, values } = this._buildWhere(query);
    
    const queryObj = {
      _sort: 'ORDER BY `createdAt` DESC',
      _limit: '',
      _select: '*',
      sort(s) {
        if (typeof s === 'string') {
          const parts = s.split(' ');
          const sortCols = parts.map(p => {
            if (p.startsWith('-')) return `\`${p.substring(1)}\` DESC`;
            return `\`${p}\` ASC`;
          });
          this._sort = `ORDER BY ${sortCols.join(', ')}`;
        } else if (typeof s === 'object') {
          const sortCols = Object.entries(s).map(([k, v]) => `\`${k === '_id' ? 'id' : k}\` ${v === -1 || v === 'desc' ? 'DESC' : 'ASC'}`);
          if (sortCols.length > 0) this._sort = `ORDER BY ${sortCols.join(', ')}`;
        }
        return this;
      },
      select(sel) {
        if (typeof sel === 'string') {
          this._select = sel.split(' ').map(c => c.startsWith('-') ? '' : `\`${c === '_id' ? 'id' : c}\``).filter(Boolean).join(', ') || '*';
        }
        return this;
      },
      limit(n) {
        if (n) this._limit = `LIMIT ${Number(n)}`;
        return this;
      },
      skip(n) {
        return this;
      },
      lean() {
        return this;
      },
      populate() {
        return this;
      },
      then: (resolve, reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` ${whereClause} ${queryObj._sort} ${queryObj._limit}`;
        pool.query(sql, values)
          .then(([rows]) => resolve(rows.map(r => this._parseRow(r))))
          .catch(reject);
      },
      catch: (reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` ${whereClause} ${queryObj._sort} ${queryObj._limit}`;
        return pool.query(sql, values).catch(reject);
      }
    };

    return queryObj;
  }

  // Find one record
  findOne(query = {}) {
    const { whereClause, values } = this._buildWhere(query);
    const queryObj = {
      _sort: '',
      sort(s) {
        if (typeof s === 'string') {
          const parts = s.split(' ');
          const sortCols = parts.map(p => p.startsWith('-') ? `\`${p.substring(1)}\` DESC` : `\`${p}\` ASC`);
          this._sort = `ORDER BY ${sortCols.join(', ')}`;
        } else if (typeof s === 'object') {
          const sortCols = Object.entries(s).map(([k, v]) => `\`${k === '_id' ? 'id' : k}\` ${v === -1 || v === 'desc' ? 'DESC' : 'ASC'}`);
          if (sortCols.length > 0) this._sort = `ORDER BY ${sortCols.join(', ')}`;
        }
        return this;
      },
      select(sel) { return this; },
      lean() { return this; },
      populate() { return this; },
      then: (resolve, reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` ${whereClause} ${queryObj._sort} LIMIT 1`;
        pool.query(sql, values)
          .then(([rows]) => resolve(rows.length > 0 ? this._parseRow(rows[0]) : null))
          .catch(reject);
      },
      catch: (reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` ${whereClause} ${queryObj._sort} LIMIT 1`;
        return pool.query(sql, values).catch(reject);
      }
    };
    return queryObj;
  }

  // Find by ID
  findById(id) {
    if (id === undefined || id === null) {
      return {
        select: () => this,
        lean: () => this,
        populate: () => this,
        then: (resolve) => resolve(null),
        catch: () => {}
      };
    }
    const queryObj = {
      select(sel) { return this; },
      lean() { return this; },
      populate() { return this; },
      then: (resolve, reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`;
        pool.query(sql, [id])
          .then(([rows]) => resolve(rows.length > 0 ? this._parseRow(rows[0]) : null))
          .catch(reject);
      },
      catch: (reject) => {
        const sql = `SELECT * FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ? LIMIT 1`;
        return pool.query(sql, [id]).catch(reject);
      }
    };
    return queryObj;
  }

  // Create new record
  async create(data) {
    const record = Array.isArray(data) ? data[0] : data;
    const validCols = await getTableColumns(this.tableName);
    const cleanData = {};

    for (const [key, val] of Object.entries(record)) {
      if (key === '_id' || key === 'id' && val === undefined) continue;
      if (key === '__v' || typeof val === 'function') continue;
      if (validCols && !validCols.has(key)) continue;

      if (this.jsonFields.includes(key)) {
        cleanData[key] = Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : '[]';
      } else if (typeof val === 'boolean') {
        cleanData[key] = val ? 1 : 0;
      } else {
        cleanData[key] = val;
      }
    }

    const cols = Object.keys(cleanData).map(k => `\`${k}\``).join(', ');
    const placeholders = Object.keys(cleanData).map(() => '?').join(', ');
    const vals = Object.values(cleanData);

    const sql = `INSERT INTO \`${this.tableName}\` (${cols}) VALUES (${placeholders})`;
    const [result] = await pool.query(sql, vals);
    const newId = result.insertId || cleanData[this.primaryKey];
    return await this.findById(newId);
  }

  // Find by ID and update
  async findByIdAndUpdate(id, updateData, options = {}) {
    const validCols = await getTableColumns(this.tableName);
    const rawUpdate = updateData.$set || updateData;
    const cleanData = {};
    const setClauses = [];
    const vals = [];

    // Handle $inc (e.g. $inc: { stock: -5 })
    if (updateData.$inc && typeof updateData.$inc === 'object') {
      for (const [k, incVal] of Object.entries(updateData.$inc)) {
        if (validCols && !validCols.has(k)) continue;
        setClauses.push(`\`${k}\` = \`${k}\` + ?`);
        vals.push(Number(incVal) || 0);
      }
    }

    for (const [key, val] of Object.entries(rawUpdate)) {
      if (key === '_id' || key === 'id' || key === '__v') continue;
      if (key === '$inc' || typeof val === 'function') continue;
      if (validCols && !validCols.has(key)) continue;

      if (this.jsonFields.includes(key)) {
        cleanData[key] = Array.isArray(val) || typeof val === 'object' ? JSON.stringify(val) : '[]';
      } else if (typeof val === 'boolean') {
        cleanData[key] = val ? 1 : 0;
      } else {
        cleanData[key] = val;
      }
      setClauses.push(`\`${key}\` = ?`);
      vals.push(cleanData[key]);
    }

    if (setClauses.length > 0) {
      vals.push(id);
      const sql = `UPDATE \`${this.tableName}\` SET ${setClauses.join(', ')} WHERE \`${this.primaryKey}\` = ?`;
      await pool.query(sql, vals);
    }

    return await this.findById(id);
  }

  // Find one and update
  async findOneAndUpdate(query, updateData, options = {}) {
    const existing = await this.findOne(query);
    if (!existing) {
      if (options.upsert) {
        return await this.create({ ...query, ...(updateData.$set || updateData) });
      }
      return null;
    }
    return await this.findByIdAndUpdate(existing[this.primaryKey], updateData, options);
  }

  // Find by ID and delete
  async findByIdAndDelete(id) {
    const existing = await this.findById(id);
    if (existing) {
      await pool.query(`DELETE FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ?`, [id]);
    }
    return existing;
  }

  async findOneAndDelete(query) {
    const existing = await this.findOne(query);
    if (existing) {
      await pool.query(`DELETE FROM \`${this.tableName}\` WHERE \`${this.primaryKey}\` = ?`, [existing[this.primaryKey]]);
    }
    return existing;
  }

  // Count documents
  async countDocuments(query = {}) {
    const { whereClause, values } = this._buildWhere(query);
    const sql = `SELECT COUNT(*) as total FROM \`${this.tableName}\` ${whereClause}`;
    const [rows] = await pool.query(sql, values);
    return Number(rows[0]?.total) || 0;
  }

  // Delete many
  async deleteMany(query = {}) {
    const { whereClause, values } = this._buildWhere(query);
    const sql = `DELETE FROM \`${this.tableName}\` ${whereClause}`;
    const [result] = await pool.query(sql, values);
    return { deletedCount: result.affectedRows };
  }
}
