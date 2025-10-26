'use client'

import { useState, useEffect } from 'react'
import { useSupabaseClient, useUser  } from '@supabase/auth-helpers-react'
import { useRouter, useSearchParams } from 'next/navigation' 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from '@/components/ui/button'
import ProfileCard from '@/components/ProfileCard'
import { PresetTimings } from '@/types/supabase'
import NewCustomPreset from '@/components/NewCustomPresetModal'
import EditCustomPresetModal from '@/components/EditCustomPresetModal'

export default function EditProfilePage() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()
    const params = useSearchParams()
    const nextUrl = params.get("next") || "/profile"

    const [firstName, setFirstName] = useState('')
    const [surname, setSurname] = useState('')
    const [email, setEmail] = useState('')
    const [avatarUrl, setAvatarUrl] = useState('')

    const [defaultInterval, setDefaultInterval] = useState('')
    const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h')

    const [customPresets, setCustomPresets] = useState<PresetTimings[]>([])
    const [selectedPreset, setSelectedPreset] = useState<PresetTimings>()
    const [openNewCustomPresetModal, setOpenNewCustomPresetModal] = useState(false)
    const [openEditCustomPresetModal, setOpenEditCustomPresetModal] = useState(false)

    const[loading, setLoading] = useState(true)
    const[error, setError] = useState<string|null>(null)

    // Fetch profile on mount
    useEffect(() =>{
        if (user) {
          fetchProfile()
          fetchCustomPresets()
        }
    },[user,openNewCustomPresetModal])
    
    async function fetchProfile() {
      setLoading(true) 
      const { data, error } = await supabase
       .from('profiles')
       .select('first_name, surname,email, avatar_url, default_interval, time_format')
       .eq('id',user?.id)
       .single()

     if (error) {
        setError(error.message)

    } else if (data) {
            setFirstName(data.first_name || '')
            setSurname(data.surname || '')
            setAvatarUrl(data.avatar_url || '')
            setEmail(data.email || '')
            setTimeFormat(data.time_format || '')
            setDefaultInterval(data.default_interval || '')
        }
        setLoading(false)
    }

    async function fetchCustomPresets() {
      setLoading(true)
      const {data, error} = await supabase
       .from('availability_presets')
       .select("id, label, start_time, end_time")
       .eq("user_id", user?.id)

       if (error) return

      setCustomPresets(data.map(p=>({
        id: p.id,
        label: p.label,
        start: p.start_time,
        end: p.end_time
      })))

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
            updated_at : new Date(),
            time_format: timeFormat,
            default_interval: defaultInterval
        })

      if (error){ 
        setError(error.message)
        setError('Failed to update profile')
        console.log("profile update error", error)
      } else {
        console.log("edit page", nextUrl)
        router.push(nextUrl)
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
      // console.log("testing", selectedPreset)
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
        <p>Name</p>
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

        <p>Profile Picture</p>

        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarUpload}
          className="block"
        />

        <p>Preferences</p>
        <p>Time Format</p>
        <Select 
          value={timeFormat} 
          onValueChange={(value) => setTimeFormat(value as "12h" | "24h")}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder= "Select Time Format"/>
          </SelectTrigger>
           <SelectContent>
            <SelectItem value="24h">24h</SelectItem>
            <SelectItem value="12h">12h</SelectItem>
          </SelectContent>
        </Select>
        
        <p>Default Time Interval</p>
        <Select
          value = {String(defaultInterval)} // supabase saves as an int, this is so the value boolean works
          onValueChange={setDefaultInterval}
        >
          <SelectTrigger className='w-full'>
            <SelectValue placeholder = "Select Default Interval"/>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value = "24">1 day</SelectItem>
            <SelectItem value = "12">12h</SelectItem>
            <SelectItem value = "6">6h</SelectItem>
            <SelectItem value = "4">4h</SelectItem>
            <SelectItem value = "3">3h</SelectItem>
            <SelectItem value = "2">2h</SelectItem>
            <SelectItem value = "1">1h</SelectItem>
          </SelectContent>
        </Select>

        <p>Preset Managements</p>
        <Button
          // variant="outline" 
          onClick={() => setOpenNewCustomPresetModal(true)}
        > + </Button>


        <NewCustomPreset 
        open = {openNewCustomPresetModal}
        onOpenChange={setOpenNewCustomPresetModal}
        />

      { selectedPreset &&
        <EditCustomPresetModal 
          selectedCustomPreset={selectedPreset}
          allCustomPresets={customPresets}
          open = {openEditCustomPresetModal}
          onOpenChange={setOpenEditCustomPresetModal}
        />}
        
        {customPresets.length > 0 && (
          <>
            <p className="font-medium mt-4">My Presets</p>
            <div className="space-y-2">
              {customPresets.map((preset) => {
                // const isSelected = selectedPresets.some(p => p.label === preset.label)
                return (
                <Button
                  key={preset.label}
                  // variant={isSelected ? "outline" : "default"}
                  // className={`w-full ${selectedPresets.some(p => p.label === preset.label) ? "bg-blue-100" : ""}`}
                  onClick={()=>  {
                    setSelectedPreset(preset)
                    setOpenEditCustomPresetModal(true)
                  }}
                >
                    <span>
                    {preset.label} ({preset.start}-{preset.end})
                  </span>
                </Button>
              )})
            }
            </div>
          </>
        )}
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
