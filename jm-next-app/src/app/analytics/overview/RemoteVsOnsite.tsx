import { RemoteVsNonRemotePie } from "../Graphs";

export default async function RemoteVsOnsite({remoteVsOnsiteJobs}: {remoteVsOnsiteJobs: Array<{total: number, remote: number, nonRemote: number}>}) {

    // const totalJobs = remoteVsOnsiteJobs[0].total;
    const remote = remoteVsOnsiteJobs[0].remote;
    const onsite = remoteVsOnsiteJobs[0].nonRemote;

    return (
        <div className="flex flex-col items-center justify-center">
            {/* <p>Remote Jobs: {remotePercentage}%</p> */}
            {/* <p>Onsite Jobs: {onsitePercentage}%</p> */}
            <RemoteVsNonRemotePie data={{ remote: remote, nonRemote: onsite }} />
        </div>
    )
}