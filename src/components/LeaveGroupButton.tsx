"use client"

import { useRouter } from "next/navigation"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"

export default function LeaveGroupButton({groupId} : {groupId : string}) {
    const supabase = useSupabaseClient();
    const user = useUser();
    const router = useRouter();

    const handelLeave = async () => {
        if(!user) return;

        const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", groupId)
        .eq("user_id", user.id);

        if (error) {
            console.error("Error leaving group:" , error.message);
        }

        router.push("/groups")
        router.refresh()
    };

    return ( 
        <Button 
            variant="destructive"
            className="mt-6 rounder-2x1 shadow-md"
            onClick={handelLeave}
        >
            Leave Group
        </Button>
    );
}
