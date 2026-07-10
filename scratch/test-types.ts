import { supabase } from '../src/lib/supabase';

async function test() {
  const result = await supabase.from('configuracion').select('*');
  console.log(result.data);
}
