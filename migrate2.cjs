const { Client } = require('pg');
const client = new Client('postgresql://postgres:9mXSLlTUWKMM2ELy@db.jhfxsbirrrvdwuybjijb.supabase.co:5432/postgres');

client.connect()
  .then(async () => {
    const sql = `
      ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS player1_description TEXT;
      ALTER TABLE public.tournaments ADD COLUMN IF NOT EXISTS player2_description TEXT;
    `;
    await client.query(sql);
    console.log('Added missing columns');
  })
  .catch(console.error)
  .finally(() => client.end());
