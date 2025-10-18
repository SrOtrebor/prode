const pool = require('./db');

const migrate = async () => {
  const client = await pool.connect();
  try {
    console.log('Running final migration script...');

    // Add is_active and is_muted to users if they don't exist
    const usersColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'users'
        AND column_name IN ('is_active', 'is_muted');
    `);

    if (!usersColumns.rows.find(row => row.column_name === 'is_active')) {
      console.log('Adding is_active column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT false;');
    }

    if (!usersColumns.rows.find(row => row.column_name === 'is_muted')) {
      console.log('Adding is_muted column to users table...');
      await client.query('ALTER TABLE users ADD COLUMN is_muted BOOLEAN NOT NULL DEFAULT false;');
    }

    // Create vip_statuses table if it doesn't exist
    const vipStatusesTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE  table_schema = 'public'
        AND    table_name   = 'vip_statuses'
      );
    `);

    if (!vipStatusesTable.rows[0].exists) {
      console.log('Creating vip_statuses table...');
      await client.query(`
        CREATE TABLE vip_statuses (
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          created_at TIMESTAMPTZ DEFAULT now(),
          PRIMARY KEY (user_id, event_id)
        );
      `);
    }

    // Rename match_date to match_datetime if it exists
    const matchesColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name   = 'matches'
        AND column_name IN ('match_date', 'match_datetime');
    `);

    if (matchesColumns.rows.find(row => row.column_name === 'match_date') && !matchesColumns.rows.find(row => row.column_name === 'match_datetime')) {
      console.log('Renaming match_date to match_datetime in matches table...');
      await client.query('ALTER TABLE matches RENAME COLUMN match_date TO match_datetime;');
    }

    console.log('Final migration script completed successfully.');
  } catch (error) {
    console.error('Error running final migration script:', error);
    process.exit(1);
  } finally {
    client.release();
  }
};

// Execute the migration
if (require.main === module) {
  migrate().then(() => process.exit());
}

module.exports = migrate;