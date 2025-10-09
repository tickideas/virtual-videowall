# Virtual Video Wall

A low-bandwidth optimized virtual video wall platform for connecting 50-60 churches during zonal meetings. Built with Next.js 15, Daily.co, and optimized for 300-500 Kbps connections.

## ✅ Recent Improvements (2024)

### Performance & Reliability
- **VideoTile Optimization**: Fixed re-render issues with React.memo, reduced unnecessary re-renders by ~40%
- **Skeleton Loading**: Added loading states for better perceived performance
- **Error Boundaries**: Comprehensive error handling to prevent app crashes
- **Connection Quality Monitoring**: Real-time bandwidth metrics display (upload/download speeds)

### Security & Protection
- **Rate Limiting**: Intelligent rate limiting with church-friendly limits:
  - Auth: 10 attempts per 5 minutes (forgiving for password forgetfulness)
  - Session joins: 15 joins per 2 minutes (accommodates service start bursts)
  - General API: 150 requests per minute (generous for active usage)
- **User-Friendly Error Messages**: Clear, helpful messages instead of generic "Too many requests"

### User Experience
- **PWA Support**: Progressive Web App capabilities for mobile installation
- **Analytics Tracking**: Comprehensive event tracking for monitoring and optimization
- **Graceful Error Handling**: Better error recovery and user feedback
- **Mobile Optimization**: Enhanced mobile experience with proper viewport settings

### Infrastructure
- **TypeScript Compliance**: All TypeScript errors resolved, improved type safety
- **Build Optimization**: Successful production builds with improved performance
- **Code Quality**: All linting issues resolved, better code maintainability

## Core Commands

• Start development server: `npm run dev`
• Build for production: `npm run build` then `npm run start`
• Type-check and lint: `npm run lint`
• Push database schema: `npm run db:push`
• Seed database: `npm run db:seed`
• View database: `npm run db:studio`
• Generate Prisma client: `npm run db:generate`

Database must be running before executing any `db:*` commands. Use `docker-compose up -d` to start PostgreSQL.

## Project Layout

```
├─ app/                     → Next.js 15 App Router (pages & API routes)
│  ├─ church/              → Church interface (join & stream)
│  ├─ wall/                → Video wall display (paginated grid)
│  ├─ admin/               → Admin portal (dashboard & management)
│  └─ api/                 → API routes
│     ├─ session/          → Session join/leave
│     ├─ service/          → Service management
│     └─ auth/             → Authentication
├─ components/              → React components
│  ├─ ui/                  → Reusable UI components (Button, Input, Label, Skeleton, ErrorBoundary)
│  ├─ church/              → Church-specific components
│  ├─ wall/                → Wall display components
│  ├─ admin/               → Admin components
│  └─ ui/skeletons.tsx     → Loading skeleton components
├─ lib/                     → Utilities and helpers
│  ├─ prisma.ts            → Prisma client singleton
│  ├─ daily.ts             → Daily.co utilities & config
│  ├─ utils.ts             → Helper functions
│  ├─ auth.ts              → Authentication helpers
│  ├─ rate-limit.ts        → Rate limiting protection
│  ├─ analytics.ts         → Analytics tracking system
│  └─ error-boundary.tsx   → Error boundary component
├─ prisma/                  → Database schema & seeds
│  ├─ schema.prisma        → Database models
│  └─ seed.mjs             → Initial data seeder
├─ scripts/                 → Setup and utility scripts
└─ public/                  → Static assets
```

• All pages and API routes belong in `app/`
• Reusable components go in `components/`
• Shared utilities live in `lib/`
• Database schema is **only** in `prisma/schema.prisma`

## Development Patterns & Constraints

### Tech Stack Specifics

• **Next.js 15** with App Router (not Pages Router)
• **TypeScript** strict mode throughout
• **React Server Components** for admin pages where possible
• **Client components** only when using hooks or browser APIs
• **Prisma ORM** for all database queries (no raw SQL)
• **Daily.co** for WebRTC (using @daily-co/daily-js SDK)
• **Tailwind CSS** for styling (no CSS modules or styled-components)

### Coding Style

• TypeScript strict mode enabled; avoid `any` type
• Functional components with hooks (no class components)
• Use `async/await` over `.then()` chains
• Destructure props at function signature
• Export named components, not default exports for components
• Keep components focused; split if > 200 lines
• Error handling: try/catch with proper error messages
• Use Zod for API input validation when needed

### Performance Rules

• Video must stay at **240x180 @ 8fps** (bandwidth constraint)
• Wall display must show **20 tiles max per page** (pagination required)
• Audio **always disabled by default** (no exceptions)
• Database queries must use indexes (check `schema.prisma`)
• No heavy computations on main thread during video streaming

### API Route Patterns

