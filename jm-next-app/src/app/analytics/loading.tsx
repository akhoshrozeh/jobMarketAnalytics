export default function Loading() {

    return (
        <div className="relative min-h-[60vh] w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-m-dark-green"></div>
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-800 animate-pulse">
                            Loading Analytics 
                        </h1>
                        <p className="text-gray-500 text-sm animate-pulse">Preparing your insights</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


// Default values shown
