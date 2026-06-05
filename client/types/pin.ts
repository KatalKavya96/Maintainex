export type PinCategory = "REPOSITORY" | "ISSUE" | "PULL_REQUEST" | "DOCUMENTATION" | "PROJECT_BOARD" | "ORGANIZATION" | "WEBSITE" | "OTHER";

export type Pin = {
  id: string;
  userId: string;
  title: string;
  url: string;
  description?: string | null;
  category: PinCategory;
  customCategory?: string | null;
  iconUrl?: string | null;
  faviconUrl?: string | null;
  imageUrl?: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  tags: string[];
  sortOrder: number;
  lastOpenedAt?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PinInput = Omit<Pin, "id" | "userId" | "createdAt" | "updatedAt" | "lastOpenedAt" | "tags"> & {
  tags: string[];
};

export type PinListResponse = {
  items: Pin[];
  total: number;
  page: number;
  limit: number;
};
