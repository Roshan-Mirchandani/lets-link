'use client'

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useSupabaseClient, useUser, useSession } from "@supabase/auth-helpers-react"
import Link from "next/link"

export default function JoinGroupPage() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const session = useSession()
    const router = useRouter()
    const params = useSearchParams()
    const token = params.get("token")

    const [status, setStatus] = useState<string>("Verifying invite...")
    const [loading, setLoading] = useState(true)

    // const joiningRef = useRef(false)

    const joinUrl = `/groups/join?token=${encodeURIComponent(token || "")}`;

    useEffect(() => {
        if(!token){
            setStatus("Invalid invite Link")
            setLoading(false)
            return
        }

        // if (joiningRef.current) return
        // joiningRef.current = true;

        if (user === undefined) return

        (async () => {
            try {
                // 1. If user not logged in, ask to log in/ sign up
                if (!user) {
                    setStatus("You need to log in or sign up to join this group")
                    setLoading(false)
                    console.log("not logged in", user)
                    return
                }

                // 2. Fetch invite
                const { data: invite, error: inviteError} = await supabase
                  .from("group_invites")
                  .select("*")
                  .eq("token",token)
                  .single()

                if (inviteError || !invite) throw new Error("Invalid or expired invite")
                if (new Date(invite.expires_at) < new Date())
                    throw new Error("This invite has expired")
                
                // 3.If already a member of this group, directly open group
                const {data: existingMember } = await supabase
                      .from("group_members")
                      .select("id")
                      .eq("group_id", invite.group_id)
                      .eq("user_id",user.id)
                      .maybeSingle()

                if (existingMember) {
                    console.log("exists")
                    router.push(`/groups/${invite.group_id}`)
                    return
                }

                // 4. Check profile completeness before inserting membership
                const { data: profile } = await supabase
                  .from("profiles")
                  .select("first_name, surname")
                  .eq("id",user.id)
                  .maybeSingle()
                
                console.log("profile stat",profile)  

                const profileComplete = !!profile?.first_name && !!profile.surname
               
                if (!profileComplete) {
                    console.log("profile needs completion")
                    router.push(`/profile/edit?next=${encodeURIComponent(joinUrl)}`)
                    return
                }

                // 5. Indempotent insert (handles duplicates / StrictMode) 
                const { error : upsertError} = await supabase
                  .from("group_members")
                  .upsert(
                    { group_id: invite.group_id, user_id: user.id, role: "member" },
                    { onConflict: "group_id,user_id", ignoreDuplicates: true }
                  )

                if(upsertError) throw upsertError
                
                // 6. Open group page
                router.push(`/groups/${invite.group_id}`);
            }   catch ( err: any) {
                setStatus(err.message || "Failed to join group")
                // joiningRef.current = false
            }
        })()
    }, [token, user, supabase, router, joinUrl])

    // Loading / waiting for session
    if (user === undefined || loading) return <p className="p-6 text-center">Loading...</p>

    if (!user && status.includes("log in")) {    
        return(
            <div className="p-6 text-center space-y-4">
            <p>{status}</p>
            <Link
            href={`/login?next=${encodeURIComponent(joinUrl)}`}
            className="text-blue-600 underline"
            >
            Log in or Sign up
            </Link>
        </div>
        )
    }
    return <p className="p-6 text-center">{status}</p>;
}
    