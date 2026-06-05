export interface Repository {
  id: string;
  organizationId: string;
  organizationName: string;
  name: string;
  githubUrl?: string;
  description?: string;
  primaryTechStack?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
