import { getAverageSalary } from "@/lib/dataAcessLayer";

export default async function AverageSalary() {
    const averageSalary = await getAverageSalary();
    
    // Format as USD with no decimal places
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    const minSalary = formatter.format(averageSalary[0].avgMinSalary);
    const maxSalary = formatter.format(averageSalary[0].avgMaxSalary);

    return (
        <div className="flex flex-col items-center justify-center gap-x-4 font-bold">
            <div className="flex flex-row items-center justify-center gap-x-4 w-full">
                <div>🔺{maxSalary}</div>
            </div>
            <div className="flex flex-row items-center justify-center gap-x-4 w-full">
                <div>🔻{minSalary}</div>
            </div>
        </div>
    )
}