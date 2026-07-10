import { getAppointments } from "@/lib/queries/appointments";
import AppointmentsClient from "./AppointmentsClient";

export default async function AppointmentsPage() {
  const appointments = await getAppointments();

  const serialized = appointments.map((a) => ({
    ...a,
    datetime: a.datetime.toISOString(),
  }));

  return <AppointmentsClient initialAppointments={serialized} />;
}
