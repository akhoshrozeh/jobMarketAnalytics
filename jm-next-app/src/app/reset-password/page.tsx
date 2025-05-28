"use client"
import { resetPassword, confirmResetPassword } from "aws-amplify/auth"
import { useState } from "react"
import config from "../../amplify_config"
import { Amplify } from "aws-amplify"
import Image from 'next/image'
import LoadingSpinner from "../components/LoadingSpinner"

Amplify.configure(config as any, {ssr: true});

export default function ResetPassword() {

    const [step, setStep] = useState<"ENTER_EMAIL" | "CONFIRM_RESET_PASSWORD_WITH_CODE" | "DONE">("ENTER_EMAIL");
    const [email, setEmail] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            const form = event.currentTarget;
            setIsLoading(true);
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            setEmail(email);
            const { nextStep } = await resetPassword({ username: email });
            console.log("next step reset password:", nextStep);
    
            switch (nextStep.resetPasswordStep) {
    
                case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
                    const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                    setStep("CONFIRM_RESET_PASSWORD_WITH_CODE");
                    break;
                
                case 'DONE':
                    setStep("DONE");
                    alert('Successfully reset password.');
                    break;
              }
        } catch (error) {
            console.log(`Error: failed to reset password`, error)
            if (error instanceof Error) {
                if (error.message === "Username/client id combination not found.") {
                    setErrorMessage("Email not found. Please try again.");
                }
            }
        } finally {
            setIsLoading(false);
        }
    }

    async function handleConfirmResetPassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        try {
            const form = event.currentTarget;
            const confirmationCode = (form.elements.namedItem('confirmationCode') as HTMLInputElement).value;
            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
            const newPasswordConfirmation = (form.elements.namedItem('newPasswordConfirmation') as HTMLInputElement).value;
            if (newPassword !== newPasswordConfirmation) {
                setErrorMessage("Passwords do not match. Please try again.");
                return;
            }
            await confirmResetPassword({ username: email, confirmationCode: confirmationCode, newPassword: newPassword });
            setStep("DONE")
        } catch (error) {
            console.log(`Error: failed to confirm password reset`, error)
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div>    
        
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-black">Reset Password</h2>
            </div>
    
            { step === "ENTER_EMAIL" && (
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
                    <form onSubmit={handleResetPassword} className="space-y-6 text-center">
                        <div>
                            <label htmlFor="email" className="block text-md font-medium text-black">
                                Please enter your email address. 
                            </label>
                            <label htmlFor="email" className="block text-md font-medium text-black mt-2">
                                A confirmation code will be sent for verification.
                            </label>
                            <label className="text-red-500 mt-4">
                                {errorMessage}
                            </label>
                            <div className="mt-4">
                                <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="Your Email"
                                autoComplete="email"
                                className="block w-full rounded-md px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-md/6 font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                            >
                                { isLoading ? <LoadingSpinner/> : <>Send Code</>}
                            </button>
                        </div>
                    </form> 
                </div>
            )}

            { step === "CONFIRM_RESET_PASSWORD_WITH_CODE" && (
                <div className="mt-10 sm:mx-auto sm:max-w-full xs:max-w-xs">
                   <form onSubmit={handleConfirmResetPassword} className="space-y-6">
                        <div className="border-b border-gray-400 mb-12 pb-8">
                            <label htmlFor="confirmationCode" className="block text-md font-medium text-black mb-4">
                                Please enter your confirmation code from <u>{email}</u>
                            </label>
                            <div className="mt-2">
                                <input
                                id="confirmationCode"
                                name="confirmationCode"
                                required
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                                />
                                
                            </div>
                        </div>
                        <div className="text-red-500">
                            {errorMessage}
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-md font-medium text-black">
                                New password:
                            </label>    
                            <div className="mt-2">
                                <input
                                    id="newPassword"
                                    name="newPassword"
                                    type="password"
                                    required
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                                    />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="newPasswordConfirmation" className="block text-md font-medium text-black">
                                Confirm new password:
                            </label>    
                            <div className="mt-2">
                                <input
                                    id="newPasswordConfirmation"
                                    name="newPasswordConfirmation"
                                    type="password"
                                    required
                                    className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                                    />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-md/6 font-semibold text-white shadow-sm hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                            >
                                { isLoading ? <LoadingSpinner/> : <>Confirm</>}
                            </button>
                        </div>
                    </form> 
                </div>
            )}

            { step === "DONE" && (
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-lg">
                    <div className="flex items-center justify-center text-black text-center text-md font-medium">
                        Your password has successfully been reset! You can now login.
                    </div>
                </div>
            )}
        </div>
        </div>
    )
}