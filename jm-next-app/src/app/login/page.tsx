"use client"

import Link from "next/link";
import { Amplify } from "aws-amplify";
import config from "../../amplify_config";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import LoadingSpinner from "../components/LoadingSpinner";


Amplify.configure(config as any, {ssr: true});

export default function Login() {

    const [errorMessage, setErrorMessage] = useState<string>("");
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const router = useRouter()

    async function handleOnSubmit(event: React.FormEvent<HTMLFormElement>) {   
        event.preventDefault()
        console.log("signin clicked")
        setErrorMessage("")
        setIsLoading(true);
        const form = event.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        
        try {
            const { nextStep } = await signIn({
                username: email,
                password: password
            })
            console.log("res from sign on:", nextStep)
            switch (nextStep.signInStep) {
                case "CONFIRM_SIGN_UP":
                    router.push('/sign-up?needsConfirmation=true&email=' + encodeURIComponent(email));
                    break;
                case "DONE":
                    window.location.href = '/analytics/overview'
                    break;
                default:
                    setErrorMessage("An error occurred in sign in.")
                    break;
            }
            

        }

        catch (error) {
            console.log("ERR:", error)
            if (error instanceof Error) {
                switch (error.message) {
                    case "User does not exist.":
                        setErrorMessage("User not found. Please try a different email or sign up.")
                        break;
                    case "Incorrect username or password.":
                        setErrorMessage("Incorrect username or password. Please try again.")
                        break;
                    default:
                        setErrorMessage("An error occurred in sign in.")
                        break;
                }
            }
        }
        finally {
            setIsLoading(false);
        }


    }

    return (
      <div>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">

          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            {/* <img
              alt="Your Company"
              src="https://tailwindui.com/plus/img/logos/mark.svg?color=emerald&shade=500"
              className="mx-auto h-10 w-auto"
            /> */}
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-black">Sign in to your account</h2>
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
            <div className="text-md text-red-500 mb-4">{errorMessage}</div>
            <form onSubmit={handleOnSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-md/6 font-medium text-black">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-black/50 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                  />
                </div>
              </div>
  
              <div>
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="block text-md/6 font-medium text-black">
                    Password
                  </label>
                  <div className="text-md">
                    <Link href="/reset-password" className="font-semibold text-emerald-600 hover:text-emerald-500/70">
                      Forgot password?
                    </Link>
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    autoComplete="current-password"
                    className="block w-full rounded-md bg-white/5 px-3 py-1.5 text-base text-black outline outline-1 -outline-offset-1 outline-black/50 placeholder:text-gray-500 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-emerald-500 sm:text-md/6"
                  />
                </div>
              </div>
  
              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-emerald-500 px-3 py-1.5 text-md/6 font-semibold text-black shadow-sm hover:bg-emerald-500/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
                >

                    { isLoading ? <LoadingSpinner/> : <>Login</>

                    }
                </button>
              </div>
            </form>
  
            <p className="mt-10 text-center text-md/6 text-gray-800">
              Not a member?{' '}
              <Link href="/sign-up" className="font-semibold text-emerald-500 hover:text-emerald-500/70">
                <u>Sign up here!</u>
              </Link>

            </p>
          </div>
        </div>
      </div>
    )
  }
  