'use client'

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card"

export default function PlanPages(){
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()
    const params = useParams()  
    const groupId = params.groupId 

    const [plans, setPlans] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(()=>{
        if(!user || !groupId) return
        fetchPlans()
    },[user, groupId])

    async function fetchPlans() {
        setLoading(true)
        const {data, error} = await supabase
          .from("plans")
          .select("id, name, description, start_date, end_date")
          .eq("group_id",groupId)

          if(error) {
            console.error(error)
          } else {
            setPlans(data)
          }
        setLoading(false)
    }

    if (!user) return <p className="p-6 text-center">Please log in to see this group’s plans.</p>
    if (loading) return <p className="p-6 text-center">Loading plans...</p>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold mb-4">Group Plans</h1>

      {plans.length === 0 ? (
        <p className="text-gray-500">No plans created in this group yet.</p>
      ) : (
        plans.map((plan) => (
          <Card
            key={plan.id}
            className="hover:shadow-md transition cursor-pointer"
            onClick={() => router.push(`/groups/${groupId}/plans/${plan.id}`)}
          >
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <p className="text-sm text-gray-500">
                {new Date(plan.start_date).toLocaleDateString()} –{" "}
                {new Date(plan.end_date).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{plan.description || "No description"}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={(e) => {
                  e.stopPropagation()
                  router.push(`/groups/${groupId}/plans/${plan.id}`)
                }}
              >
                View Details
              </Button>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}