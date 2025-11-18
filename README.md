# OpenAI MCP To-Do List Boilerplate

A clean, production-ready boilerplate for building ChatGPT Apps using the Model Context Protocol (MCP), Express, React, and Vercel.

## Overview

This boilerplate provides:

* A React component bundle system with Vite
* A Node.js MCP server using the official TypeScript SDK
* Express server for MCP and REST API endpoints
* **Full `window.openai` API integration** for two-way communication with ChatGPT
* Vercel deployment configuration
* Simple, clean project structure

## Features

### To-Do List Widget

* View all todos with completion status
* Add new todos
* Toggle todo completion
* Delete todos
* Refresh todos from server
* Real-time updates via ChatGPT SDK

### MCP Tools

* `todos.show_todo_list` - Opens the to-do list widget
* `todos.refresh_todos` - Refreshes todos from server
* `todos.add_todo` - Adds a new todo item
* `todos.toggle_todo` - Toggles todo completion status
* `todos.delete_todo` - Deletes a todo item
* `todos.save_todo_state` - Saves todo state (for persistence)

### window.openai API Integration

The boilerplate includes custom React hooks for interacting with ChatGPT:

* `useToolOutput()` - Read data from MCP server tool response
* `useToolInput()` - Read parameters passed to your MCP tool
* `useWidgetState(initialState)` - Persist state visible to ChatGPT
* `useCallTool()` - Call MCP server tools from component
* `useSendFollowUpMessage()` - Send messages to ChatGPT conversation
* `useRequestDisplayMode()` - Request layout changes (inline/pip/fullscreen)
* `useOpenAIGlobals()` - Access theme, device, and layout information

## Project Structure

```
openai-mcp-todo-boilerplate/
├── src/
│   ├── server/              # MCP server (Node.js/Express)
│   │   ├── create-server.ts # MCP server factory
│   │   ├── index.ts         # Express server entry point
│   │   └── services/
│   │       └── todos.ts    # Todo service (in-memory storage)
│   └── widgets/             # React component bundle source
│       ├── components/
│       │   └── todo-list/   # Todo list widget component
│       ├── hooks/
│       │   └── useOpenAI.ts # ChatGPT SDK hooks
│       └── index.css        # Global styles
├── build/                   # Compiled server code
├── dist/                    # Built widget assets
├── package.json
├── tsconfig.json
├── vite.config.js
├── vercel.json              # Vercel deployment config
└── README.md
```

## Prerequisites

* Node.js 18+
* pnpm (recommended) or npm/yarn
* A Vercel account (for deployment)
* ngrok or Cloudflare Tunnel (for local testing with ChatGPT)

## Getting Started

### 1. Install

```bash
pnpm install
```

### 2. Environment Variables

Create a `.env` file in the root directory:

```bash
# Create .env file
touch .env
```

**IMPORTANT:** When testing with ChatGPT, `BASE_URL` must be your tunnel URL (ngrok/Cloudflare Tunnel), NOT localhost. ChatGPT's iframe cannot access localhost URLs.

Edit `.env` and add:

```env
# Base URL for your deployment
# For local testing with ChatGPT: Use your tunnel URL (e.g., https://abc123.ngrok-free.app)
# For Vercel: https://your-domain.vercel.app
BASE_URL=https://your-tunnel-url.ngrok-free.app

# Server port (default: 8000)
PORT=8000

# Optional: Custom domain for CSP
# CONNECT_DOMAIN=https://your-custom-domain.com
```

**For local testing with ChatGPT:**
```env
# Use your tunnel URL here (NOT localhost!)
BASE_URL=https://abc123.ngrok-free.app
PORT=8000
```

**For Vercel deployment:**
```env
BASE_URL=https://your-project.vercel.app
# Note: Do NOT set PORT for Vercel - Vercel automatically sets it
```

### 3. Build the Widget Components

```bash
pnpm run build
```

This generates `.html`, `.js`, and `.css` files in `dist/widgets/` for each component.

### 4. Start the Server (Local Development)

```bash
pnpm run dev
```

This starts both the server and widget dev server concurrently.

Or run them separately:

```bash
# Terminal 1: Server
pnpm run dev:server

# Terminal 2: Widgets (for UI debugging)
pnpm run dev:widgets
```

The server will start on `http://localhost:8000` with the MCP endpoint at `http://localhost:8000/mcp`.

## Development

### UI Debugging (Local Development)

For local development with hot reload and debugging:

```bash
pnpm run dev:widgets
```

This will:
* Start Vite dev server on `http://localhost:3000`
* Enable hot reload for instant updates
* Provide source maps for debugging
* Serve your React components directly

**To view the component:**
* Open `http://localhost:3000/components/todo/index.html` in your browser
* Each component has its own `index.html` file in its directory for dev testing

**Important Notes:**
* This is ONLY for local debugging - ChatGPT never sees this
* The dev server uses `src/widgets/components/*/index.jsx` files as entry points
* Production uses built files from `dist/widgets/` instead

### Development vs Production

