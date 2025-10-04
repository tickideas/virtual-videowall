# Contributing to Virtual Video Wall

Thank you for your interest in contributing to the Virtual Video Wall project!

## Development Setup

### Prerequisites
- Node.js 20+
- PostgreSQL 16+
- Docker (optional but recommended)

### Quick Start

1. **Clone the repository**
```bash
git clone <repository-url>
cd virtual-videowall
```

2. **Run setup script**
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

3. **Start services**
```bash
# Using Docker Compose (recommended)
docker-compose up -d

# Or manually start PostgreSQL and LiveKit
```

4. **Start development server**
```bash
npm run dev
```

Visit http://localhost:3000

## Project Structure

```
/app                    # Next.js App Router
  /church              # Church interface pages
  /wall                # Video wall display pages
  /admin               # Admin portal pages
  /api                 # API routes
    /livekit          # LiveKit token generation
    /session          # Session management
    /service          # Service APIs
    /auth             # Authentication

/components            # React components
  /ui                 # Reusable UI components
  /church             # Church-specific components
  /wall               # Wall display components
  /admin              # Admin components

/lib                   # Utilities and helpers
  prisma.ts           # Prisma client
  livekit.ts          # LiveKit utilities
  utils.ts            # General utilities
  auth.ts             # Authentication helpers

/prisma                # Database
  schema.prisma       # Database schema
  seed.ts             # Seed script

/public                # Static assets
```

## Coding Guidelines

### TypeScript
- Use TypeScript for all files
- Define interfaces for props and API responses
- Avoid `any` type

### React Components
- Use functional components with hooks
- Keep components small and focused
- Extract reusable logic into custom hooks

### Styling
- Use Tailwind CSS utility classes
- Follow existing color scheme
- Ensure mobile responsiveness

### API Routes
- Validate input with Zod
- Return consistent error format
- Log errors for debugging

### Database
- Use Prisma for all database queries
- Create migrations for schema changes
- Test queries with sample data

## Testing

### Manual Testing Checklist

**Church Interface:**
- [ ] Enter valid/invalid codes
- [ ] Camera selection works
- [ ] Video preview displays
- [ ] Join room successfully
- [ ] Connection quality indicator

**Wall Display:**
- [ ] Enter valid session code
- [ ] Grid layout correct (4x5)
- [ ] Pagination works
- [ ] Fullscreen toggle
- [ ] Church names display

**Admin Portal:**
- [ ] Login with credentials
- [ ] Dashboard shows stats
- [ ] Create church with code
- [ ] Create service with code
- [ ] Session codes copy correctly

### Load Testing

Test with simulated churches:
```bash
# Use LiveKit CLI to simulate participants
lk room join --url ws://localhost:7880 --identity church1 --publish-video
```

## Pull Request Process

1. **Create a branch**
```bash
git checkout -b feature/your-feature-name
```

2. **Make changes**
- Write clear commit messages
- Follow coding guidelines
- Test your changes

3. **Push and create PR**
```bash
git push origin feature/your-feature-name
```

4. **PR Description**
- Describe what changed
- Why the change was needed
- How to test it
- Screenshots if UI changes

## Common Development Tasks

### Add a new API endpoint

1. Create route file in `/app/api/your-endpoint/route.ts`
2. Implement GET/POST/etc. handlers
3. Add validation with Zod
4. Test with curl or Postman

### Add a new database model

1. Update `/prisma/schema.prisma`
2. Run `npm run db:push`
3. Update types if needed
4. Test queries

### Add a new page

1. Create folder in `/app/your-page`
2. Add `page.tsx` with component
3. Update navigation if needed
4. Test routing

### Add a new component

1. Create file in appropriate `/components` subfolder
2. Export component
3. Add to index if creating library
4. Document props with TypeScript

## Debugging

### Database Issues
```bash
# View database in Prisma Studio
npm run db:studio

# Check migrations
npx prisma migrate status

# Reset database (⚠️ loses data)
npx prisma migrate reset
```

### LiveKit Issues
```bash
# Check LiveKit logs
docker logs videowall-livekit -f

# Test LiveKit endpoint
curl http://localhost:7880/
```

### Next.js Issues
```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

## Performance Optimization

### Checklist
- [ ] Images optimized and lazy-loaded
- [ ] Components code-split
- [ ] API responses cached where appropriate
- [ ] Database queries indexed
- [ ] Pagination implemented for large lists

## Security Considerations

### Before Committing
- [ ] No secrets in code
- [ ] Environment variables documented
- [ ] Input validation on all user input
- [ ] SQL injection prevented (using Prisma)
- [ ] XSS prevented (React escapes by default)

## Questions?

- Check existing issues on GitHub
- Read [SPEC.md](./SPEC.md) for technical details
- Review [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment info

## License

This project is proprietary. Contributions are appreciated but all rights reserved.
