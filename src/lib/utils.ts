import type { Publication } from './types';

export function formatSubscriberCount(count: number): string {
  return count.toLocaleString();
}

export function getUniqueCategories(publications: Publication[]): string[] {
  const categories = new Set(publications.map(pub => pub.category));
  return Array.from(categories).sort();
}

export function validatePublicationData(publications: Publication[]): {
  valid: Publication[];
  invalid: any[];
  stats: {
    total: number;
    validCount: number;
    invalidCount: number;
    categories: string[];
    boardTypes: string[];
  };
} {
  const valid: Publication[] = [];
  const invalid: any[] = [];
  
  for (const pub of publications) {
    if (isValidPublication(pub)) {
      valid.push(pub);
    } else {
      invalid.push(pub);
    }
  }
  
  const categories = getUniqueCategories(valid);
  const boardTypes = Array.from(new Set(valid.map(pub => pub.board))).sort();
  
  return {
    valid,
    invalid,
    stats: {
      total: publications.length,
      validCount: valid.length,
      invalidCount: invalid.length,
      categories,
      boardTypes
    }
  };
}

export function filterByCategory(publications: Publication[], category: string): Publication[] {
  if (category === 'All Categories') {
    return publications;
  }
  return publications.filter(pub => pub.category === category);
}

export function filterByBoard(publications: Publication[], board: 'paid' | 'free' | 'rising' | 'trending'): Publication[] {
  return publications.filter(pub => pub.board === board);
}

export function sortBySubscriberCount(publications: Publication[]): Publication[] {
  return [...publications].sort((a, b) => b.subscriber_count - a.subscriber_count);
}

function isValidPublication(item: any): item is Publication {
  return (
    typeof item === 'object' &&
    item !== null &&
    typeof item.category === 'string' &&
    (item.board === 'paid' || item.board === 'free' || item.board === 'rising' || item.board === 'trending' || item.board === null) &&
    (typeof item.rank === 'number' || item.rank === null) &&
    typeof item.name === 'string' &&
    typeof item.slug === 'string' &&
    typeof item.publication_url === 'string' &&
    typeof item.subscriber_count === 'number'
  );
}