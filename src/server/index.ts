/**
 * INDEX.TS - Main entry point for the MCP Streamable HTTP Server
 * 
 * This file sets up and starts the Express server with MCP (Model Context Protocol) support.
 * It provides endpoints for MCP communication and to-do list management.
 * 
 * Key Features:
 * - Express server with CORS and static file serving
 * - MCP endpoint (/mcp) for handling MCP protocol requests
 * - API endpoints for to-do operations
 * - MCP server initialization and connection to StreamableHTTPServerTransport
 * - Graceful shutdown handling on SIGINT
 * 
 * Endpoints:
 * - POST /mcp - Handles MCP protocol requests
 * - GET/DELETE /mcp - Returns method not allowed (405)
 * - GET /api/todos - Get all todos
 * - POST /api/todos - Create a new todo
 * - PUT /api/todos/:id - Update a todo
 * - DELETE /api/todos/:id - Delete a todo
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env.VERCEL ? process.cwd() : path.resolve(__dirname, "../..");
dotenv.config({ path: path.join(projectRoot, ".env") });

import express, { Request, Response } from "express";
import cors from "cors";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./create-server.js";
import { getAllTodos, createTodo, updateTodo, deleteTodo, toggleTodo } from "./services/todos.js";

const PORT = process.env.PORT || 8000;

const app = express();

app.use(express.json());
app.use(express.static(path.join(projectRoot, "public")));
app.use(
  cors({
    origin: true,
    methods: "*",
    allowedHeaders: "Authorization, Origin, Content-Type, Accept, *",
  })
);
app.options("*", cors());

const transport = new StreamableHTTPServerTransport({
  sessionIdGenerator: undefined,
});

app.post("/mcp", async (req: Request, res: Response) => {
  console.log("Received MCP request:", req.body);
  try {
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal server error",
        },
        id: null,
      });
    }
  }
});

const methodNotAllowed = (req: Request, res: Response) => {
  console.log(`Received ${req.method} MCP request`);
  res.status(405).json({
    jsonrpc: "2.0",
    error: {
      code: -32000,
      message: "Method not allowed.",
    },
    id: null,
  });
};

app.get("/mcp", methodNotAllowed);
app.delete("/mcp", methodNotAllowed);

// REST API endpoints for todos (optional - for direct API access)
app.get("/api/todos", (req: Request, res: Response) => {
  const todos = getAllTodos();
  res.json(todos);
});

app.post("/api/todos", (req: Request, res: Response) => {
  const { title } = req.body;
  if (!title || typeof title !== "string") {
    res.status(400).json({ error: "Title is required" });
    return;
  }
  const todo = createTodo(title);
  res.json(todo);
});

app.put("/api/todos/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, completed } = req.body;
  const updated = updateTodo(id, { title, completed });
  if (!updated) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json(updated);
});

app.delete("/api/todos/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  const deleted = deleteTodo(id);
  if (!deleted) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json({ success: true });
});

app.post("/api/todos/:id/toggle", (req: Request, res: Response) => {
  const { id } = req.params;
  const updated = toggleTodo(id);
  if (!updated) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }
  res.json(updated);
});

const { server } = createServer();

const setupServer = async () => {
  try {
    await server.connect(transport);
    console.log("Server connected successfully");
  } catch (error) {
    console.error("Failed to set up the server:", error);
    throw error;
  }
};

setupServer()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
      console.log(`MCP endpoint: http://localhost:${PORT}/mcp`);
      if (process.env.BASE_URL) {
        console.log(`BASE_URL: ${process.env.BASE_URL}`);
        console.log(`⚠️  Make sure BASE_URL is set to your tunnel URL when testing with ChatGPT!`);
      } else {
        console.log(`⚠️  WARNING: BASE_URL not set! Set it to your tunnel URL in .env for ChatGPT testing.`);
      }
    });
  })
  .catch((error) => {
    console.error("Failed to start server:", error);
    process.exit(1);
  });

process.on("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    console.log(`Closing transport`);
    await transport.close();
  } catch (error) {
    console.error(`Error closing transport:`, error);
  }

  try {
    await server.close();
    console.log("Server shutdown complete");
  } catch (error) {
    console.error("Error closing server:", error);
  }
  process.exit(0);
});

