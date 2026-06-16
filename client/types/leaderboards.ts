export interface TopContributorEntry {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  contributions: number;
}

export interface TopOrganizationEntry {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  maintianexScore: number;
  contributions: number;
}

export interface ActiveRepositoryEntry {
  id: string;
  name: string;
  slug: string;
  fullName?: string | null;
  logoUrl?: string | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  maintianexScore: number;
  uniqueContributors: number;
  contributions: number;
}

export interface OpenSourceIndexItem {
  name: string;
  contributors: number;
}

export interface OpenSourceIndexResponse {
  byStack: OpenSourceIndexItem[];
  byIndustry: OpenSourceIndexItem[];
  bySoftwareValue: OpenSourceIndexItem[];
}

export interface CollectionEntry {
  id: string;
  title: string;
  description: string;
  type: string;
  itemCount: number;
  logoUrls: string[];
  saveCount: number;
  updatedAt: string;
}
