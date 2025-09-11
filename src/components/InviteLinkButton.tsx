"use client"

import { useState } from "react"
import { useSupabaseClient } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"
import { InviteLinkButtonProps } from "@/types/supabase"
import { toast } from "sonner"


export default function InviteLinkButton({groupId} :InviteLinkButtonProps ){
    const supabase = useSupabaseClient()
    const [loading, setLoading] = useState(false)

    const handleGenerateLink = async () => {
        try{
            setLoading(true)

            const { data, error} = await supabase
              .from("group_invites")
              .insert ({
                group_id: groupId,
                token: crypto.randomUUID(),
                expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000) // 1 day
              })
              .select()
              .single()
            
            if(error) throw error

            const inviteLink = `${window.location.origin}/groups/join?token=${data.token}`
            
            await navigator.clipboard.writeText(inviteLink)

            toast.success("Invite link copied to clipboard!")
        }   catch (err : any) {
            console.error("Error generating invite:", err.message);
            toast.error("Failed to generate invite link");
        }   finally {
            setLoading(false)
        }
    }

    return (
        <Button 
            onClick={handleGenerateLink}
            disabled={loading}
            variant="secondary"
            className="rounded 2xl"
        >
            {loading ?  "Genarating ..." : "Generate New Link"}
        </Button>
    )
}