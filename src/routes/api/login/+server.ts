import { json } from '@sveltejs/kit';
import { login, setSessionTokenCookie } from '$lib/server/auth';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST(event: RequestEvent) {
  const { request, cookies } = event;
  const { identifier, password } = await request.json();

  try {
    const { user, session, token } = await login(identifier, password);
    
    // Use the token to set the cookie properly
    setSessionTokenCookie(event, token, session.expiresAt);
    
    return json({ success: true, user });
  } catch (error) {
    if (error instanceof Error) {
      return json({ success: false, error: error.message }, { status: 401 });
    } else {
      return json({ success: false, error: 'Unknown error' }, { status: 500 });
    }
  }
}
