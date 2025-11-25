// src/routes/+page.server.js
import { redirect } from '@sveltejs/kit';

export function load() {
  // change '/auth/register' if your signup path is different (e.g. '/auth' or '/signup')
  throw redirect(307, '/auth/register');
}
