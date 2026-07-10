import { getAttendance } from "@/lib/queries/attendance";
import AttendanceClient from "./AttendanceClient";

export default async function AttendancePage() {
  const attendance = await getAttendance();
  return <AttendanceClient initialData={attendance} />;
}
