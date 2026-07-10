import { getPatients } from "@/lib/queries/patients";
import PatientsClient from "./PatientsClient";

// Server component
export default async function PatientsPage() {
  const initialPatients = await getPatients();
  
  // Transform dates to strings for client components
  const serialized = initialPatients.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString()
  }));

  return <PatientsClient initialPatients={serialized} />;
}
