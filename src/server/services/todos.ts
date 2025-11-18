/**
 * TODOS.TS - To-Do List Service
 * 
 * This service manages to-do items. In a production app, this would typically
 * connect to a database. For this boilerplate, we use in-memory storage.
 */

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

// In-memory storage (replace with database in production)
const todos: Map<string, Todo> = new Map();

// Initialize with sample todos
const initializeSampleTodos = () => {
  const sampleTodos: Todo[] = [
    { id: "1", title: "Learn about MCP", completed: false, createdAt: Date.now() },
    { id: "2", title: "Build a ChatGPT app", completed: false, createdAt: Date.now() },
    { id: "3", title: "Deploy to Vercel", completed: false, createdAt: Date.now() },
  ];
  
  sampleTodos.forEach(todo => todos.set(todo.id, todo));
};

// Initialize on first import
if (todos.size === 0) {
  initializeSampleTodos();
}

export function getAllTodos(): Todo[] {
  return Array.from(todos.values()).sort((a, b) => a.createdAt - b.createdAt);
}

export function getTodoById(id: string): Todo | undefined {
  return todos.get(id);
}

export function createTodo(title: string): Todo {
  const id = Date.now().toString();
  const todo: Todo = {
    id,
    title,
    completed: false,
    createdAt: Date.now(),
  };
  todos.set(id, todo);
  return todo;
}

export function updateTodo(id: string, updates: Partial<Pick<Todo, "title" | "completed">>): Todo | null {
  const todo = todos.get(id);
  if (!todo) {
    return null;
  }
  
  const updated: Todo = {
    ...todo,
    ...updates,
  };
  todos.set(id, updated);
  return updated;
}

export function deleteTodo(id: string): boolean {
  return todos.delete(id);
}

export function toggleTodo(id: string): Todo | null {
  const todo = todos.get(id);
  if (!todo) {
    return null;
  }
  return updateTodo(id, { completed: !todo.completed });
}

