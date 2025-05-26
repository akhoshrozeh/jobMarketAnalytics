export default function Loading() {

    return (
        <div className="relative min-h-[60vh] w-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex flex-col items-center gap-6 text-center">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 bg-emerald-500 rounded-full animate-pulse"></div>
                        </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                        <h1 className="text-2xl font-semibold text-gray-800">
                            Loading Analytics 
                        </h1>
                        <p className="text-gray-500 text-sm">Preparing your insights</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


// Default values shown
