import {
  getMembersMeta,
  getMemberSnapshot,
  upsertMemberSnapshot,
} from "./storage";

export interface Member {
  name: string;
  github: string;
  role: string;
  avatar: string;
  generation?: number;
  leader?: boolean;
}

const ORG = "team-haribo";

interface GitHubMember {
  login: string;
  avatar_url: string;
}

export async function getMembers(): Promise<Member[]> {
  const [meta, snapshot] = await Promise.all([
    getMembersMeta(),
    getMemberSnapshot(),
  ]);
  const metaByLogin = meta.byLogin ?? {};
  const hidden = new Set((meta.hidden ?? []).map((l) => l.toLowerCase()));

  const token = process.env.GITHUB_TOKEN;
  const headers: HeadersInit = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  // Login → avatar map used to build final list
  const avatarByLogin = new Map<string, string>();
  // Seed from stored snapshot (so people who left the org still appear)
  for (const s of snapshot) {
    avatarByLogin.set(s.login.toLowerCase(), s.avatar);
  }

  let fetchedFromGitHub = false;
  try {
    const res = await fetch(
      `https://api.github.com/orgs/${ORG}/members?per_page=100`,
      { headers, next: { revalidate: 300, tags: ["members"] } },
    );
    if (res.ok) {
      fetchedFromGitHub = true;
      const data: GitHubMember[] = await res.json();
      // Overwrite avatars with freshest GitHub data
      for (const u of data) {
        avatarByLogin.set(u.login.toLowerCase(), u.avatar_url);
      }
      // Persist snapshot so these people stay even if they leave later.
      // Fire-and-forget — no need to block the response on this write.
      upsertMemberSnapshot(
        data.map((u) => ({ login: u.login, avatar: u.avatar_url })),
      ).catch((err) => console.warn("[getMembers] snapshot write failed:", err));
    } else {
      console.warn(`[getMembers] GitHub API returned ${res.status}`);
    }
  } catch (err) {
    console.warn("[getMembers] fetch failed:", err);
  }

  // Build org member list from avatar map (GitHub + snapshot), minus hidden
  const orgMembers: Member[] = [];
  for (const [loginLower, avatar] of avatarByLogin.entries()) {
    if (hidden.has(loginLower)) continue;
    const m = metaByLogin[loginLower];
    // Use the original-case login from snapshot if available
    const snapEntry = snapshot.find(
      (s) => s.login.toLowerCase() === loginLower,
    );
    const login = snapEntry?.login ?? loginLower;
    orgMembers.push({
      name: m?.name ?? login,
      github: login,
      role: m?.role ?? "Member",
      avatar,
      generation: m?.generation,
      leader: m?.leader,
    });
  }

  // If GitHub fetch failed AND we have no snapshot, return empty
  // (this is the first ever run without network) — same as before
  if (!fetchedFromGitHub && orgMembers.length === 0) {
    console.warn("[getMembers] no GitHub data and no snapshot");
  }

  // Merge extra (non-org) members
  const extras: Member[] = (meta.extra ?? []).map((e) => ({
    name: e.name,
    github: e.login,
    role: e.role,
    avatar: e.avatar,
    generation: e.generation,
    leader: e.leader,
  }));

  const all = [...orgMembers, ...extras];

  // Sort by role group then name
  const order = ["iOS", "Flutter", "Backend", "Android", "Design"];
  return all.sort((a, b) => {
    const ai = order.indexOf(a.role);
    const bi = order.indexOf(b.role);
    if (ai !== bi) return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    return a.name.localeCompare(b.name, "ko");
  });
}
