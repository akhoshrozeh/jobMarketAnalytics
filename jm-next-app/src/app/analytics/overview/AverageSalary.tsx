export default async function AverageSalary({avgMinSalary, avgMaxSalary}: {avgMinSalary: number, avgMaxSalary: number}) {
    // Format as USD with no decimal places
    const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
    
    const minSalary = formatter.format(avgMinSalary);
    const maxSalary = formatter.format(avgMaxSalary);

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