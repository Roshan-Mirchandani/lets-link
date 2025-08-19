'use client'

import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const session = useSession()
  const router = useRouter()
  const supabase = useSupabaseClient()
  
  useEffect(()=> {
    if(!session) router.push('/login')
  }, [session, router])

const handleSignOut = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}

if (!session) return <div>Loading...</div>

 return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Welcome, {session.user.email}</h1>
      <button
        className="bg-red-600 text-white py-2 px-4 rounded"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    </div>
  )

}