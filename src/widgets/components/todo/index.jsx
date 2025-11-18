/**
 * TODO/INDEX.JSX - To-Do List Component Entry Point
 * 
 * This file is the entry point for the To-Do List widget used in ChatGPT.
 * It renders the Todo component into the DOM element with id "todo-root"
 * and exports it for use by the MCP server.
 * 
 * This file is bundled and served by the MCP server as a widget resource.
 */

import { createRoot } from "react-dom/client";
import App from "./todo";

console.log('[Todo Index] Entry point executing');
console.log('[Todo Index] Document ready state:', document.readyState);
console.log('[Todo Index] Looking for root element: todo-root');

const rootElement = document.getElementById("todo-root");
console.log('[Todo Index] Root element found:', !!rootElement);
console.log('[Todo Index] Root element:', rootElement);

if (!rootElement) {
  console.error('[Todo Index] ERROR: Root element "todo-root" not found!');
  console.error('[Todo Index] Available elements:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
  throw new Error('Root element "todo-root" not found');
}

console.log('[Todo Index] Creating React root...');
const root = createRoot(rootElement);
console.log('[Todo Index] Rendering App component...');
root.render(<App />);
console.log('[Todo Index] App component rendered');

export { App };
export { App as Todo };
export default App;