/**
 * CREATE-SERVER.TS - MCP Server Factory for To-Do List Widget
 * 
 * This file creates and configures an MCP (Model Context Protocol) server that provides
 * an interactive to-do list widget within ChatGPT.
 * 
 * Key Features:
 * - Creates and configures an MCP server instance
 * - Registers widget resource (todo) that loads React component
 * - Registers tools for showing todos, refreshing todos, and saving todo state
 * - Loads and inlines widget assets (JS, CSS) into self-contained HTML
 * - Injects API base URL from environment variables for production use
 * 
 * IMPORTANT: BASE_URL must be set to your tunnel URL (ngrok/Cloudflare) when testing
 * with ChatGPT, not localhost. ChatGPT needs to access your server from the internet.
 */

import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = process.env.VERCEL ? process.cwd() : path.resolve(__dirname, "..");
dotenv.config({ path: path.join(projectRoot, ".env") });
const apiBaseUrl = process.env.BASE_URL;

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import fs from "node:fs";
import { getAllTodos, createTodo, updateTodo, deleteTodo, toggleTodo, getTodoById, type Todo } from "./services/todos.js";

const ASSETS_DIR = path.resolve(projectRoot, "dist", "widgets");

function loadWidgetHtml(componentName: string): string {
  if (!fs.existsSync(ASSETS_DIR)) {
    throw new Error(
      `Widget assets not found. Expected directory ${ASSETS_DIR}. Build assets before starting the server.`,
    );
  }

  const jsPath = path.join(ASSETS_DIR, `${componentName}.js`);
  if (!fs.existsSync(jsPath)) {
    throw new Error(
      `Widget JS for "${componentName}" not found at ${jsPath}. Build assets first.`,
    );
  }
  const js = fs.readFileSync(jsPath, "utf8");

  const cssPath = path.join(ASSETS_DIR, `${componentName}.css`);
  const css = (() => {
    try {
      return fs.readFileSync(cssPath, "utf8");
    } catch {
      return "";
    }
  })();

  const html = `
<div id="${componentName}-root"></div>
${css ? `<style>${css}</style>` : ""}
<script>window.__API_BASE_URL__ = ${JSON.stringify(apiBaseUrl)};</script>
<script type="module">${js}</script>
  `.trim();

  return html;
}

