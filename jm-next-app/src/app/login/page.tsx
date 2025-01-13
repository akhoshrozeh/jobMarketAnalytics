"use client"

import Link from "next/link";
import { Amplify } from "aws-amplify";
import config from "../../amplify_config";
import { signIn } from "aws-amplify/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ErrorWarningModal from "../components/ErrorWarningModal";
import { useAuth } from "@/context/AuthProvider";
import { AuthProvider } from "@/context/AuthProvider";

Amplify.configure(config as any);

function Login() {

    const {setIsAuthenticated} = useAuth();
    const [modalIsOpen, setModalIsOpen] = useState(false)
    const [header, setHeader] = useState("")
    const [body, setBody] = useState("")
    const [buttonText, setButtonText] = useState("")
    const router = useRouter()

    async function handleOnSubmit(event: React.FormEvent<HTMLFormElement>) {   
        event.preventDefault()
        console.log("signin clicked")
        const form = event.currentTarget;
        const email = (form.elements.namedItem('email') as HTMLInputElement).value;
        const password = (form.elements.namedItem('password') as HTMLInputElement).value;
        
        try {
            const res = await signIn({
                username: email,
                password: password
            })
            console.log("res from sign on:", res)
            setIsAuthenticated(true);
            router.push("/")

        }

        catch (error) {
            console.log("ERR:", error)
            setModalIsOpen(true)
            setHeader("Sign In Error")
            setBody("Please check your email and password and try again.")
            setButtonText("OK")
        }


    }

    return (
      <div>
        <div className="flex min-h-full flex-1 flex-col justify-center px-6 py-12 lg:px-8">
            <ErrorWarningModal isOpen={modalIsOpen} onClose={() => setModalIsOpen(false)} header={header} body={body} buttonText={buttonText}/>
          <div className="sm:mx-auto sm:w-full sm:max-w-sm">
            {/* <img
              alt="Your Company"
              src="https://tailwindui.com/plus/img/logos/mark.svg?color=indigo&shade=500"
              className="mx-auto h-10 w-auto"
            /> */}
            <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-white">Sign in to your account</h2>
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
            <form onSubmit={handleOnSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm/6 font-medium text-white">
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
                  <label htmlFor="password" className="block text-sm/6 font-medium text-white">
                    Password
                  </label>
                  <div className="text-sm">
                    <a href="#" className="font-semibold text-indigo-400 hover:text-indigo-300">
                      Forgot password?
                    </a>
                  </div>
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
                  className="flex w-full justify-center rounded-md bg-indigo-500 px-3 py-1.5 text-sm/6 font-semibold text-white shadow-sm hover:bg-indigo-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                  Sign in
                </button>
              </div>
            </form>
  
            <p className="mt-10 text-center text-sm/6 text-gray-400">
              Not a member?{' '}
              <Link href="/sign-up" className="font-semibold text-indigo-400 hover:text-indigo-300">
                Sign up here!
              </Link>

            </p>
          </div>
        </div>
      </div>
    )
  }
  

  export default function LoginWrapped() {
    return (
      <AuthProvider>
        <Login />
      </AuthProvider>
    )
  }