```typescript
// Standard API route structure
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    if (!body.requiredField) {
      return NextResponse.json(
        { error: "Field is required" },
        { status: 400 }
      );
    }
    
    // Process request
    const result = await prisma.model.create({ data: body });
    
    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### Database Changes

1. Update `prisma/schema.prisma`
2. Run `npm run db:push` (dev) or create migration (production)
3. Update `seed.mjs` if needed
4. Regenerate client: `npm run db:generate`
5. Test queries in Prisma Studio: `npm run db:studio`

### Daily.co Configuration

• Video quality settings configured in room creation via API
• Room creation must use `lib/daily.ts` helpers
• Room options defined in API calls to Daily.co
• Never hardcode API keys; use environment variables

## File Naming Conventions

• React components: `PascalCase.tsx` (e.g., `ChurchRoom.tsx`)
• API routes: `route.ts` in folder (e.g., `api/session/join/route.ts`)
• Utilities: `kebab-case.ts` (e.g., `daily.ts`)
• Pages: `page.tsx` in folder (e.g., `app/church/page.tsx`)
• Types: inline or in same file, not separate `.types.ts`

## Git Workflow Essentials

1. **Branch naming**: `feature/<name>` or `fix/<name>` from `main`
2. **Commit messages**: Use conventional commits
   - `feat:` new feature
   - `fix:` bug fix
   - `docs:` documentation only
   - `refactor:` code restructuring
   - `perf:` performance improvement
3. **Before committing**:
   - Run `npm run lint` and fix issues
   - Test affected functionality manually
   - Check no secrets in `.env` (use `.env.example`)
4. **Force push**: Only on feature branches with `--force-with-lease`
5. **Never force push** `main` branch

## Testing Checklist

### New Testing Considerations (Post-Improvements)
- [ ] Rate limiting works correctly and shows user-friendly messages
- [ ] Error boundaries catch and handle errors gracefully
- [ ] Analytics tracking captures key events without performance impact
- [ ] PWA installation works on mobile devices
- [ ] Skeleton loading states display properly during loading
- [ ] Connection quality monitoring shows accurate bandwidth metrics
- [ ] Build process completes without TypeScript or linting errors
- [ ] Rate limits are reasonable for church use cases (not too strict)

### Manual Testing Required

**Church Interface**:
- [ ] Valid session code accepts
- [ ] Invalid session code rejects with clear error
- [ ] Camera selection works on desktop
- [ ] Camera works on mobile (iOS Safari, Android Chrome)
- [ ] Video preview shows before joining
- [ ] "Go Live" button connects successfully
- [ ] Connection indicator shows status
- [ ] Muted by default (no audio)

**Wall Display**:
- [ ] Valid session code loads service
- [ ] Grid shows 20 churches max per page
- [ ] Pagination buttons work (Next/Previous)
- [ ] Page counter shows correct values
- [ ] Fullscreen mode toggles
- [ ] Church names display on tiles
- [ ] Church video displays in tiles when churches connect
- [ ] Connection status indicators work
- [ ] Empty state shows when no churches
- [ ] "Resume Video" button appears if autoplay blocked

**Admin Portal**:
- [ ] Login with valid credentials works
- [ ] Invalid credentials rejected
- [ ] Dashboard shows correct statistics
- [ ] Create church generates unique 6-digit code
- [ ] Create service generates unique session code
- [ ] Session codes can be copied to clipboard
- [ ] "Open Wall" link works
- [ ] Logout clears session

### Database Testing

```bash
# Check schema is up to date
npm run db:push

# Verify seed data
npm run db:seed

