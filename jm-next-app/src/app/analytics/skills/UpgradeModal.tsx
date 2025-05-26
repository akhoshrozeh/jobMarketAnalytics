"use client"
import { useSkill } from "./SkillContext";
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import Link from 'next/link';

export default function UpgradeModal() {
    const { showUpgradeModal, setShowUpgradeModal } = useSkill();

    if (!showUpgradeModal) return null;

    return (
        <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} className="relative z-50">
            <DialogBackdrop className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-md rounded-xl bg-black p-6 border-2 border-emc">
                    <h3 className="text-lg font-semibold text-white">Upgrade Required</h3>
                    <p className="mt-4 text-gray-300">
                        You need to upgrade your plan to access detailed skill analytics.
                    </p>
                    <div className="mt-6 flex justify-end gap-4">
                        <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="px-4 py-2 text-gray-400 hover:text-white"
                        >
                            Cancel
                        </button>
                        <Link
                            href="/pricing"
                            onClick={() => setShowUpgradeModal(false)}
                            className="px-4 py-2 bg-emc text-black rounded-md hover:bg-emerald-400"
                        >
                            Upgrade Plan
                        </Link>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
} 