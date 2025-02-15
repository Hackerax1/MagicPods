// Mock data for decks
const mockDecks = [
  { id: '1', name: 'Deck 1' },
  { id: '2', name: 'Deck 2' },
  { id: '3', name: 'Deck 3' }
];

// Function to fetch decks
export async function getDecks() {
  // Simulate an API call with a delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(mockDecks);
    }, 1000);
  });
}
