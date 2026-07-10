import { getStaff } from "@/lib/queries/staff";
import StaffClient from "./StaffClient";

export default async function StaffPage() {
  const users = await getStaff();
  return <StaffClient initialUsers={users} />;
}
