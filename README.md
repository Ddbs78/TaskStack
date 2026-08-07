# TaskStack
Built for brains that lose track of time.
TaskStack is a minimalist, friction-free task manager engineered around a living, breathing timeline. It was not created to be just another generic alternative in the saturated productivity market. Instead, it was built by an early-stage product builder to solve a genuine human problem: standard task managers often paralyze neurodivergent users with infinite visual debt.
TaskStack is an intentional, research-backed Minimum Viable Product (MVP) specifically tailored for individuals who struggle with ADHD, executive dysfunction, and chronic procrastination. Every detail serves to empower users who feel alienated by traditional productivity tools.
Everything stays on your device. Local-first, private, and lightning-fast.
# The Vision & Market Gap
Standard "to-do lists" rely on constraint and shame, which causes high abandonment. TaskStack fundamentally shifts this paradigm by building its architecture around how neurodivergent brains actually process time and urgency.
•	Targeting Time Blindness: ADHD brains discount the future steeply—"not now" is nearly invisible. TaskStack externalizes time as a physical, moving object. A "Now-Line" glides horizontally across the day in real-time, allowing users to literally watch time pass and actively combat time blindness.
•	Capping Visual Debt: Unbounded task stacking causes initiation paralysis. In TaskStack, anything missed automatically rolls forward to today. However, the visual overflow is deliberately capped to prevent the "wall of awful" shutdown.
•	Rewarding Completion: Rather than just checking a box, the app utilizes dynamic, dopamine-driven completion states to make finishing a task feel genuinely rewarding and empowering.
•	Dual-Aesthetic Approach: The platform defaults to a warm, organic, and highly personalized design language featuring hand-drawn elements. However, recognizing that different environments require different focus levels, the app features a Professional Mode. This toggle strips away the whimsical elements, delivering a clean, sanitized, and distraction-free interface when needed.
# Core Product Mechanics
•	Living Timeline Views: Seamlessly switch between a 3-Day view (Yesterday, Today, Tomorrow), a 7-column Week view, and a high-level Month view. Each layout maintains the core philosophy of mapping tasks to physical time, as seen in the application screenshots.
•	Frictionless NLP Entry: Capture is instant. Typing "Dentist tomorrow at 3" parses the date and time locally and generates a task instantly without navigating complex menus.
•	Dynamic Task Blocks: Tasks can be customized visually to denote different energy levels or contexts, helping users prioritize based on cognitive load.
•	Urgency Ranking: Users can rate a task's importance (1-10) up front, allowing the system to naturally highlight what needs immediate attention without requiring constant executive functioning to reorganize.
•	Zero-Latency Persistence: All data is saved instantly to the browser's localStorage. No loading spinners, no database latency, no required accounts.
# The Tech Stack
Built for speed, fluid state management, and zero framework bloat.
•	React 18 + Vite: For an ultra-fast development server and optimized production builds.
•	Tailwind CSS v4: For rapid, token-based utility styling (Strict color tokens: Warm Charcoal #1A1A1E, Off-White #FAFAF8, and Coral #F4845F).
•	Framer Motion: Powers the complex layout shifts and fluid, physics-based interactions that drive the application's feedback loops.
# Run It Locally
To spin up the development environment:
# Install dependencies
npm install

# Run the local development server
npm run dev      
# The app will be live at http://localhost:5173

# Build for production
npm run build 
# Output will be generated in the /dist directory.

Project Architecture
Auto-rollover and overdue statuses are derived dynamically on load and at local midnight, meaning the underlying storage is never mutated by the passage of time.
src/
  ├── state/         # store.js (reducer/localStorage), time.js (clock math), rollover.js
  ├── nlp/           # parse.js (date/time extraction), commands.js (local engine)
  └── components/    # Core UI components (TaskCard, NowLine, InputBar, Settings)
      └── views/     # Routing for ThreeDay, Week, and Month layouts
