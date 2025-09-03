'use client'

import { useState, useEffect } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useRouter, useSearchParams } from "next/navigation"

export default function NewPlan() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const params = useSearchParams()
    const groupId = params.groupId as string

    const [loading,setLoading] = useState(false)
    
    const [groupName, setGroupName] = useState('')
    const [groupDescription, setGroupDescription] = useState('')
    const [startDate, setStartDate] = useState()
    const [endDate, setEndDate] = useState()
    const [error, setError] = useState<string | null>(null)


    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if(!user) {
            setError("You must be logged in to create a plan")
            return
        }
        if(!groupName || !startDate || !endDate){
            setError("Fill in the required fields")
            return
        }

        setLoading(true)
        setError(null)

        const { error: insertError } = await supabase
          .from("plans")
          .insert({
            // group_id : groupId


          })
    }

    
}