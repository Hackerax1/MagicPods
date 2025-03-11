<script lang="ts">
  import { onMount } from 'svelte';
  // import { tradeStore } from '../stores/tradeStore';
  
  interface Notification {
    id: string;
    message: string;
    createdAt: string;
    read: number;
  }

  let notifications: Notification[] = [];
  let loading = true;

  onMount(async () => {
    try {
      const response = await fetch('/api/trades/notifications');
      const data = await response.json();
      if (data.success) {
        notifications = data.notifications;
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      loading = false;
    }
  });

  async function markAsRead(notificationId: string) {
    try {
      const response = await fetch(`/api/trades/notifications/${notificationId}/read`, {
        method: 'POST'
      });
      if (response.ok) {
        notifications = notifications.map(n => 
          n.id === notificationId ? { ...n, read: 1 } : n
        );
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  function handleKeyDown(event: KeyboardEvent, notificationId: string) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      markAsRead(notificationId);
    }
  }
</script>

<div class="notifications">
  {#if loading}
    <p>Loading notifications...</p>
  {:else if notifications.length === 0}
    <p>No notifications</p>
  {:else}
    {#each notifications as notification}
      <button
        class="notification-btn {notification.read ? 'read' : 'unread'}"
        on:click={() => markAsRead(notification.id)}
        on:keydown={(e) => handleKeyDown(e, notification.id)}
        aria-label="Trade notification: {notification.message}">
        <p class="message">{notification.message}</p>
        <p class="timestamp">{new Date(notification.createdAt).toLocaleString()}</p>
      </button>
      {/each}
  {/if}
</div>

<style>
  .notifications {
    max-height: 400px;
    overflow-y: auto;
    padding: 1rem;
  }

  .notification-btn {
    width: 100%;
    text-align: left;
    padding: 1rem;
    margin-bottom: 0.5rem;
    border-radius: 4px;
    cursor: pointer;
    transition: background-color 0.2s;
    border: none;
    font-family: inherit;
  }

  .notification-btn.unread {
    background-color: #f0f7ff;
    border-left: 4px solid #3b82f6;
  }

  .notification-btn.read {
    background-color: #f3f4f6;
    border-left: 4px solid #9ca3af;
  }

  .message {
    margin: 0;
    font-size: 0.9rem;
  }

  .timestamp {
    margin: 0.25rem 0 0;
    font-size: 0.8rem;
    color: #6b7280;
  }
</style>