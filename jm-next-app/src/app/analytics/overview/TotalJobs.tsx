import { getTotalJobs } from "@/lib/dataAcessLayer";

export default async function TotalJobs() {
  const totalJobs = await getTotalJobs();
  return (
    <>
      {totalJobs}
    </>
  );
}