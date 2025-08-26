'use client'

import { useEffect, useState } from "react"
import { useSupabaseClient,useUser } from "@supabase/auth-helpers-react"
import { useRouter } from "next/navigation"

export default function NewGroup(){
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()

    const [groupName, setGroupName] = useState("")
    const [loading,setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    if (!user) return <p>Please log in to create a group</p>

    async function handleCreateGroup(e: React.FormEvent){
        e.preventDefault()
        setLoading(true)
        setError(null)

        try{
            // Insert into group table
            const {data : group, error : groupError } = await supabase
              .from("groups")
              .insert([
                  {
                  name: groupName,
                  owner : user?.id
                  }
              ])
              .select()
              .single()

            if (groupError) throw groupError

            // Insert into member table
            const {error : memberError} = await supabase
              .from("group_members")
              .insert([
                {
                    group_id : group.id,
                    user_id : user?.id,
                    role : "member",
                }
              ])

            if (memberError) throw memberError

            // Redirect to new group
            router.push(`/groups/${group.id}`)

        } catch(err: any) {
            console.error(err)
            setError(err.message || "Failed to create group")

        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-bold mb-4">Create a New Group</h1>

      <form onSubmit={handleCreateGroup} className="space-y-4">
        <input
          type="text"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          placeholder="Group name"
          required
          className="w-full border rounded p-2"
        />

        {error && <p className="text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Group"}
        </button>
      </form>
    </div>
    )
}