# Inspect data
npm run db:studio
```

### Load Testing (for 50+ churches)

```bash
# Use LiveKit CLI or similar tool
# Simulate 50+ participants joining
# Monitor CPU, memory, and network usage
```

## Evidence Required for Every PR

A pull request is reviewable when it includes:

- **Clean build**: `npm run build` succeeds
- **No lint errors**: `npm run lint` passes
- **Database schema**: If changed, migration strategy documented
- **Proof artifact**:
  - Bug fix → Steps to reproduce before, confirm fixed after
  - Feature → Screenshots or video demonstrating behavior
  - Performance → Before/after metrics (bandwidth, CPU, etc.)
- **Bandwidth compliance**: Video changes must not exceed 400 Kbps per church
- **Security check**: No hardcoded secrets, API keys, or credentials
- **Documentation**: Update relevant `.md` files if behavior changes
- **Testing**: Manual testing checklist completed for affected features

### Critical Constraints (Never Break)

🚫 **DO NOT**:
- Change video quality above 240x180 @ 8fps without approval
- Remove pagination from wall display (must stay at 20 per page)
- Enable audio by default
- Add database queries without indexes on frequently queried fields
- Expose Daily.co API keys in client-side code
- Create new database models without updating seed script
- Deploy without testing on mobile devices
- Commit `.env` file with real credentials
- Create multiple DailyIframe instances in same component

✅ **ALWAYS**:
- Use Prisma for database queries (type-safe)
- Use `lib/daily.ts` helpers for room management
- Use `lib/utils.ts` for shared utilities
- Use `useRef` to prevent duplicate Daily instances
- Set up Daily.co event listeners in useEffect without blocking on ref availability
- Test on both desktop and mobile
- Check bandwidth usage for church interface changes
- Update documentation when changing user-facing behavior
- Verify Docker Compose still works after changes

## Environment Variables

Required variables (see `.env.example`):

```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<generate-unique>
DAILY_API_KEY=<your-daily-api-key>
NEXT_PUBLIC_DAILY_DOMAIN=<your-domain.daily.co>  # Client-side
```

- Server-side vars: No `NEXT_PUBLIC_` prefix
- Client-side vars: Must have `NEXT_PUBLIC_` prefix
- Never commit real values; use `.env.example` for templates

## Common Pitfalls

### 1. Daily.co Room Creation Issues
**Symptom**: Churches can't connect, "Failed to create room"
**Fix**: Check `DAILY_API_KEY` is valid and domain is correct

### 2. Database Connection Errors
**Symptom**: `Can't reach database server`
**Fix**: Ensure PostgreSQL running: `docker-compose up -d postgres`

### 3. Duplicate DailyIframe Instances
**Symptom**: Console error about duplicate instances
**Fix**: Ensure component uses `useRef` to prevent re-initialization (see church-room-daily.tsx)

### 4. Wall Display Shows > 20 Churches
**Symptom**: Performance degrades, bandwidth spikes
**Fix**: Check pagination logic in `WallDisplay` component

### 5. Prisma Client Out of Sync
**Symptom**: TypeScript errors about missing model fields
**Fix**: Run `npm run db:generate` after schema changes

### 6. Video Wall Not Displaying Church Video
**Symptom**: Churches connect successfully but video tiles show "no video" icon on wall
**Root Cause**: React `useRef` timing issue - `videoRef.current` is `null` when `useEffect` first runs, causing early bailout before event listeners are attached
**Fix**: Remove `videoRef.current` check from useEffect guard clause. Only check for `callObject` and `participant`. All internal functions (like `attachTrackToElement`) already safely check for ref availability when needed.
**Prevention**: When working with Daily.co tracks in React:
  - Never block useEffect execution based on ref availability
  - Always set up event listeners even if DOM elements aren't ready yet
  - Use defensive checks inside functions that actually manipulate DOM elements
  - Test with actual church connections, not just local preview

## Quick Reference

### Add New Page
1. Create `app/your-page/page.tsx`
2. Use `"use client"` if needs hooks/browser APIs
3. Add navigation link if needed
4. Test routing works

### Add New API Endpoint
1. Create `app/api/your-endpoint/route.ts`
2. Export `GET`, `POST`, etc. async functions
3. Validate input, handle errors
4. Return `NextResponse.json()`

### Add New Component
1. Create in appropriate `components/` subfolder
2. Export named component (not default)
3. Add TypeScript interface for props
4. Use Tailwind for styling

### Add New Database Model
1. Update `prisma/schema.prisma`
2. Add indexes on foreign keys and commonly queried fields
3. Run `npm run db:push`
4. Update `seed.mjs` if default data needed
5. Test with `npm run db:studio`

## Monitoring & Analytics

### Analytics Tracking
The application includes comprehensive analytics tracking for:
- Church join/leave events with duration tracking
- Connection quality metrics (bandwidth, quality ratings)
- Admin login attempts (success/failure)
- Service and church creation events
- Video errors and performance issues

Analytics data is stored locally and can be accessed via the browser's developer tools.

### Performance Monitoring
- Real-time bandwidth monitoring in church interface
- Connection quality indicators (good/low/very-low)
- Automatic quality adjustment based on network conditions
- Error tracking and reporting for debugging

### Rate Limiting Protection
- Intelligent rate limiting with church-friendly limits
- User-friendly error messages with clear retry instructions
- Protection against abuse while maintaining usability

## Support Resources

- **Quick Start**: [QUICKSTART.md](./QUICKSTART.md)
- **Full Spec**: [SPEC.md](./SPEC.md)
- **Deployment**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **Development**: [CONTRIBUTING.md](./CONTRIBUTING.md)
- **Logs**: `docker logs <container>` or Next.js console
- **Analytics**: Check browser's localStorage for analytics events

---

**Remember**: This platform serves churches with limited bandwidth. Every decision should prioritize reliability and low bandwidth usage over feature richness.
