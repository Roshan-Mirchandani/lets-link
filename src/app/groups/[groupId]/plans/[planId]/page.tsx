'use client'

import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { 
    Card,
    CardContent, 
    CardHeader, 
    CardTitle, 
    CardDescription, 
    CardFooter 
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import AvailabilityModal from "@/components/AddAvailabilityModal"
import AvailabilityChart from "@/components/AvailabilityChart"
import { Plan, Availability, Member } from "@/types/supabase"

export default function PlanPage(){
    const supabase = useSupabaseClient()
    const user = useUser()
    const router = useRouter()
    const params = useParams()
    const planId = params.planId as string
    const groupId = params.groupId as string

    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    const [members,setMembers] = useState<Member[]>([])
    const [memberAvailabilities, setMemberAvailabilities] = useState<any[]>([])
    const [userAvailability, setUserAvailability] = useState<Availability| null>(null)
    const [plan, setPlan] = useState<Plan | null>(null)
    const [modalOpen, setModalOpen] = useState(false)
    const [interval, setInterval] = useState(3)


    useEffect(()=> {
        if(!planId) return

        async function fetchPlanData() {
            try{
                setLoading(true)

                // 1. Fetch plan data
                const { data: planData, error: planError } = await supabase
                .from("plans")
                .select("id, name, description, start_date, end_date")
                .eq("id", planId)
                .eq("group_id",groupId)
                .single()
                
                if (planError) throw planError
                setPlan(planData)

                // 2. Fetch Availability data
                const {data: availabilityData, error: availabilityError} = await supabase
                  .from("plan_availability")
                  .select("id, user_id, day, start_time, end_time")
                  .eq("plan_id", planId)

                  if (availabilityError) throw availabilityError
                  setMemberAvailabilities(availabilityData || [])
                  console.log("huh",availabilityData, memberAvailabilities)

                  // 3. Fetch Members 
                  const { data : member_profiles, error : memberError} = await supabase
                .from('group_members_with_profiles')
                .select('user_id, role, first_name, surname, avatar_url')
                .eq('group_id', groupId) // Use group data to filter through view

                if (memberError) throw memberError
                setMembers(member_profiles)

            } catch(err: any) {
                console.error(err)
                setError(err)

            } finally {
                setLoading(false)
            }
        }

        fetchPlanData()
    },[planId, supabase])

    const getLabel = (val: number) => {
      if (val === 24) return "1 day"
      return `${val}h`
    }

    if (loading) return <p>Loading plan...</p>
    if (error) return <p className="text-red-500">{error}</p>
    if (!plan) return <p>Plan not found</p>

      return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{plan.name}</CardTitle>
          <CardDescription>
            {new Date(plan.start_date).toLocaleDateString()} – {new Date(plan.end_date).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>{plan.description || "No description available."}</p>
          <AvailabilityChart
            availabilities={memberAvailabilities}
            interval={interval}
            planDetails={plan}
            members = {members}
          />
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => setModalOpen(true) }
          >
            Add / Edit My Availability
          </Button>
        <AvailabilityModal
          open={modalOpen}
          onOpenChange={setModalOpen}
          planData={plan}
        />
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Interval: {getLabel(interval)}</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-40" align="start">
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(1)}>1h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(2)}>2h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(3)}>3h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(4)}>4h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(6)}>6h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(12)}>12h</DropdownMenuItem>
          <DropdownMenuItem className="py-2 text-sm" onClick={() => setInterval(24)}>1 day</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

        </CardFooter>
      </Card>
    </div>
  )
}