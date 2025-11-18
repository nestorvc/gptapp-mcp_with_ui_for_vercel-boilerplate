/**
 * React hooks for interacting with the ChatGPT App SDK window.openai API
 * 
 * These hooks provide a clean interface to the window.openai global object
 * that ChatGPT injects into your component iframe. They handle:
 * - useToolOutput() - Read data from MCP server tool response
 * - useToolInput() - Read parameters passed to your MCP tool
 * - useWidgetState(initialState) - Persist state visible to ChatGPT
 * - useCallTool() - Call MCP server tools from component
 * - useSendFollowUpMessage() - Send messages to ChatGPT conversation
 * - useRequestDisplayMode() - Request layout changes (inline/pip/fullscreen)
 * - useOpenAIGlobals() - Access theme, device, and layout information
 */

import { useCallback, useEffect, useState } from 'react';

declare global {
  interface Window {
    openai?: {
      toolInput: any;
      toolOutput: any;
      toolResponseMetadata: any;
      widgetState: any;
      
      theme: 'light' | 'dark';
      userAgent: {
        device: { type: 'mobile' | 'tablet' | 'desktop' | 'unknown' };
        capabilities: { hover: boolean; touch: boolean };
      };
      locale: string;
      maxHeight: number;
      displayMode: 'pip' | 'inline' | 'fullscreen';
      safeArea: {
        insets: { top: number; bottom: number; left: number; right: number };
      };
      
      callTool: (name: string, args: Record<string, unknown>) => Promise<any>;
      sendFollowUpMessage: (args: { prompt: string }) => Promise<void>;
      openExternal: (payload: { href: string }) => void;
      requestDisplayMode: (args: { mode: 'pip' | 'inline' | 'fullscreen' }) => Promise<{ mode: string }>;
      setWidgetState: (state: any) => Promise<void>;
    };
  }
}

export function useToolOutput() {
  const [toolOutput, setToolOutput] = useState(window.openai?.toolOutput || null);
  
  useEffect(() => {
    const handleGlobalUpdate = () => {
      setToolOutput(window.openai?.toolOutput || null);
    };
    
    window.addEventListener('openai:set_globals', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('openai:set_globals', handleGlobalUpdate);
    };
  }, []);
  
  return toolOutput;
}

export function useToolInput() {
  const [toolInput, setToolInput] = useState(window.openai?.toolInput || null);
  
  useEffect(() => {
    const handleGlobalUpdate = () => {
      setToolInput(window.openai?.toolInput || null);
    };
    
    window.addEventListener('openai:set_globals', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('openai:set_globals', handleGlobalUpdate);
    };
  }, []);
  
  return toolInput;
}

export function useWidgetState<T>(initialState: T) {
  const [state, setState] = useState<T>(() => {
    return window.openai?.widgetState || initialState;
  });
  
  useEffect(() => {
    const handleGlobalUpdate = () => {
      if (window.openai?.widgetState !== undefined) {
        setState(window.openai.widgetState);
      }
    };
    
    window.addEventListener('openai:set_globals', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('openai:set_globals', handleGlobalUpdate);
    };
  }, []);
  
  const setPersistedState = useCallback((newState: T | ((prev: T) => T)) => {
    setState(prevState => {
      const resolvedState = typeof newState === 'function' 
        ? (newState as (prev: T) => T)(prevState) 
        : newState;
      
      window.openai?.setWidgetState(resolvedState);
      
      return resolvedState;
    });
  }, []);
  
  return [state, setPersistedState] as const;
}

export function useCallTool() {
  const [isLoading, setIsLoading] = useState(false);
  
  const callTool = useCallback(async (name: string, args: Record<string, unknown> = {}) => {
    if (!window.openai?.callTool) {
      throw new Error('window.openai.callTool is not available');
    }
    
    setIsLoading(true);
    try {
      const result = await window.openai.callTool(name, args);
      return result;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  return { callTool, isLoading };
}

export function useSendFollowUpMessage() {
  return useCallback(async (prompt: string) => {
    if (!window.openai?.sendFollowUpMessage) {
      throw new Error('window.openai.sendFollowUpMessage is not available');
    }
    
    await window.openai.sendFollowUpMessage({ prompt });
  }, []);
}

export function useRequestDisplayMode() {
  return useCallback(async (mode: 'pip' | 'inline' | 'fullscreen') => {
    if (!window.openai?.requestDisplayMode) {
      throw new Error('window.openai.requestDisplayMode is not available');
    }
    
    return await window.openai.requestDisplayMode({ mode });
  }, []);
}

export function useOpenExternal() {
  return useCallback((href: string) => {
    if (!window.openai?.openExternal) {
      throw new Error('window.openai.openExternal is not available');
    }

    window.openai.openExternal({ href });
  }, []);
}

export function useOpenAIGlobals() {
  const [globals, setGlobals] = useState(() => ({
    theme: window.openai?.theme || 'light',
    userAgent: window.openai?.userAgent || { device: { type: 'unknown' }, capabilities: { hover: false, touch: false } },
    locale: window.openai?.locale || 'en',
    maxHeight: window.openai?.maxHeight || 400,
    displayMode: window.openai?.displayMode || 'inline',
    safeArea: window.openai?.safeArea || { insets: { top: 0, bottom: 0, left: 0, right: 0 } }
  }));
  
  useEffect(() => {
    const handleGlobalUpdate = () => {
      if (window.openai) {
        setGlobals({
          theme: window.openai.theme || 'light',
          userAgent: window.openai.userAgent || { device: { type: 'unknown' }, capabilities: { hover: false, touch: false } },
          locale: window.openai.locale || 'en',
          maxHeight: window.openai.maxHeight || 400,
          displayMode: window.openai.displayMode || 'inline',
          safeArea: window.openai.safeArea || { insets: { top: 0, bottom: 0, left: 0, right: 0 } }
        });
      }
    };
    
    window.addEventListener('openai:set_globals', handleGlobalUpdate);
    
    return () => {
      window.removeEventListener('openai:set_globals', handleGlobalUpdate);
    };
  }, []);
  
  return globals;
}

