import { json } from '@sveltejs/kit';
import { register, login } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const { action, email, username, password, identifier } = await request.json();

  try {
    if (action === 'register') {
      const newUser = await register(email, username, password);
      return json({ success: true, user: newUser });
    } else if (action === 'login') {
      const { user, session } = await login(identifier, password);
      return json({ success: true, user, session });
    } else {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}