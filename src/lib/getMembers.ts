import { getMembersMeta } from "./storage";

export interface Member {
  name: string;
  github: string;
  role: string;
  avatar: string;
  leader?: number;
}

const ORG = "team-haribo";

interface GitHubMember {
  login: string;
  avatar_url: string;
}

export async function getMembers(): Promise<Member[]> {
  const meta = await getMembersMeta();
  const metaByLogin = meta.byLogin ?? {};
  const hidden = new Set((meta.hidden ?? []).map((l) => l.toLowerCase()));

  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  let orgMembers: Member[] = [];
  try {
    const res = await fetch(
      `https://api.github.com/orgs/${ORG}/members?per_page=100`,
      { headers, next: { revalidate: 300, tags: ["members"] } },
    );
    if (res.ok) {
      const data: GitHubMember[] = await res.json();
      orgMembers = data
        .filter((u) => !hidden.has(u.login.toLowerCase()))
        .map((u) => {
          const m = metaByLogin[u.login.toLowerCase()];
          return {
            name: m?.name ?? u.login,
            github: u.login,
            role: m?.role ?? "Member",
            avatar: u.avatar_url,
            leader: m?.leader,
          };
        });
    } else {
      console.warn(`[getMembers] GitHub API returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[getMembers] fetch failed:", err);
  }

  // Merge extra (non-org) members
  const extras: Member[] = (meta.extra ?? []).map((e) => ({
    name: e.name,
    github: e.login,
    role: e.role,
    avatar: e.avatar,
    leader: e.leader,
  }));

  const all = [...orgMembers, ...extras];

  // Sort by role group
  const order = ["iOS", "Flutter", "Backend", "Android", "Design"];
  return all.sort((a, b) => {
    const ai = order.indexOf(a.role);
    const bi = order.indexOf(b.role);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name, "ko");
  });
}
