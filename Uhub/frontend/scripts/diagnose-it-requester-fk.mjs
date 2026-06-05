/**
 * Diagnose it_requests.requester_id FK — run: node scripts/diagnose-it-requester-fk.mjs
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const env = Object.fromEntries(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const supabase = createClient(env.REACT_APP_SUPABASE_URL, env.REACT_APP_SUPABASE_ANON_KEY);

async function main() {
  console.log('=== users sample (first 5) ===');
  const { data: users, error: uErr } = await supabase
    .from('users')
    .select('id, auth_user_id, email, role, employee_id')
    .limit(5);
  console.log(uErr?.message || users);

  console.log('\n=== employees sample (first 3) ===');
  const { data: emps, error: eErr } = await supabase
    .from('employees')
    .select('id, auth_user_id, email')
    .limit(3);
  console.log(eErr?.message || emps);

  console.log('\n=== recent it_requests requester_id ===');
  const { data: reqs, error: rErr } = await supabase
    .from('it_requests')
    .select('id, title, requester_id, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  console.log(rErr?.message || reqs);

  if (reqs?.length) {
    const rid = reqs[0].requester_id;
    console.log('\n=== FK check for latest requester_id:', rid, '===');
    const checks = await Promise.all([
      supabase.from('users').select('id, email').eq('id', rid).maybeSingle(),
      supabase.from('users').select('id, email').eq('auth_user_id', rid).maybeSingle(),
      supabase.from('employees').select('id, email').eq('id', rid).maybeSingle(),
    ]);
    console.log('matches users.id:', checks[0].data, checks[0].error?.message);
    console.log('matches users.auth_user_id:', checks[1].data, checks[1].error?.message);
    console.log('matches employees.id:', checks[2].data, checks[2].error?.message);
  }

  console.log('\n=== RPC / constraint probe (may fail without service role) ===');
  const { data: rpcTest, error: rpcErr } = await supabase.rpc('get_it_request_fk_info').maybeSingle?.();
  if (rpcErr) console.log('get_it_request_fk_info:', rpcErr.message);
  else console.log(rpcTest);
}

main().catch(console.error);
