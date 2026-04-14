import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyApplicantToken, APPLICANT_COOKIE_NAME } from "@/lib/auth";

export async function GET() {
  const jar = await cookies();
  const token = jar.get(APPLICANT_COOKIE_NAME)?.value;
  const session = await verifyApplicantToken(token);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }
  return NextResponse.json({
    authenticated: true,
    email: session.email,
    name: session.name,
    picture: session.picture,
  });
}
