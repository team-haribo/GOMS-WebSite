import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyApplicantToken, APPLICANT_COOKIE_NAME } from "@/lib/auth";
import {
  getApplications,
  getApplicationBatches,
  type Application,
} from "@/lib/storage";

/**
 * GET — return the current applicant's own submissions.
 *
 * Auth: applicant Google session cookie (NOT admin). The proxy explicitly
 * allows this path so unauthenticated visitors can hit it and get a 401
 * with a clean error body instead of a redirect.
 *
 * Returns both live submissions AND ones that have been moved into an
 * archive batch (when an admin closed a recruiting round). Strips
 * admin-only fields (adminNote) before returning.
 */
export async function GET() {
  const jar = await cookies();
  const token = jar.get(APPLICANT_COOKIE_NAME)?.value;
  const session = await verifyApplicantToken(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const myEmail = session.email.toLowerCase();

  type Mine = {
    id: string;
    name?: string;
    role?: string;
    status: "new" | "reviewing" | "passed" | "rejected" | "hired";
    createdAt: string;
    statusUpdatedAt?: string;
    source: "live" | "archive";
    batchTitle?: string;
    batchClosedAt?: string;
  };

  const sanitize = (a: Application): Omit<Mine, "source"> => ({
    id: a.id,
    name: a.name,
    role: a.role,
    status: a.status ?? "new",
    createdAt: a.createdAt,
    statusUpdatedAt: a.statusUpdatedAt,
  });

  const live = await getApplications();
  const liveMine: Mine[] = live
    .filter((a) => a.email?.toLowerCase() === myEmail)
    .map((a) => ({ ...sanitize(a), source: "live" }));

  const batches = await getApplicationBatches();
  const archivedMine: Mine[] = batches.flatMap((b) =>
    b.applications
      .filter((a) => a.email?.toLowerCase() === myEmail)
      .map((a) => ({
        ...sanitize(a),
        source: "archive",
        batchTitle: b.title,
        batchClosedAt: b.closedAt,
      })),
  );

  // Two-level sort: any row that has had its status touched comes
  // strictly before any row that hasn't. Within each group, sort by the
  // relevant timestamp descending.
  //
  // Group A — admin has updated the status: ordered by statusUpdatedAt
  //           desc (most recent change first).
  // Group B — never touched after submission: ordered by createdAt desc.
  //
  // Result: a status change always wins over a brand-new submission, but
  // freshly-submitted rows still land at the top of group B.
  const all = [...liveMine, ...archivedMine].sort((a, b) => {
    const aTouched = !!a.statusUpdatedAt;
    const bTouched = !!b.statusUpdatedAt;
    if (aTouched !== bTouched) return aTouched ? -1 : 1;
    if (aTouched && bTouched) {
      return a.statusUpdatedAt! < b.statusUpdatedAt! ? 1 : -1;
    }
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  return NextResponse.json({
    email: session.email,
    name: session.name,
    applications: all,
  });
}
