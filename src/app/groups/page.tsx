'use client'

import { useEffect, useState } from "react"
import { useSupabaseClient,useUser } from "@supabase/auth-helpers-react"
import Link from "next/link"

export default function GroupsPage(){
    const supabase = useSupabaseClient()
    const user = useUser()
    const [groups, setGroups] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if(!user) return
        fetchGroups()
    }, [user])

    async function fetchGroups() {
        setLoading(true)
        const { data, error } = await supabase
          .from("group_members")
          .select("groups(id,name)")
          .eq("user_id",user?.id)
        console.log("gorup", data)
          if (error){
            console.error(error)
          } else {
            setGroups(data.map((g: any) => g.groups))
          }
        setLoading(false)
    }

    if (!user) return <p>Please log in</p>

    return (
      <div className="p-6">
        <h1 className="text-xl font-bold mb-4">Your Groups</h1>
        
        {loading && <p>Loading...</p>}

        {!loading && groups.length === 0 && (
        <p>You are not in any groups yet.</p>
        )}

        <ul className="space-y-2">
        {groups.map((group) => (
          <li key={group.id} className="p-2 border rounded">
            <Link href={`/groups/${group.id}`}>
              {group.name}
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/groups/new"
        className="inline-block mt-4 bg-blue-500 text-white px-4 py-2 rounded"
      >
        Create New Group
      </Link>

      </div>
    )
}
