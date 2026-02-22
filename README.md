# Activity Match

**Making connection as simple as showing up.**

Activity Match is a modern platform that connects people through social activities. Users can discover local activities, create their own, and manage join requests—all in one intuitive interface.

## Features

### 🏠 Homepage
- Clean landing page with tagline and brand logo
- Feature cards highlighting Discover, Create, and Requests
- Quick navigation to core features
- Blue (#2e4ed2) design theme with pink (#ee9dd6) accent cards

### 🔍 Discover
- Browse activities created by other users
- Swipe view for quick activity browsing
- List view for detailed activity information
- Filter activities by category, gender preferences, age range, and distance
- Send join requests with personalized messages to activity hosts
- Real-time activity feed

### ➕ Create
- Host your own activities with detailed forms
- Upload activity images with preview
- Set category, date, time, and location
- Define maximum participant count (required field)
- Add optional filters:
  - Gender preferences
  - Age range requirements
  - Distance radius
  - Custom categories (if existing categories don't fit)
- Form validation with inline feedback
- Success notifications with redirect to Discover

### 📋 Requests
- View and manage join requests for hosted activities
- Accept or decline participant requests
- See participant details and introduction messages
- Track pending and resolved requests

### 💬 Messages
- Send and receive messages from activity participants
- Unread message tracking
- Real-time message notifications in header badge

### 👤 Profile
- View and edit user profile information
- Track activities hosted and joined
- Manage account settings
- Change password
- Delete account option

### 🔐 Authentication
- Google OAuth integration
- Outlook OAuth integration
- Traditional email/password signup & login
- Secure session management
- Account permissions management

## Tech Stack

- **Frontend:** Next.js 16+ with React 19, TypeScript
- **Styling:** Tailwind CSS + shadcn UI components
- **Backend:** Next.js API routes (server-side)
- **Database & Storage:** Supabase (PostgreSQL + Cloud Storage)
- **Authentication:** Supabase Auth (OAuth + Email/Password)
- **Image Hosting:** Supabase Storage

## Project Structure

```
src/
├── app/
│   ├── page.tsx                      # Homepage
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles & theme variables
│   ├── discover/page.tsx             # Discover activities
│   ├── create/page.tsx               # Create activity form
│   ├── profile/page.tsx              # User profile & settings
│   ├── requests/page.tsx             # Manage join requests
│   ├── messages/page.tsx             # Messages hub
│   ├── login/page.tsx                # Login page
│   ├── signup/page.tsx               # Signup page
│   ├── auth/callback/page.tsx        # OAuth callback
│   └── api/
│       ├── posts/route.ts            # Create & fetch activities
│       ├── messages/route.ts         # Message endpoints
│       ├── join-requests/route.ts    # Request management
│       ├── requests/route.ts         # Request list
│       ├── user/
│       │   ├── profile/route.ts
│       │   ├── update-profile/route.ts
│       │   ├── change-password/route.ts
│       │   └── delete-account/route.ts
│       ├── ai/
│       │   ├── icebreakers/route.ts
│       │   └── polish/route.ts
│       └── auth/
│           ├── google/route.ts
│           ├── outlook/route.ts
│           ├── login/route.ts
│           ├── signup/route.ts
│           └── permissions/route.ts
├── components/
│   ├── layout/Header.tsx             # Navigation header with blue (#2e4ed2) styling
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── PermissionsForm.tsx
│   └── ui/                           # shadcn UI components
└── lib/
    ├── utils.ts
    └── supabase/client.ts            # Supabase client setup
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account (for database & authentication)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd activities-match
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with:
```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Design System

### Colors
- **Primary Blue:** `#2e4ed2` (navigation links, user text, profile icon)
- **Secondary Pink:** `#ee9dd6` (feature cards on homepage)
- **Background:** `#fdf8fa` (light pink, main surface)
- **Homepage Background:** `#2e4ed2` (blue gradient background)
- **Dark Mode:** Integrated dark theme support throughout

### Typography
- **Font Family:** Geist (Vercel's design font)
- **Headings:** Semibold to Bold weights
- **Body:** Regular weight

### Components
- All main content areas use `#fdf8fa` background via CSS variable `--background`
- White backgrounds automatically converted to `#fdf8fa` via CSS overrides
- Consistent shadow and border styling across components

## API Routes

### Activity Management
- `POST /api/posts` - Create new activity (multipart/form-data with image)
- `GET /api/posts` - Fetch activities with pagination
- `POST /api/join-requests` - Submit join request
- `GET /api/join-requests` - Get requests for user's activities
- `GET /api/requests` - Get user's sent requests

### User Management
- `GET/POST /api/user/profile` - View/update profile
- `POST /api/user/change-password` - Change password
- `POST /api/user/delete-account` - Delete account

### Messages
- `GET /api/messages` - Fetch messages
- `POST /api/messages` - Send message

### Authentication
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/signup` - Create new account
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/outlook` - Outlook OAuth
- `GET /api/auth/callback` - OAuth callback handler

## Development Workflow

### Running the Development Server
```bash
npm run dev
```
Server runs on [http://localhost:3000](http://localhost:3000) with hot reload.

### Building for Production
```bash
npm run build
npm start
```

### Linting
```bash
npm run lint
```

### Running Tests
```bash
npm test
```

## Database Schema (Overview)

Key tables in Supabase PostgreSQL:
- `users` — User profiles and authentication metadata
- `posts` — Activities/events created by users
  - Fields: title, description, category, date, time, location, max_participants, image_url, genders (JSON), age_min, age_max, distance, creator_email
- `join_requests` — Requests to participate in activities
- `messages` — Direct messages between users

## Image Upload

- Activity images uploaded to Supabase Storage bucket: `activity-images`
- Images stored with public access URLs
- Preview shown on Create form before submission
- Fallback when Supabase not configured

## CSS Overrides

Global CSS in `src/app/globals.css`:
- `.bg-white` classes override to use `var(--background)` (#fdf8fa)
- Maintains dark mode variants
- Ensures consistent color theme across all pages

## Recent Enhancements (This Session)

✅ Created activity creation page with multipart form support
✅ Implemented image upload with preview
✅ Added optional filters (gender, age range, distance)
✅ Created API endpoints for posts, join requests, and messages
✅ Updated header with blue (#2e4ed2) navigation styling
✅ Set global background to pink (#fdf8fa)
✅ Redesigned homepage with logo, tagline, and feature cards
✅ Added blue (#2e4ed2) homepage background
✅ Styled feature cards with pink (#ee9dd6) backgrounds
✅ Updated README with comprehensive documentation

## Future Enhancements

- Real-time activity updates with WebSockets
- Advanced search and sorting
- User ratings and reviews system
- Activity analytics and insights
- Mobile app (React Native)
- Email notifications
- SMS reminders
- Google Maps integration for location
- Activity categories with icons
- Social sharing features

## Contributing

1. Create a feature branch (`git checkout -b feature/your-feature`)
2. Commit changes (`git commit -m 'Add feature'`)
3. Push to branch (`git push origin feature/your-feature`)
4. Open a pull request

## License

This project is licensed under the MIT License.

## Support

For issues or questions, please open an issue on the repository or contact the development team.
