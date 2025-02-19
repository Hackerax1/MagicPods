import { json } from '@sveltejs/kit';
import { register } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const { email, username, password } = await request.json();

  try {
    const newUser = await register(email, username, password);
    return json({ success: true, user: newUser });
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}

export async function GET({ request }: RequestEvent) {
  const { email, username, password } = await request.json();

  try {
    const newUser = await register(email, username, password);
    return json({ success: true, user: newUser });
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}