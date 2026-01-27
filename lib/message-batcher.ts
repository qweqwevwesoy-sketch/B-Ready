'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

interface MessageBatch {
  id: string;
  timestamp: number;
  messages: Array<{
    event: string;
    data: any;
    priority: 'high' | 'normal' | 'low';
  }>;
}

interface MessageBatcherOptions {
  batchSize: number;
  batchTimeout: number;
  maxQueueSize: number;
}

export class MessageBatcher {
  private static instance: MessageBatcher;
  private batches: Map<string, MessageBatch> = new Map();
  private queue: Array<{
    event: string;
    data: any;
    priority: 'high' | 'normal' | 'low';
    callback?: (error?: Error) => void;
  }> = [];
  private isProcessing = false;
  private options: MessageBatcherOptions;
  private emitCallback: (event: string, data: any) => void;

  static getInstance(
    emitCallback: (event: string, data: any) => void,
    options: Partial<MessageBatcherOptions> = {}
  ): MessageBatcher {
    if (!MessageBatcher.instance) {
      MessageBatcher.instance = new MessageBatcher(emitCallback, options);
    }
    return MessageBatcher.instance;
  }

  private constructor(
    emitCallback: (event: string, data: any) => void,
    options: Partial<MessageBatcherOptions>
  ) {
    this.emitCallback = emitCallback;
    this.options = {
      batchSize: 10,
      batchTimeout: 100,
      maxQueueSize: 1000,
      ...options,
    };
  }

  public queueMessage(
    event: string,
    data: any,
    priority: 'high' | 'normal' | 'low' = 'normal',
    callback?: (error?: Error) => void
  ): void {
    // Check queue size limit
    if (this.queue.length >= this.options.maxQueueSize) {
      console.warn('Message queue at capacity, dropping message');
      callback?.(new Error('Queue at capacity'));
      return;
    }

    // High priority messages are sent immediately
    if (priority === 'high') {
      this.emitCallback(event, data);
      callback?.();
      return;
    }

    this.queue.push({ event, data, priority, callback });
    this.processQueue();
  }

  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;

    try {
      // Wait for batch timeout or until we have enough messages
      await new Promise(resolve => {
        setTimeout(resolve, this.options.batchTimeout);
      });

      if (this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      // Create batch
      const batchMessages = this.queue.splice(0, this.options.batchSize);
      const batch: MessageBatch = {
        id: `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        messages: batchMessages,
      };

      // Send batch
      try {
        this.emitCallback('batch_messages', batch);
        
        // Call success callbacks
        batchMessages.forEach(msg => {
          msg.callback?.();
        });
      } catch (error) {
        console.error('Failed to send message batch:', error);
        
        // Call error callbacks
        batchMessages.forEach(msg => {
          msg.callback?.(error as Error);
        });
      }
    } finally {
      this.isProcessing = false;
      
      // Process remaining messages
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public clearQueue(): void {
    this.queue.forEach(msg => {
      msg.callback?.(new Error('Queue cleared'));
    });
    this.queue = [];
  }
}

// React hook for using the message batcher
export function useMessageBatcher(
  emitCallback: (event: string, data: any) => void,
  options: Partial<MessageBatcherOptions> = {}
) {
  const batcherRef = useRef<MessageBatcher | null>(null);
  const [queueLength, setQueueLength] = useState(0);

  useEffect(() => {
    batcherRef.current = MessageBatcher.getInstance(emitCallback, options);
  }, [emitCallback, options]);

  const queueMessage = useCallback(
    (
      event: string,
      data: any,
      priority: 'high' | 'normal' | 'low' = 'normal',
      callback?: (error?: Error) => void
    ) => {
      if (batcherRef.current) {
        batcherRef.current.queueMessage(event, data, priority, callback);
        setQueueLength(batcherRef.current.getQueueLength());
      }
    },
    []
  );

  const clearQueue = useCallback(() => {
    if (batcherRef.current) {
      batcherRef.current.clearQueue();
      setQueueLength(0);
    }
  }, []);

  return {
    queueMessage,
    clearQueue,
    queueLength,
  };
}

// Batch processor for handling incoming message batches
export function processMessageBatch(
  batch: MessageBatch,
  handlers: {
    [event: string]: (data: any) => void | Promise<void>;
  }
): void {
  batch.messages.forEach(async (message) => {
    try {
      const handler = handlers[message.event];
      if (handler) {
        await handler(message.data);
      } else {
        console.warn(`No handler found for event: ${message.event}`);
      }
    } catch (error) {
      console.error(`Error processing message in batch ${batch.id}:`, error);
    }
  });
}

// Utility to create batch-aware socket events
export const batchedSocketEvents = {
  submitReport: (batcher: MessageBatcher, report: any) => {
    batcher.queueMessage('submit_report', report, 'high');
  },

  updateReport: (batcher: MessageBatcher, data: any) => {
    batcher.queueMessage('update_report', data, 'normal');
  },

  sendChatMessage: (batcher: MessageBatcher, data: any) => {
    batcher.queueMessage('report_chat_message', data, 'high');
  },

  bulkUpdateReports: (batcher: MessageBatcher, reports: any[]) => {
    batcher.queueMessage('bulk_update_reports', reports, 'low');
  },
};