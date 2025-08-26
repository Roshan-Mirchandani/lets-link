'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseClient,  useUser } from "@supabase/auth-helpers-react"
import ProfileCard from "@/components/ProfileCard"

export default function ProfilePage(){
  const supabase = useSupabaseClient()
  const user = useUser()
  const router = useRouter()

  const [profile, setProfile] = useState<any>(null)
  const [loading,setLoading] = useState(true)

  useEffect(()=> {
    if(user) fetchProfile()
  },[user])

  async function fetchProfile() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('first_name, surname, email, avatar_url')
      .eq('id', user?.id)
      .single()

    if (error) console.error(error)
    else setProfile(data)    

    setLoading(false)

  } 

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
}


  if (loading) return <p>Loading...(loading)</p>
  if (!profile) return <p>Loading ...</p>

  return (
    <div className="max-w-md mx-auto mt-20 space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      <ProfileCard
        firstName={profile.first_name}
        surname={profile.surname}
        email={user?.email || ''}
        avatarUrl={profile.avatar_url}
      />

      <button
        onClick={() => router.push('/profile/edit')}
        className="w-full bg-blue-600 text-white py-2 rounded"
      >
        Edit Profile
      </button>

      <button
        className=" w-full bg-red-600 text-white py-2 px-4 rounded"
        onClick={handleSignOut}
      >
        Sign Out
      </button>
    </div>
  )
    
}