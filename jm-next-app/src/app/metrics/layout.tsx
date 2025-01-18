import { ReactNode } from "react";

export default function MetricsLayout({children}: {children: ReactNode}) {
    return (

            <div>
                <div className="flex justify-center text-center text-4xl font-bold mt-4">Metrics</div>
                {children}
            </div>

    );
}