export const createServer = () => {
  console.log("Registering MCP server");
  console.log(`BASE_URL: ${apiBaseUrl || "NOT SET - This must be your tunnel URL when testing with ChatGPT!"}`);

  const server = new McpServer({
    name: "todo-list-server",
    version: "1.0.0",
  });

  const todoListUri = "ui://widget/todo.html";
  const cspMeta = {
    connect_domains: [
      "https://chatgpt.com",
      "https://*.oaistatic.com",
      "https://files.openai.com",
      "https://cdn.openai.com",
      process.env.CONNECT_DOMAIN,
    ],
    resource_domains: [
      "https://*.oaistatic.com",
      "https://files.openai.com",
      "https://cdn.openai.com",
      "https://chatgpt.com",
    ],
  };

  /* ----------------------------- MCP RESOURCES ----------------------------- */
  server.registerResource(
    "todo-widget",
    todoListUri,
    {},
    async () => ({
      contents: [
        {
          uri: todoListUri,
          mimeType: "text/html+skybridge",
          text: loadWidgetHtml("todo"),
          _meta: {
            "openai/widgetDescription":
              "A to-do list widget for managing tasks and tracking completion.",
            "openai/widgetPrefersBorder": true,
            "openai/widgetDomain": "https://chatgpt.com",
            "openai/widgetCSP": cspMeta,
          },
        },
      ],
    }),
  );

  /* ----------------------------- MCP TOOLS ----------------------------- */
  server.registerTool(
    "todos.show_todo_list",
    {
      title: "Show To-Do List",
      description:
        "Use this when the user wants to see or manage their to-do list. Opens an interactive widget for viewing, adding, completing, and deleting todos.",
      inputSchema: {},
      _meta: {
        "openai/outputTemplate": todoListUri,
        "openai/toolInvocation/invoking": "Opening to-do list",
        "openai/toolInvocation/invoked": "To-do list displayed",
      },
      annotations: { readOnlyHint: true },
    },
    async () => {
      const todos = getAllTodos();
      return {
        content: [
          {
            type: "text",
            text: `To-do list is ready! You have ${todos.length} task${todos.length !== 1 ? "s" : ""}.`,
          },
        ],
        structuredContent: {
          todos,
          message: "To-do list ready",
        },
      };
    },
  );

  server.registerTool(
    "todos.refresh_todos",
    {
      title: "Refresh To-Do List",
      description:
        "Refreshes the to-do list data from the server. Called by the widget component to get the latest todos.",
      inputSchema: {},
      _meta: {
        "openai/toolInvocation/invoking": "Refreshing todos",
        "openai/toolInvocation/invoked": "Todos refreshed",
      },
    },
    async () => {
      const todos = getAllTodos();
      return {
        content: [
          {
            type: "text",
            text: `Refreshed ${todos.length} todo${todos.length !== 1 ? "s" : ""}.`,
          },
        ],
        structuredContent: {
          todos,
        },
      };
    },
  );

  server.registerTool(
    "todos.add_todo",
    {
      title: "Add To-Do Item",
      description:
        "Adds a new to-do item to the list. Use this when the user wants to create a new task.",
      inputSchema: {
        title: z
          .string()
          .min(1, "Title cannot be empty")
          .max(200, "Title must be 200 characters or fewer")
          .describe("The title/description of the to-do item"),
      },
      _meta: {
        "openai/toolInvocation/invoking": "Adding to-do item",
        "openai/toolInvocation/invoked": "To-do item added",
      },
    },
    async (rawParams) => {
      const { title } = z
        .object({
          title: z
            .string()
            .min(1, "Title cannot be empty")
            .max(200, "Title must be 200 characters or fewer")
            .describe("The title/description of the to-do item"),
        })
        .parse(rawParams);

      const todo = createTodo(title);
      const todos = getAllTodos();

      return {
        content: [
          {
            type: "text",
            text: `Added to-do: "${title}"`,
          },
        ],
        structuredContent: {
          todos,
          newTodo: todo,
        },
      };
    },
  );

  server.registerTool(
    "todos.toggle_todo",
    {
      title: "Toggle To-Do Completion",
      description:
        "Toggles the completion status of a to-do item. Called by the widget when user clicks a checkbox.",
      inputSchema: {
        id: z
          .string()
          .describe("The ID of the to-do item to toggle"),
      },
      _meta: {
        "openai/toolInvocation/invoking": "Toggling todo",
        "openai/toolInvocation/invoked": "Todo toggled",
      },
    },
    async (rawParams) => {
      const { id } = z
        .object({
          id: z.string().describe("The ID of the to-do item to toggle"),
        })
        .parse(rawParams);

      const updated = toggleTodo(id);
      if (!updated) {
        return {
          content: [
            {
              type: "text",
              text: `To-do item with ID "${id}" not found.`,
            },
          ],
          isError: true,
        };
      }

      const todos = getAllTodos();

      return {
        content: [
          {
            type: "text",
            text: `To-do "${updated.title}" marked as ${updated.completed ? "completed" : "incomplete"}.`,
          },
        ],
        structuredContent: {
          todos,
          updatedTodo: updated,
        },
      };
    },
  );

  server.registerTool(
    "todos.delete_todo",
    {
      title: "Delete To-Do Item",
      description:
        "Deletes a to-do item from the list. Called by the widget when user deletes a task.",
      inputSchema: {
        id: z
          .string()
          .describe("The ID of the to-do item to delete"),
      },
      _meta: {
        "openai/toolInvocation/invoking": "Deleting todo",
        "openai/toolInvocation/invoked": "Todo deleted",
      },
    },
    async (rawParams) => {
      const { id } = z
        .object({
          id: z.string().describe("The ID of the to-do item to delete"),
        })
        .parse(rawParams);

      const todo = getTodoById(id);
      const deleted = deleteTodo(id);

      if (!deleted) {
        return {
          content: [
            {
              type: "text",
              text: `To-do item with ID "${id}" not found.`,
            },
          ],
          isError: true,
        };
      }

      const todos = getAllTodos();

      return {
        content: [
          {
            type: "text",
            text: `Deleted to-do: "${todo?.title || id}"`,
          },
        ],
        structuredContent: {
          todos,
          deletedId: id,
        },
      };
    },
  );

  server.registerTool(
    "todos.save_todo_state",
    {
      title: "Save To-Do State",
      description:
        "Saves the current state of todos from the widget. Called by the component to persist changes.",
      inputSchema: {
        todos: z
          .array(
            z.object({
              id: z.string(),
              title: z.string(),
              completed: z.boolean(),
              createdAt: z.number(),
            })
          )
          .describe("Array of all todos to save"),
      },
      _meta: {
        "openai/toolInvocation/invoking": "Saving todo state",
        "openai/toolInvocation/invoked": "Todo state saved",
      },
    },
    async (rawParams) => {
      const { todos: todosToSave } = z
        .object({
          todos: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                completed: z.boolean(),
                createdAt: z.number(),
              })
            )
            .describe("Array of all todos to save"),
        })
        .parse(rawParams);

      // In a real app, you'd save to a database here
      // For this boilerplate, we just return the saved todos
      const allTodos = getAllTodos();

      return {
        content: [
          {
            type: "text",
            text: `Saved ${todosToSave.length} todo${todosToSave.length !== 1 ? "s" : ""}.`,
          },
        ],
        structuredContent: {
          todos: allTodos,
        },
      };
    },
  );

  console.log("MCP server registered");
  return { server };
};

