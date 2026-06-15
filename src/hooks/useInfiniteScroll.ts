import { useState, useCallback, useRef, useEffect } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchPage: (page: number, size: number) => Promise<{ content: T[]; last: boolean; totalElements: number }>;
  pageSize: number;
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingAll: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  setItems: React.Dispatch<React.SetStateAction<T[]>>;
  loadAllPages: () => Promise<void>;
}

export function useInfiniteScroll<T>({ fetchPage, pageSize }: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingAll, setIsLoadingAll] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageRef = useRef(0);
  const cancelledRef = useRef(false);

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

  const loadAllPages = useCallback(async () => {
    cancelledRef.current = false;
    setIsLoadingAll(true);
    
    let currentPage = 0;
    let allItems: T[] = [];
    let hasMorePages = true;
    
    while (hasMorePages) {
      if (cancelledRef.current) break;
      try {
        const response = await fetchPage(currentPage, pageSize);
        allItems = [...allItems, ...response.content];
        hasMorePages = !response.last;
        currentPage++;
      } catch (error) {
        console.error('Error loading page during loadAll:', error);
        break;
      }
    }
    
    if (!cancelledRef.current) {
      setItems(allItems);
      setHasMore(false);
      pageRef.current = currentPage;
    }
    setIsLoadingAll(false);
  }, [fetchPage, pageSize]);

  return {
    items,
    isLoading,
    isLoadingMore,
    isLoadingAll,
    hasMore,
    loadMore,
    refresh,
    setItems,
    loadAllPages,
  };
}
