import { writable } from 'svelte/store';

interface TradeNotification {
    id: string;
    message: string;
    read: number;
    createdAt: string;
}

interface Trade {
    id: string;
    podId: string;
    status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}

interface TradeStore {
    notifications: TradeNotification[];
    trades: Trade[];
    loading: boolean;
}

function createTradeStore() {
    const { subscribe, set, update } = writable<TradeStore>({
        notifications: [],
        trades: [],
        loading: false
    });

    return {
        subscribe,
        setNotifications: (notifications: TradeNotification[]) => 
            update(store => ({ ...store, notifications })),
        addNotification: (notification: TradeNotification) =>
            update(store => ({ 
                ...store, 
                notifications: [notification, ...store.notifications]
            })),
        markNotificationRead: (notificationId: string) =>
            update(store => ({
                ...store,
                notifications: store.notifications.map(n =>
                    n.id === notificationId ? { ...n, read: 1 } : n
                )
            })),
        setTrades: (trades: Trade[]) =>
            update(store => ({ ...store, trades })),
        updateTradeStatus: (tradeId: string, status: Trade['status']) =>
            update(store => ({
                ...store,
                trades: store.trades.map(t =>
                    t.id === tradeId ? { ...t, status } : t
                )
            })),
        setLoading: (loading: boolean) =>
            update(store => ({ ...store, loading }))
    };
}

export const tradeStore = createTradeStore();