# MTGSvelte3

MTGSvelte3 is a web application built using Svelte, a modern JavaScript framework for building user interfaces. This project leverages the power of Svelte to create a dynamic and responsive user experience for managing and building Magic: The Gathering decks.

## Features

- User authentication and registration with secure password handling
- Advanced deck building with drag-and-drop interface
- Integration with Scryfall API for comprehensive card data
- Real-time trade management system
- Pod management for multiplayer games
- AI-powered card scanning capability
- Responsive design optimized for desktop and mobile
- Offline support for basic functionality
- Real-time notifications for trades and pod updates

## Architecture

MTGSvelte3 follows a modern web architecture:

- **Frontend**: Svelte with TypeScript for type safety
- **Backend**: Node.js with SvelteKit for server-side rendering
- **Database**: PostgreSQL with DrizzleORM for type-safe queries
- **Microservices**: 
  - Card Scanner service (Python/FastAPI)
  - Trade matching engine
- **Infrastructure**: Docker containerization for consistent deployments

## Prerequisites

- Node.js (v16 or higher)
- Docker and Docker Compose
- Python 3.8+ (for card scanner component)
- PostgreSQL 14+
- npm or pnpm package manager

## Quick Start

1. Clone and install:
```bash
git clone https://github.com/Hackerax1/MagicPods.git
cd MTGSvelte3
npm install  # or pnpm install
```

2. Environment setup:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start development environment:
```bash
docker-compose up -d    # Start services
npm run dev            # Start development server
```

## Development Guide

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm test` - Run unit tests
- `npm run test:e2e` - Run E2E tests
- `npm run security:audit` - Run security audit

### Testing Strategy

- **Unit Tests**: Vitest for component and utility testing
- **Integration Tests**: API and database integration testing
- **E2E Tests**: Playwright for critical user flows
- **Accessibility**: Automated a11y testing with axe-core
- **Performance**: Lighthouse CI integration

### Database Migrations

```bash
npm run db:migrate   # Run pending migrations
npm run db:push     # Push schema changes
npm run db:studio   # Open Drizzle Studio
```

## Deployment

### Production Setup

1. Build the application:
```bash
npm run build
```

2. Start using Docker:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables

Key environment variables:

- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Secret for JWT tokens
- `SCRYFALL_API_KEY`: Scryfall API key (optional)
- `REDIS_URL`: Redis connection for caching (optional)

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style Guide

- Follow TypeScript best practices
- Use Prettier for formatting
- Follow commit message conventions
- Write tests for new features

## Performance

- Lighthouse score: 95+ on all metrics
- Core Web Vitals compliant
- Progressive Web App (PWA) ready
- Optimized bundle size with code splitting

## Security

- Regular security audits
- OWASP compliance
- Rate limiting on all endpoints
- Input sanitization
- XSS protection
- CSRF protection

## Support

- GitHub Issues for bug reports and features
- Documentation in `/docs` directory
- Wiki for advanced topics

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Scryfall API for card data
- The Svelte community
- Contributors and testers
