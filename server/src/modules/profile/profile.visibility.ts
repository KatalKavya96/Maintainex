type ProfileIdentity = {
  id: string; name: string; username: string; role: unknown; bio: string | null;
  githubUrl: string | null; linkedinUrl: string | null; xUrl: string | null;
  leetcodeUrl: string | null; portfolioUrl: string | null; skills: unknown;
  mainOrganizations: unknown; createdAt: Date;
};

/** An allowlist prevents future private fields from silently becoming profile API data. */
export function publicProfile(user: ProfileIdentity) {
  return {
    id: user.id, name: user.name, username: user.username, role: user.role,
    bio: user.bio, githubUrl: user.githubUrl, linkedinUrl: user.linkedinUrl,
    xUrl: user.xUrl, leetcodeUrl: user.leetcodeUrl, portfolioUrl: user.portfolioUrl,
    skills: user.skills, mainOrganizations: user.mainOrganizations, createdAt: user.createdAt
  };
}
