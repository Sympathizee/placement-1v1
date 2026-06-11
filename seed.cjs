const { Client } = require('pg');
const client = new Client('postgresql://postgres:9mXSLlTUWKMM2ELy@db.jhfxsbirrrvdwuybjijb.supabase.co:5432/postgres');

client.connect()
  .then(async () => {
    const res = await client.query('SELECT count(*) FROM public.tournaments;');
    if (parseInt(res.rows[0].count) === 0) {
       await client.query(`
         INSERT INTO public.tournaments 
         (name, player1_name, player1_avatar, player1_description, player2_name, player2_avatar, player2_description, status) 
         VALUES (
           'The Ultimate Showdown 2026', 
           'CyberNinja', 'https://api.dicebear.com/7.x/bottts/svg?seed=CyberNinja', 'Master of the digital realm, swift and deadly.',
           'NeoMatrix', 'https://api.dicebear.com/7.x/bottts/svg?seed=NeoMatrix', 'The chosen one, bending reality to their will.',
           'in_progress'
         )
       `);
       console.log('Inserted default tournament');
    } else {
       console.log('Tournament already exists');
    }
  })
  .catch(console.error)
  .finally(() => client.end());
