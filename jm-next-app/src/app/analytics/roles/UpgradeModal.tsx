"use client"
import { useRole } from "./RoleContext";

export default function UpgradeModal() {
    const { showUpgradeModal, setShowUpgradeModal } = useRole();

    if (!showUpgradeModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">Upgrade to Premium</h2>
                <p className="text-gray-600 mb-6">
                    Get unlimited access to detailed role analytics and personalized insights
                </p>
                <div className="space-y-4">
                    <button
                        onClick={() => setShowUpgradeModal(false)}
                        className="w-full py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={() => {
                            // Add upgrade logic here
                            setShowUpgradeModal(false);
                        }}
                        className="w-full py-2 px-4 bg-m-dark-green text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Upgrade Now
                    </button>
                </div>
            </div>
        </div>
    );
} 