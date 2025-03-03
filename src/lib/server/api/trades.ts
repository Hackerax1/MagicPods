import { createRouter } from 'sveltekit-api-router';
import { db } from '../db';
import { trade, tradeParticipant, tradeItem, userCard } from '../db/schema';

const router = createRouter();

// Create a new trade
router.post('/create', async (req, res) => {
	const { podId, status } = req.body;
	const newTrade = await db.insert(trade).values({ podId, status, createdAt: new Date(), updatedAt: new Date() }).returning('*');
	res.json(newTrade);
});

// Add a participant to a trade
router.post('/:tradeId/participants', async (req, res) => {
	const { tradeId } = req.params;
	const { userId } = req.body;
	const newParticipant = await db.insert(tradeParticipant).values({ tradeId, userId }).returning('*');
	res.json(newParticipant);
});

// Add an item to a trade
router.post('/:tradeId/items', async (req, res) => {
	const { tradeId } = req.params;
	const { userCardId, quantity } = req.body;
	const newItem = await db.insert(tradeItem).values({ tradeId, userCardId, quantity }).returning('*');
	res.json(newItem);
});

export default router.handler();