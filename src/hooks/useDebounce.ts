import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value by the specified delay
 * Useful for preventing excessive API calls during user input
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set a timeout to update the debounced value after the delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Clear the timeout if value changes before the delay
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook that provides a debounced callback function
 * Useful for debouncing function calls like search requests
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = ((...args: Parameters<T>) => {
    // Clear existing timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return debouncedCallback;
}

/**
 * Hook for request deduplication to prevent multiple identical requests
 */
export function useRequestDeduplication() {
  const [pendingRequests, setPendingRequests] = useState<Set<string>>(new Set());

  const isRequestPending = (key: string): boolean => {
    return pendingRequests.has(key);
  };

  const addPendingRequest = (key: string): void => {
    setPendingRequests(prev => new Set(prev).add(key));
  };

  const removePendingRequest = (key: string): void => {
    setPendingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const executeRequest = async <T>(
    key: string,
    requestFunction: () => Promise<T>
  ): Promise<T | null> => {
    // If request is already pending, skip
    if (isRequestPending(key)) {
      console.log('🔄 Request already pending, skipping:', key);
      return null;
    }

    try {
      addPendingRequest(key);
      const result = await requestFunction();
      return result;
    } finally {
      removePendingRequest(key);
    }
  };

  return {
    isRequestPending,
    executeRequest,
    pendingRequests: Array.from(pendingRequests)
  };
}