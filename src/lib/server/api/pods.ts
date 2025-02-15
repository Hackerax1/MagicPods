import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { v4 as uuidv4 } from 'uuid';
import { pod, podMembership } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

import type { RequestEvent } from '@sveltejs/kit';

export async function POST({ request }: RequestEvent) {
  const { action, podName, userId, podId, newUserId } = await request.json();

  try {
    if (action === 'createPod') {
      const newPod = {
        id: uuidv4(),
        name: podName,
        userId: userId
      };
      await db.insert(pod).values(newPod);
      await db.insert(podMembership).values({ id: uuidv4(), podId: newPod.id, userId });
      return json({ success: true, pod: newPod });
    } else if (action === 'addUserToPod') {
      await db.insert(podMembership).values({ id: uuidv4(), podId, userId: newUserId });
      return json({ success: true });
    } else {
      return json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}

export async function GET({ url }: { url: URL }) {
  const podId = url.searchParams.get('podId');
  const userId = url.searchParams.get('userId');

  try {
    const [podDetails] = await db
      .select()
      .from(pod)
      .where(eq(pod.id, podId as string));

    if (!podDetails) {
      return json({ success: false, error: 'Pod not found' }, { status: 404 });
    }

    const podUsers = await db
      .select()
      .from(podMembership)
      .where(eq(podMembership.podId, podId as string));

    const isUserInPod = podUsers.some((pu) => pu.userId === userId);

    if (!isUserInPod) {
      return json({ success: false, error: 'Access denied' }, { status: 403 });
    }

    return json({ success: true, pod: podDetails, users: podUsers });
  } catch (error) {
    return json({ success: false, error: (error as Error).message }, { status: 500 });
  }
}