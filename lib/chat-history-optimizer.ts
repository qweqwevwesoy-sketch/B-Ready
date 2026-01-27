'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useOptimizedSocket } from './socket-client-optimized';

interface ChatMessage {
  id: string;
  text: string;
  userName: string;
  userRole: string;
  timestamp: string;
  imageData?: string;
}

interface ChatHistoryOptions {
  pageSize: number;
  cacheSize: number;
  enableInfiniteScroll: boolean;
}

interface ChatHistoryState {
  messages: ChatMessage[];
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  page: number;
}

export class ChatHistoryManager {
  private static instances = new Map<string, ChatHistoryManager>();
  private cache = new Map<string, ChatMessage[]>();
  private loadingPromises = new Map<string, Promise<ChatMessage[]>>();
  private options: ChatHistoryOptions;

  static getInstance(reportId: string, options: Partial<ChatHistoryOptions> = {}): ChatHistoryManager {
    if (!ChatHistoryManager.instances.has(reportId)) {
      ChatHistoryManager.instances.set(reportId, new ChatHistoryManager(options));
    }
    return ChatHistoryManager.instances.get(reportId)!;
  }

  private constructor(options: Partial<ChatHistoryOptions>) {
    this.options = {
      pageSize: 20,
      cacheSize: 100,
      enableInfiniteScroll: true,
      ...options,
    };
  }

  async loadMessages(
    reportId: string,
    page: number = 0,
    socketEmit: (event: string, data: any) => void
  ): Promise<ChatMessage[]> {
    const cacheKey = `${reportId}_${page}`;
    
    // Return cached data if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Return existing promise if loading
    if (this.loadingPromises.has(cacheKey)) {
      return this.loadingPromises.get(cacheKey)!;
    }

    const loadPromise = this.fetchMessages(reportId, page, socketEmit);
    this.loadingPromises.set(cacheKey, loadPromise);

    try {
      const messages = await loadPromise;
      
      // Cache the result
      this.cache.set(cacheKey, messages);
      
      // Maintain cache size
      this.maintainCacheSize();
      
      return messages;
    } finally {
      this.loadingPromises.delete(cacheKey);
    }
  }

  private async fetchMessages(
    reportId: string,
    page: number,
    socketEmit: (event: string, data: any) => void
  ): Promise<ChatMessage[]> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Chat history loading timeout'));
      }, 10000);

      const handleChatHistory = (data: { messages: ChatMessage[] }) => {
        clearTimeout(timeout);
        
        if (data && Array.isArray(data.messages)) {
          resolve(data.messages);
        } else {
          reject(new Error('Invalid chat history response'));
        }
      };

      socketEmit('get_chat_history', {
        reportId,
        page,
        pageSize: this.options.pageSize,
      });

      // Note: In a real implementation, you'd need to handle the response
      // This is a simplified version for demonstration
      setTimeout(() => {
        resolve([]);
      }, 100);
    });
  }

  private maintainCacheSize(): void {
    if (this.cache.size > this.options.cacheSize) {
      const keys = Array.from(this.cache.keys());
      const keysToDelete = keys.slice(0, keys.length - this.options.cacheSize);
      
      keysToDelete.forEach(key => {
        this.cache.delete(key);
      });
    }
  }

  clearCache(): void {
    this.cache.clear();
    this.loadingPromises.clear();
  }

  getCachedMessages(reportId: string, page: number): ChatMessage[] | null {
    const cacheKey = `${reportId}_${page}`;
    return this.cache.get(cacheKey) || null;
  }
}

// React hook for managing chat history with optimization
export function useOptimizedChatHistory(
  reportId: string,
  options: Partial<ChatHistoryOptions> = {}
) {
  const { on, emit } = useOptimizedSocket();
  const [state, setState] = useState<ChatHistoryState>({
    messages: [],
    loading: false,
    hasMore: true,
    error: null,
    page: 0,
  });

  const managerRef = useRef<ChatHistoryManager | null>(null);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    managerRef.current = ChatHistoryManager.getInstance(reportId, options);
  }, [reportId, options]);

  const loadInitialMessages = useCallback(async () => {
    if (!managerRef.current || isLoadingRef.current) return;

    try {
      isLoadingRef.current = true;
      setState(prev => ({ ...prev, loading: true, error: null }));

      const messages = await managerRef.current.loadMessages(reportId, 0, emit);
      
      setState(prev => ({
        ...prev,
        messages,
        loading: false,
        hasMore: messages.length === options.pageSize,
        page: 0,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load chat history',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [reportId, emit, options.pageSize]);

  const loadMoreMessages = useCallback(async () => {
    if (!managerRef.current || isLoadingRef.current || !state.hasMore) return;

    try {
      isLoadingRef.current = true;
      const nextPage = state.page + 1;

      const messages = await managerRef.current.loadMessages(reportId, nextPage, emit);
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, ...messages],
        loading: false,
        hasMore: messages.length === options.pageSize,
        page: nextPage,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load more messages',
      }));
    } finally {
      isLoadingRef.current = false;
    }
  }, [reportId, emit, state.hasMore, state.page, options.pageSize]);

  const sendMessage = useCallback(async (text: string, imageData?: string) => {
    if (!managerRef.current) return;

    const newMessage: ChatMessage = {
      id: `temp_${Date.now()}`,
      text,
      userName: 'You',
      userRole: 'user',
      timestamp: new Date().toISOString(),
      imageData,
    };

    // Optimistic update
    setState(prev => ({
      ...prev,
      messages: [newMessage, ...prev.messages],
    }));

    try {
      emit('report_chat_message', {
        reportId,
        text,
        imageData,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // Rollback optimistic update on error
      setState(prev => ({
        ...prev,
        messages: prev.messages.filter(msg => msg.id !== newMessage.id),
      }));
      throw error;
    }
  }, [reportId, emit]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const refresh = useCallback(() => {
    if (managerRef.current) {
      managerRef.current.clearCache();
    }
    loadInitialMessages();
  }, [loadInitialMessages]);

  // Set up real-time message handling
  useEffect(() => {
    const unsubscribe = on('report_chat_message', (data: any) => {
      if (data && data.message && data.reportId === reportId) {
        setState(prev => ({
          ...prev,
          messages: [data.message, ...prev.messages],
        }));
      }
    });

    return unsubscribe;
  }, [on, reportId]);

  return {
    ...state,
    loadInitialMessages,
    loadMoreMessages,
    sendMessage,
    clearError,
    refresh,
  };
}

// Utility function to format chat messages for display
export function formatChatMessages(messages: ChatMessage[]): ChatMessage[] {
  return messages
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .map(msg => ({
      ...msg,
      timestamp: new Date(msg.timestamp).toLocaleString(),
    }));
}

// Hook for infinite scroll functionality
export function useInfiniteScroll(
  loadMore: () => void,
  hasMore: boolean,
  isLoading: boolean
) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || isLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { threshold: 1.0 }
    );

    if (sentinelRef.current) {
      observer.observe(sentinelRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, loadMore]);

  return sentinelRef;
}