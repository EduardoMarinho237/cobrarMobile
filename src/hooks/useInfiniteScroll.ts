import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number, size: number) => Promise<{ content: T[]; last: boolean; totalElements: number }>;
  pageSize: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
}

export function useInfiniteScroll<T>({ fetchPage, pageSize }: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const isFirstLoad = pageRef.current === 0;
    if (isFirstLoad) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    try {
      const response = await fetchPage(pageRef.current, pageSize);
      
      if (isFirstLoad) {
        setItems(response.content);
      } else {
        setItems((prev) => [...prev, ...response.content]);
      }

      setHasMore(!response.last);
      pageRef.current += 1;
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [fetchPage, pageSize, isLoading, isLoadingMore, hasMore]);

  // Auto-load first page on mount
  useEffect(() => {
    loadMore();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = useCallback(async () => {
    pageRef.current = 0;
    setHasMore(true);
    setIsLoading(true);
    
    try {
      const response = await fetchPage(0, pageSize);
      setItems(response.content);
      setHasMore(!response.last);
      pageRef.current = 1;
    } catch (error) {
      console.error('Error refreshing:', error);
    } finally {
      setIsLoading(false);
    }
  }, [fetchPage, pageSize]);

  return {
    items,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    refresh,
    setItems,
  };
}
