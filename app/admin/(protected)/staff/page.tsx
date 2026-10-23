import { getStaff, getBranches } from "@/lib/queries/staff";
import { requireSession } from "@/lib/guard";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const { session } = await requireSession(["CLINIC_ADMIN"]);
  const [users, branches] = await Promise.all([getStaff(), getBranches()]);
  return (
    <StaffClient
      initialUsers={users}
      branches={branches}
      currentUserId={session?.userId}
    />
  );
}
