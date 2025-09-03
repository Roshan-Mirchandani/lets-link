'use client'

import { useState, useEffect } from "react"
import { useSession, useSupabaseClient } from "@supabase/auth-helpers-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginPage() {
    const supabase = useSupabaseClient()
    const session = useSession()
    const router = useRouter()
    const params  = useSearchParams()

    const[email, setEmail] = useState('')
    const[password, setPassword] = useState('')
    const[loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const nextUrl = params.get("next") || "/profile"

    useEffect(() => {
        console.log("in login", nextUrl)
        if (session) router.push(nextUrl)
    }, [session, router, nextUrl])


    const handleSignUp = async () => {
        setLoading(true)
        setError(null)
        const {error} = await supabase.auth.signUp({ email, password})
        if (error) setError(error.message)
        else {
          alert('Check your email for the confirmation link!')
        }  
        setLoading(false)
      }
    const handleSignIn = async () => {
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) setError(error.message)
        setLoading(false)
    }
    const handleGoogleSignIn = async () => {
      await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + `/login?next=${encodeURIComponent(nextUrl)}`
        }  
      })
    }

return(
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h1 className="text-2xl mb-4 font-bold">Login or Sign Up</h1>
      <input
        className="w-full p-2 mb-3 border rounded"
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />
      <input
        className="w-full p-2 mb-3 border rounded"
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />
      {error && <p className="mb-3 text-red-600">{error}</p>}
      <button
        className="w-full bg-blue-600 text-white py-2 rounded mb-2"
        onClick={handleSignIn}
        disabled={loading}
      >
        Log In
      </button>
      <button
        className="w-full bg-green-600 text-white py-2 rounded mb-2"
        onClick={handleSignUp}
        disabled={loading}
      >
        Sign Up
      </button>
      <hr className="my-4" />
      <button
        className="w-full bg-red-600 text-white py-2 rounded"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Continue with Google
      </button>
    </div>
  )
}
