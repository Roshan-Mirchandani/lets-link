'use client'

import { useState, useEffect } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export default function NewPlan() {
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()
    const params = useParams()
    const groupId = params.groupId as string

    const [loading,setLoading] = useState(false)
    
    const [groupName, setGroupName] = useState('')
    const [groupDescription, setGroupDescription] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
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
            group_id : groupId,
            name: groupName,
            description: groupDescription,
            start_date : startDate,
            end_date : endDate,
            created_by : user.id
          })

        if(insertError) {
            console.error(insertError)
            setError("Failed to create a plan")
        } else {
            router.push(`/groups/${groupId}/plans`)
        } 
        setLoading(false)
    }
    return (
        <div className="max-w-lg mx-auto mt-10 space-y-6">
          <h1 className="text-2xl font-bold">Create New Plan</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
            <Label htmlFor="title">Name</Label>
            <Input
                id="title"
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                required
            />
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={groupDescription}
                    onChange={(e) => setGroupDescription(e.target.value)}
                />
            </div>

            <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                />
            </div>

            <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                    id="endDate"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                />
            </div>

            {error && <p className="text-red-600">{error}</p>}

            <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating..." : "Create Plan"}
            </Button>
          </form>
        </div>
  )
    
}