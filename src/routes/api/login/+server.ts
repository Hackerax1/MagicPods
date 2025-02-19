import { json } from '@sveltejs/kit';
import { login } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const { identifier, password } = await request.json();

  try {
    const { user, session } = await login(identifier, password);
    return json({ success: true, user, session });
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}

export async function GET({ request }: RequestEvent) {
  const { identifier, password } = await request.json();

  try {
    const { user, session } = await login(identifier, password);
    return json({ success: true, user, session });
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 500 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}