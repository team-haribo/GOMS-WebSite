import { NextResponse } from "next/server";
import {
  createAdminAccount,
  findAdminAccount,
  logAdminActivity,
  type AdminAccount,
} from "@/lib/storage";
import { hashPassword } from "@/lib/password";
import { ensureSeededAndCount } from "@/lib/auth";
import {
  getClientIp,
  getUserAgent,
  parseDeviceLabel,
} from "@/lib/request-info";

const ID_RE = /^[a-z][a-z0-9_-]{2,30}$/i;

export async function POST(req: Request) {
  let body: { id?: string; name?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const id = (body.id ?? "").trim();
  const name = (body.name ?? "").trim();
  const password = body.password ?? "";

  if (!ID_RE.test(id)) {
    return NextResponse.json(
      { error: "아이디는 영문으로 시작하는 3~31자 영숫자/_/-만 가능해요." },
      { status: 400 },
    );
  }
  if (!name || name.length > 40) {
    return NextResponse.json(
      { error: "이름을 1~40자로 입력해주세요." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "비밀번호는 8자 이상이어야 해요." },
      { status: 400 },
    );
  }
  if (password.length > 128) {
    return NextResponse.json(
      { error: "비밀번호가 너무 길어요." },
      { status: 400 },
    );
  }

  // Seed env admin if this is the very first call so we can reject
  // duplicate registrations for it.
  const totalAccounts = await ensureSeededAndCount();

  // Hard cap total account rows — the whole list lives in a single KV
  // row so an unbounded number of pending registrations could inflate it
  // into the MB range. 100 is generous for a school project; admins can
  // reject spam via the accounts tab once they notice.
  const MAX_ACCOUNTS = 100;
  if (totalAccounts >= MAX_ACCOUNTS) {
    return NextResponse.json(
      {
        error: "계정 정원이 가득 찼어요. 관리자에게 문의해주세요.",
      },
      { status: 429 },
    );
  }

  const existing = await findAdminAccount(id);
  if (existing) {
    return NextResponse.json(
      { error: "이미 같은 아이디가 있어요." },
      { status: 409 },
    );
  }

  const { hash, salt } = await hashPassword(password);
  const account: AdminAccount = {
    id,
    name,
    passwordHash: hash,
    passwordSalt: salt,
    status: "pending",
    role: "admin",
    createdAt: new Date().toISOString(),
  };

  try {
    await createAdminAccount(account);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "저장 실패" },
      { status: 500 },
    );
  }

  // Record the registration in the global activity log so existing admins
  // see it in the audit channel.
  const ip = getClientIp(req);
  const ua = getUserAgent(req);
  const device = parseDeviceLabel(ua);
  await logAdminActivity({
    adminId: id,
    action: "account.register",
    description: `${name} (${id}) 가입 신청 · ${device} · ${ip}`,
    meta: { ip, userAgent: ua, device, name },
  });

  return NextResponse.json({ ok: true });
}
