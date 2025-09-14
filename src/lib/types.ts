export interface Publication {
  category: string;
  board: "paid" | "free" | "rising" | "trending" | null;
  rank: number | null;
  name: string;
  slug: string;
  publication_url: string;
  subscriber_count: number;
  snapshot_date?: string;
  author_handle?: string | null;
  paid_subscriber_count?: number | null;
  count_source?: string;
  user_id?: number;
  bio?: string;
  subscriber_count_display?: string;
  publication_id?: number;
  publication_name?: string;
  subdomain?: string;
  custom_domain?: string | null;
  payments_enabled?: boolean;
  leaderboard_category?: string | null;
  bestseller_tier?: number;
  category_2?: string;
  is_bestseller?: boolean;
}

export interface FilterState {
  category: string;
  board: "paid" | "free" | "rising";
}

// Lazy Loading Types
export interface LazyLoadState {
  isIntersecting: boolean;
  isLoading: boolean;
  hasLoaded: boolean;
  hasError: boolean;
  errorMessage?: string;
  retryCount: number;
}

export interface LazyComponentProps {
  componentImport: () => Promise<any>;
  fallbackHeight?: string;
  loadingComponent?: any;
  errorComponent?: any;
  props?: Record<string, any>;
  priority?: 'high' | 'medium' | 'low';
}

export interface ComponentRegistry {
  [key: string]: {
    import: () => Promise<any>;
    priority: 'high' | 'medium' | 'low';
    fallbackHeight: string;
    dependencies?: string[];
  };
}