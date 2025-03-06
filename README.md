# MTGSvelte3

MTGSvelte3 is a web application built using Svelte, a modern JavaScript framework for building user interfaces. This project leverages the power of Svelte to create a dynamic and responsive user experience for managing and building Magic: The Gathering decks.

## Features

- User authentication and registration
- Deck building and management
- Integration with Scryfall API for card data
- Responsive design for various devices
- Card scanning capability
- Trade management system
- Pod management for multiplayer games

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Python 3.8+ (for card scanner component)
- npm or pnpm package manager

## Installation and Setup

1. Clone the repository:
```bash
git clone https://github.com/Hackerax1/MagicPods.git
cd MTGSvelte3
```

2. Install dependencies:
```bash
npm install
# or if using pnpm
pnpm install
```

3. Set up the card scanner (optional):
```bash
cd card_scanner
pip install -r requirements.txt
cd ..
```

4. Environment Setup:
- Copy `.env.example` to `.env` (if not present, create one)
- Configure your environment variables:
  - Database connection details
  - API keys if required
  - Server configuration

5. Start the development environment:
```bash
# Start all services using Docker Compose
docker-compose up -d

# Start the development server
npm run dev
```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run test:e2e` - Run end-to-end tests with Playwright

## Testing

The project uses Playwright for end-to-end testing and Vitest for unit testing.

- Run unit tests: `npm run test`
- Run e2e tests: `npm run test:e2e`
- View test coverage: `npm run coverage`

## Technologies Used

- Svelte
- TypeScript
- Playwright for end-to-end testing
- Docker for containerization
- Python (for card scanning functionality)
- DrizzleORM for database management

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
