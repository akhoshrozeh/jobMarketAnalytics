"use client"

import Link from "next/link";
import { signUp, confirmSignUp, autoSignIn } from "aws-amplify/auth";  
import { Amplify } from "aws-amplify";
import { useState, useEffect } from "react";
import config from "../../amplify_config";
import { useSearchParams } from "next/navigation";
import LoadingSpinner from "../components/LoadingSpinner"


Amplify.configure(config as any);

export default function SignUp() {

    const searchParams = useSearchParams();

    const [errorMessage, setErrorMessage] = useState("");

    const [waitingForConfirmation, setWaitingForConfirmation] = useState(false);
    const [email, setEmail] = useState("");
    const [confirmationCode, setConfirmationCode] = useState("");
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Check the query params as soon as the page loads
    useEffect(() => {
        const needsConfirmation = searchParams.get("needsConfirmation");
        const emailParam = searchParams.get("email");

        if (needsConfirmation === "true" && emailParam) {
            setEmail(emailParam);
            setWaitingForConfirmation(true);
        }
    }, [searchParams]);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true)
        const form = event.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        setEmail(email);

        try {
            // Sign up with amplify
            const { isSignUpComplete, userId, nextStep } = await signUp({
                username: email,
            password: password,
            options: {
              userAttributes: {
                email: email,
                "custom:tier": "free"
                
              },
              autoSignIn: true
            }
          });


          if (nextStep.signUpStep == "CONFIRM_SIGN_UP") {
            console.log("Confirm sign up");
            setWaitingForConfirmation(true);
            setErrorMessage("");
          }
          else if (nextStep.signUpStep == "DONE") {
            console.log("Done");
          }
          else if (nextStep.signUpStep == "COMPLETE_AUTO_SIGN_IN") {
            console.log("Complete auto sign in");
          }
          else {
            console.log("Error");
          }


        } catch (error) {
            if (error instanceof Error) {
                if (error.message.startsWith("Password did not conform with policy")) {
                    setErrorMessage(error.message.replace("Password did not conform with policy: ", ""));
                } else {
                    switch (error.message) {
                        case "User already exists":
                            setErrorMessage("Email already exists. Please try a different email or login.");
                            break;
                        default:
                            setErrorMessage("An error occurred in sign up.");
                            console.log("Error: ", error)
                            break;
                    }
                }
            }
            else {
                setErrorMessage("An error occurred in sign up. ")
                console.log("Error: ", error)
            }
        }
        finally {
            setIsLoading(false)
        }

    }

    // auto signs in after confirmation
    async function handleConfirmation(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        const form = event.currentTarget;
        const confirmationCode = (form.elements.namedItem('code') as HTMLInputElement).value;
        setConfirmationCode(confirmationCode);
         
        try {
            const { nextStep: confirmSignUpNextStep } = await confirmSignUp({
                username: String(email),
                confirmationCode: confirmationCode,
            });
    
            if (confirmSignUpNextStep.signUpStep === 'COMPLETE_AUTO_SIGN_IN') {
                // Call `autoSignIn` API to complete the flow
                const { nextStep } = await autoSignIn();
            
                if (nextStep.signInStep === 'DONE') {
                    window.location.href = '/'
                    
                }
                
            }
            else if (confirmSignUpNextStep.signUpStep === 'DONE') {
                window.location.href = '/login'
            }


        } catch (error) {
            if (error instanceof Error) {
                switch (error.message) {
                    case "Invalid verification code provided, please try again.":
                        setErrorMessage("Incorrect confirmation code. Please try again.")
                        break;
                    case "User cannot be confirmed. Current status is CONFIRMED":
                        setErrorMessage("User already confirmed. Please login.")
                        break;
                    default:
                        setErrorMessage("An error occurred in confirmation.")
                        console.log(error)
                        break;
                }
            }
           
        } finally {
            setIsLoading(false);
        }

    }


    return (
      <>
      
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">

          <div className="sm:mx-auto sm:w-full sm:max-w-sm md:max-w-md">
            {/* <img
              alt="Your Company"
              src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
              className="mx-auto h-10 w-auto"
            /> */}

            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Create an account</h2>
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm md:max-w-md">
                <div className="text-red-500 mb-4">
                    {errorMessage}
                </div>

            { waitingForConfirmation == false ? (            
                <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="email" className="block text-md/6 font-medium text-white">
                    Email address
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
                    <div className="flex items-center justify-between">
                    <label htmlFor="password" className="block text-md font-medium text-white">
                        Password
                    </label>
                    
                    </div>
                    <div className="mt-2">
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        autoComplete="current-password"
                        className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6"
                    />
                    </div>
                </div>
    
                <div>
                    <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-md font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                        { isLoading ? <LoadingSpinner/> : <>Sign Up</> }
                    </button>
                </div>
                </form>


            ) : (
              <div>
                Please check your email and enter the confirmation code.
                <form onSubmit={handleConfirmation} className="space-y-6">
                  <div>
                    <label htmlFor="code" className="block text-md mb-4 font-medium text-white">
                      {/* Confirmation Code */}
                    </label>
                    <input id="code" name="code" type="text" required autoComplete="confirmation-code" className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-white outline outline-1 -outline-offset-1 outline-white/10 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-500 sm:text-sm/6" />
                  </div>
                  <div>
                  <button
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-md font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                     { isLoading ? <LoadingSpinner/> : <>Confirm</> }
                    </button>
                  </div>
                </form>
              </div>
            )}
  
            <p className="mt-10 text-center text-md text-gray-400">
             Already have an account?{' '}
              <Link href="/login" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Login
              </Link>
            </p>
          </div>
        </div>
      </>
    )
  }
  