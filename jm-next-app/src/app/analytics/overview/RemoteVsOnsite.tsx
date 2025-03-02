import { getRemoteVsOnsiteJobs } from "@/lib/dataAcessLayer";
import { RemoteVsNonRemotePie } from "../Graphs";
export default async function RemoteVsOnsite() {

    const remoteVsOnsiteJobs = await getRemoteVsOnsiteJobs();
    const totalJobs = remoteVsOnsiteJobs[0].total;
    const remote = remoteVsOnsiteJobs[0].remote;
    const onsite = remoteVsOnsiteJobs[0].nonRemote;
    return (
        <div className="flex flex-col items-center justify-center">
            <p>Remote Jobs: {((remote / (remote + onsite)) * 100).toFixed(1)}%</p>
            <p>Onsite Jobs: {((onsite / (remote + onsite)) * 100).toFixed(1)}%</p>
            <RemoteVsNonRemotePie data={remoteVsOnsiteJobs[0] as { remote: number; nonRemote: number }} />
        </div>
    )
}