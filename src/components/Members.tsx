import { getMembers } from "@/lib/getMembers";
import MembersMarquee from "./MembersMarquee";

export default async function Members() {
  const members = await getMembers();

  return (
    <section id="members" className="py-24 sm:py-32 bg-[#FFF8EE]">
      <MembersMarquee members={members} />
    </section>
  );
}
