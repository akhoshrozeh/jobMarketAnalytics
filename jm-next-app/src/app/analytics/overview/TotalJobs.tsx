import { getTotalJobs } from "@/lib/dataAcessLayer";

export default async function TotalJobs({totalJobs}: {totalJobs: number}) {

  return (
    <>
      {totalJobs}
    </>
  );
}