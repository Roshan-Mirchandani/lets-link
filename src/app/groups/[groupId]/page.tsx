"use client"

import { useState, useEffect } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react" 
import { useParams } from "next/navigation"
import LeaveGroupButton from "@/components/LeaveGroupButton"
import InviteLinkButton from "@/components/InviteLinkButton"

type Group = {
  id: string
  name: string
  owner: string
}

type Member = {
  user_id: string
  role: string
  first_name : string
  surname : string
  avatar_url :string
}

export default function GroupChat(){
    const supabase = useSupabaseClient()
    const user = useUser()
    const params = useParams()
    const groupId = params.groupId

    const [group, setGroup] = useState<Group | null>(null)
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)


    useEffect(()=>{
        if(!groupId) return

        async function fetchGroupData () {
            try{
                setLoading(true)

                // Fetch group data

                const {data : groupData, error : groupError} = await supabase
                .from('groups')
                .select('*')
                .eq('id',groupId)
                .single()

                if (groupError) throw groupError
                setGroup(groupData)

                // Fetch members in the group
                const { data : member_profiles, error : memberError} = await supabase
                .from('group_members_with_profiles')
                .select('user_id, role, first_name, surname, avatar_url')
                .eq('group_id', groupId) // Use group data to filter through view

                if (memberError) throw memberError
                setMembers(member_profiles)

            } catch(err: any){
            console.error(err)
            setError(err.message || 'Failed to fetch group')

            } finally {
                setLoading(false)
            }
        }
        fetchGroupData()
    },[groupId,supabase])

    
    if (loading) return <p>Loading group...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!group) return <p>Group not found</p>


    return(
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">{group.name}</h1>

            <h2 className="text-lg font-semibold mb-2">Members</h2>
            <ul className="mb-4">
                {members.map(member => (
                <div key={member.user_id}>
                    <p>
                        <img
                        src={member.avatar_url || '/default-avatar.jpg'}
                        alt="avatar"
                        className="w-24 h-24 rounded-full mb-4"
                        />

                        {member.user_id !== user?.id 
                            ? `${member.first_name} ${member.surname}` 
                            : "You"}

                    </p>
                    <p>{ member.role === "admin" ? member.role : null }</p>
                </div>
))}
            </ul>

            {/* Placeholder for chat */}
            <div className="border rounded p-4">
                <p className="text-gray-500">Chat will go here...</p>
            </div>

            <LeaveGroupButton groupId={group.id} />
            <InviteLinkButton groupId={group.id} />
        </div>
    )
}