| Environment     | Entry Point                 | Purpose                      | URL                                    |
| --------------- | --------------------------- | ---------------------------- | -------------------------------------- |
| **Development** | src/widgets/components/*/index.jsx | UI debugging with hot reload | http://localhost:3000/components/todo/index.html |
| **Production**  | dist/widgets/*.js           | ChatGPT integration          | localhost:8000                         |

## Testing in ChatGPT

To test your app in ChatGPT:

1. **Build production assets first:**
   ```bash
   pnpm run build
   ```

2. **Start the MCP server:**
   ```bash
   pnpm run dev:server
   ```

3. **Create a tunnel to expose your local server:**
   ```bash
   # Using ngrok
   ngrok http 8000
   
   # Or using Cloudflare Tunnel
   cloudflared tunnel --url http://localhost:8000
   ```

4. **Update your .env file with the tunnel URL:**
   ```env
   # CRITICAL: Use the tunnel URL, not localhost!
   BASE_URL=https://your-subdomain.ngrok-free.app
   PORT=8000
   ```
   
   **Why?** ChatGPT's iframe cannot access `localhost` URLs. The widget needs to make API calls to your server, so it must use the tunnel URL that ChatGPT can access.

5. **Restart your server** to pick up the new BASE_URL:
   ```bash
   pnpm run dev:server
   ```

6. **Add the tunnel URL to ChatGPT:**
   - Go to Settings > Connectors
   - Add your tunnel URL (don't forget to add "/mcp"):
     ```
     https://your-subdomain.ngrok-free.app/mcp
     ```

7. **Test the widget:**
   - In ChatGPT, ask: "Show me my to-do list"
   - The widget should appear with sample todos

**Important:** 
- Always run `pnpm run build` after making changes to your components before testing with ChatGPT!
- Always use the tunnel URL in `BASE_URL` when testing with ChatGPT, never localhost!

## Deployment to Vercel

### 1. Install Vercel CLI (if not already installed)

```bash
npm i -g vercel
```

### 2. Deploy

```bash
vercel
```

Follow the prompts to link your project.

### 3. Set Environment Variables

In the Vercel dashboard:
1. Go to your project settings
2. Navigate to Environment Variables
3. Add `BASE_URL` with your Vercel deployment URL:
   ```
   BASE_URL=https://your-project.vercel.app
   ```

### 4. Configure ChatGPT

1. Go to ChatGPT Settings > Connectors
2. Add your Vercel deployment URL:
   ```
   https://your-project.vercel.app/mcp
   ```

### 5. Redeploy

After setting environment variables, trigger a new deployment:

```bash
vercel --prod
```

## Creating New Widgets

1. Create a new component directory in `src/widgets/components/` with an `index.jsx` file
2. The build script will automatically pick it up when you run `pnpm run build`
3. Register the widget in `src/server/create-server.ts`:
   - Add a resource registration
   - Add tool registrations
4. Rebuild with `pnpm run build`

### Component Structure

Each component should have:

* `index.jsx` - Entry point that exports the component
* Component files (e.g., `TodoList.jsx`, `todo-list.css`)
* Any data files (e.g., `data.json`)

Example:

```
src/widgets/components/my-widget/
├── index.jsx
├── MyWidget.jsx
└── my-widget.css
```

## API Endpoints

The server provides REST API endpoints for direct access (optional):

* `GET /api/todos` - Get all todos
* `POST /api/todos` - Create a new todo
* `PUT /api/todos/:id` - Update a todo
* `DELETE /api/todos/:id` - Delete a todo
* `POST /api/todos/:id/toggle` - Toggle todo completion

## Customization

### Adding a Database

Replace the in-memory storage in `src/server/services/todos.ts` with your database of choice:

```typescript
// Example with a database
import { db } from './database';

export function getAllTodos(): Promise<Todo[]> {
  return db.todos.findMany();
}

export function createTodo(title: string): Promise<Todo> {
  return db.todos.create({ data: { title, completed: false } });
}
```

### Styling

The widget uses Tailwind CSS and custom CSS. Modify:
* `src/widgets/index.css` - Global styles
* `src/widgets/components/todo-list/todo-list.css` - Component-specific styles
* `tailwind.config.js` - Tailwind configuration

### Adding New MCP Tools

Add new tools in `src/server/create-server.ts`:

```typescript
server.registerTool(
  "todos.your_new_tool",
  {
    title: "Your Tool Title",
    description: "Tool description",
    inputSchema: {
      // Zod schema
    },
  },
  async (rawParams) => {
    // Tool implementation
  }
);
```

## Troubleshooting

### Widget not loading in ChatGPT

1. Ensure you've built the assets: `pnpm run build`
2. Check that `dist/widgets/` contains `.js` and `.css` files
3. Verify your MCP endpoint URL includes `/mcp`
4. **Check that BASE_URL is set to your tunnel URL, not localhost**
5. Check server logs for errors

### CORS errors

The server includes CORS middleware. If you encounter CORS issues:
1. Check `src/server/index.ts` CORS configuration
2. Ensure your `BASE_URL` environment variable is set correctly (use tunnel URL for ChatGPT testing)

### Build errors

1. Ensure all dependencies are installed: `pnpm install`
2. Check TypeScript errors: `pnpm run build:server`
3. Check Vite build errors: `pnpm run build:widgets`

### Widget can't connect to API

**Most common issue:** `BASE_URL` is set to `localhost` instead of tunnel URL.

- ChatGPT's iframe cannot access `localhost` URLs
- Always use your tunnel URL (ngrok/Cloudflare Tunnel) in `BASE_URL` when testing with ChatGPT
- Example: `BASE_URL=https://abc123.ngrok-free.app` ✅
- Not: `BASE_URL=http://localhost:8000` ❌

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

