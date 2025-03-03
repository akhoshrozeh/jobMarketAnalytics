import { getRemoteVsOnsiteJobs } from "@/lib/dataAcessLayer";
import { RemoteVsNonRemotePie } from "../Graphs";
export default async function RemoteVsOnsite() {

    const remoteVsOnsiteJobs = await getRemoteVsOnsiteJobs();
    const totalJobs = remoteVsOnsiteJobs[0].total;
    const remote = remoteVsOnsiteJobs[0].remote;
    const onsite = remoteVsOnsiteJobs[0].nonRemote;
    const remotePercentage = ((remote / (remote + onsite)) * 100).toFixed(1);
    const onsitePercentage = ((onsite / (remote + onsite)) * 100).toFixed(1);
    return (
        <div className="flex flex-col items-center justify-center">
            {/* <p>Remote Jobs: {remotePercentage}%</p> */}
            {/* <p>Onsite Jobs: {onsitePercentage}%</p> */}
            <RemoteVsNonRemotePie data={{ remote: remote, nonRemote: onsite }} />
        </div>
    )
}