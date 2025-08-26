'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useUser  } from '@supabase/auth-helpers-react'
import { useRouter} from 'next/navigation'
import ProfileCard from '@/components/ProfileCard'

export default function EditProfilePage() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()

    const [firstName, setFirstName] = useState('')
    const [surname, setSurname] = useState('')
    const [email, setEmail] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')
    const[loading, setLoading] = useState(true)
    const[error, setError] = useState<string|null>(null)

    // Fetch profile on mount
    useEffect(() =>{
        if (user) fetchProfile()

        },[user])
    
    async function fetchProfile() {
       setLoading(true) 
       const { data, error } = await supabase
       .from('profiles')
       .select('first_name, surname,email, avatar_url')
       .eq('id',user?.id)
       .single()

     if (error) {
        setError(error.message)

    } else if (data) {
            setFirstName(data.first_name || '')
            setSurname(data.surname || '')
            setAvatarUrl(data.avatar_url || '')
            setEmail(data.email || '')
        }
        setLoading(false)
    }
    
    // Handle save
    async function handleSave() {
      if(!user)return
        setLoading(true)
        setError(null)

        const {error} = await supabase
        .from('profiles')
        .upsert({
            id: user.id,
            first_name : firstName,
            surname : surname,
            email: email,
            avatar_url: avatarUrl,
            updated_at : new Date()
        })

    if (error){ 
      setError(error.message)
      setError('Failed to update profile')
      console.log("Failed to update pfp",error.message)
    } else {
      router.push('/profile')
    }
    setLoading(false)
  }

    // Handle avatar upload
    async function handleAvatarUpload (e : React.ChangeEvent<HTMLInputElement>){
      try {
        if(!user) return
        const file = e.target.files?.[0]
        if(!file) return

        // Create a file path inside a folder named after the user's UID
        const fileExt = file.name.split('.').pop()
        const filePath = `${user.id}/${Date.now()}.${fileExt}`
        
        // Upload to Supabase Storage
        const {error : uploadError} = await supabase.storage
          .from('avatars')
          .upload(filePath, file, {upsert : true})

        if (uploadError) throw uploadError

        // Get the public URL for the uploaded file
        const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)
        
        const publicUrl = publicUrlData.publicUrl;

        //  Update local state so UI shows new avatar immediately
        setAvatarUrl(publicUrl)
        setError(null);

      }
      catch(err){
        console.error(err)
        setError('Avatar upload Failed')
      }

    }

    if (loading && !firstName && !surname) return <p>Loading profile...</p>

    return(
        <div className="max-w-md mx-auto mt-20">
      <h1 className="text-2xl font-bold mb-6">Edit Profile</h1>

      {/* Show a preview card using ProfileCard */}
      <ProfileCard
        firstName={firstName}
        surname={surname}
        email={user?.email || ''}
        avatarUrl={avatarUrl || undefined}
      />

      <div className="mt-6 space-y-4">
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          type="text"
          placeholder="Surname"
          value={surname}
          onChange={(e) => setSurname(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="block"
        />

        {error && <p className="text-red-600">{error}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
    )
}
