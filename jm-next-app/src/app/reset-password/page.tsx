"use client"
import { resetPassword, confirmResetPassword } from "aws-amplify/auth"
import { useState } from "react"
import config from "../../amplify_config"
import { Amplify } from "aws-amplify"
Amplify.configure(config as any, {ssr: true});

export default function ResetPassword() {

    const [step, setStep] = useState<"ENTER_EMAIL" | "CONFIRM_RESET_PASSWORD_WITH_CODE" | "DONE">("ENTER_EMAIL");
    const [email, setEmail] = useState<string>("");
    const [errorMessage, setErrorMessage] = useState<string>("");

    async function handleResetPassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        try {
            const form = event.currentTarget;
            const email = (form.elements.namedItem('email') as HTMLInputElement).value;
            setEmail(email);
            const { nextStep } = await resetPassword({ username: email });
            console.log("next step reset password:", nextStep);
    
            switch (nextStep.resetPasswordStep) {
    
                case 'CONFIRM_RESET_PASSWORD_WITH_CODE':
                    const codeDeliveryDetails = nextStep.codeDeliveryDetails;
                    setStep("CONFIRM_RESET_PASSWORD_WITH_CODE");
                    alert(
                        `Confirmation code was sent to ${codeDeliveryDetails.deliveryMedium}`
    
                    );
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
        }
    }

    async function handleConfirmResetPassword(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        try {
            const form = event.currentTarget;
            const confirmationCode = (form.elements.namedItem('confirmationCode') as HTMLInputElement).value;
            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
            await confirmResetPassword({ username: email, confirmationCode: confirmationCode, newPassword: newPassword });
            setStep("DONE")
        } catch (error) {
            console.log(`Error: failed to confirm password reset`, error)
        }
    }

    return (
        <div>    
        
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            <img
                alt="Your Company"
                src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
                className="mx-auto h-10 w-auto"
            />
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Reset Password</h2>
            </div>
    
            { step === "ENTER_EMAIL" && (
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <form onSubmit={handleResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-md font-medium text-white">
                                Please enter your email address. A confirmation code will be sent to it for verification.
                            </label>
                            <label className="text-red-500 text-sm">
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
                                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                Send Code
                            </button>
                        </div>
                    </form> 
                </div>
            )}

            { step === "CONFIRM_RESET_PASSWORD_WITH_CODE" && (
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                   <form onSubmit={handleConfirmResetPassword} className="space-y-6">
                        <div>
                            <label htmlFor="email" className="block text-md font-medium text-white">
                                Please enter your confirmation code from {email}
                            </label>
                            <div className="mt-2">
                                <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                                />
                            </div>
                        </div>
                        <div>
                            <button
                                type="submit"
                                className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                            >
                                Confirm
                            </button>
                        </div>
                    </form> 
                </div>
            )}

            { step === "DONE" && (
                <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                    <div className="flex items-center justify-center text-white text-center text-md font-medium">
                        Your password has successfully been reset!
                    </div>
                </div>
            )}
        </div>
        </div>
    )
}