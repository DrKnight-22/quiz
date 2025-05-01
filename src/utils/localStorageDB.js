const DB_NAME = 'quizAppData';
const DB_VERSION = '1.1'; // Incremented version

export const db = {
  init: () => {
    try {
      console.log(`[DB] Initializing database v${DB_VERSION}`);
      
      if (!localStorage.getItem(DB_NAME)) {
        console.log('[DB] Creating new database');
        const initialData = {
          meta: {
            version: DB_VERSION,
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString()
          },
          users: [
            {
              id: 'admin-1',
              email: 'admin@example.com',
              password: 'admin123',
              full_name: 'Admin User',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          profiles: [
            {
              id: 'admin-1',
              full_name: 'Admin User',
              email: 'admin@example.com',
              role: 'admin',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ],
          quizzes: [],
          questions: [],
          options: [],
          quiz_results: [],
          courses: [],
          admin_registration_requests: []
        };
        localStorage.setItem(DB_NAME, JSON.stringify(initialData));
        return true;
      }
      
      // Validate and migrate existing database
      const data = JSON.parse(localStorage.getItem(DB_NAME));
      
      // Migration to v1.1 - Ensure all tables exist
      if (!data.courses) data.courses = [];
      if (!data.admin_registration_requests) data.admin_registration_requests = [];
      
      if (!data.meta || data.meta.version !== DB_VERSION) {
        console.log('[DB] Migrating database to new version');
        data.meta = {
          version: DB_VERSION,
          createdAt: data.meta?.createdAt || new Date().toISOString(),
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(DB_NAME, JSON.stringify(data));
      }
      
      return true;
    } catch (error) {
      console.error('[DB] Initialization failed:', error);
      throw new Error('Failed to initialize database');
    }
  },

  get: (table) => {
    try {
      const data = JSON.parse(localStorage.getItem(DB_NAME));
      if (!data || !data[table]) {
        console.warn(`[DB] Table ${table} not found, returning empty array`);
        return [];
      }
      return data[table];
    } catch (error) {
      console.error(`[DB] Failed to get ${table}:`, error);
      throw new Error(`Failed to retrieve data from ${table}`);
    }
  },

  getById: (table, id) => {
    try {
      const items = db.get(table);
      const item = items.find(item => item.id === id);
      if (!item) {
        console.warn(`[DB] Item ${id} not found in ${table}`);
      }
      return item || null;
    } catch (error) {
      console.error(`[DB] Failed to get by ID from ${table}:`, error);
      throw new Error(`Failed to retrieve item ${id} from ${table}`);
    }
  },

  insert: (table, item) => {
    try {
      const data = JSON.parse(localStorage.getItem(DB_NAME));
      
      if (!data[table]) {
        console.log(`[DB] Creating new table ${table}`);
        data[table] = [];
      }
      
      const newItem = {
        ...item,
        id: item.id || `${table}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
        created_at: item.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      data[table].push(newItem);
      data.meta.lastModified = new Date().toISOString();
      
      localStorage.setItem(DB_NAME, JSON.stringify(data));
      return { data: newItem };
    } catch (error) {
      console.error(`[DB] Failed to insert into ${table}:`, error);
      throw new Error(`Failed to insert into ${table}`);
    }
  },

  update: (table, id, updates) => {
    try {
      const data = JSON.parse(localStorage.getItem(DB_NAME));
      const index = data[table].findIndex(item => item.id === id);
      
      if (index === -1) {
        throw new Error(`Item ${id} not found in ${table}`);
      }
      
      data[table][index] = {
        ...data[table][index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      data.meta.lastModified = new Date().toISOString();
      
      localStorage.setItem(DB_NAME, JSON.stringify(data));
      return { data: data[table][index] };
    } catch (error) {
      console.error(`[DB] Failed to update ${table}:`, error);
      throw new Error(`Failed to update item ${id} in ${table}`);
    }
  },

  delete: (table, id) => {
    try {
      const data = JSON.parse(localStorage.getItem(DB_NAME));
      const initialLength = data[table].length;
      
      data[table] = data[table].filter(item => item.id !== id);
      data.meta.lastModified = new Date().toISOString();
      
      if (initialLength === data[table].length) {
        console.warn(`[DB] Item ${id} not found in ${table} for deletion`);
      }
      
      localStorage.setItem(DB_NAME, JSON.stringify(data));
      return { success: true };
    } catch (error) {
      console.error(`[DB] Failed to delete from ${table}:`, error);
      throw new Error(`Failed to delete item ${id} from ${table}`);
    }
  },

  find: (table, conditions) => {
    try {
      const items = db.get(table);
      return items.find(item => {
        return Object.keys(conditions).every(key => item[key] === conditions[key]);
      }) || null;
    } catch (error) {
      console.error(`[DB] Failed to find in ${table}:`, error);
      throw new Error(`Failed to find in ${table}`);
    }
  },

  filter: (table, conditions) => {
    try {
      const items = db.get(table);
      return items.filter(item => {
        return Object.keys(conditions).every(key => item[key] === conditions[key]);
      });
    } catch (error) {
      console.error(`[DB] Failed to filter ${table}:`, error);
      throw new Error(`Failed to filter ${table}`);
    }
  },

  // Utility method for debugging
  inspect: () => {
    try {
      return JSON.parse(localStorage.getItem(DB_NAME));
    } catch (error) {
      console.error('[DB] Inspection failed:', error);
      return null;
    }
  },

  // Reset the entire database (use with caution)
  reset: () => {
    try {
      localStorage.removeItem(DB_NAME);
      db.init();
      return true;
    } catch (error) {
      console.error('[DB] Reset failed:', error);
      return false;
    }
  }
};

// Initialize the database
db.init();