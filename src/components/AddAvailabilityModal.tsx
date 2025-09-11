'use client'

import { useState, useEffect } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Availability,AvailabilityModalProps } from "@/types/supabase"
import { toast } from "sonner"

export default function AvailabilityModal({ 
    open,
    onOpenChange,
    planId,
    existingAvailability,
    startDate,
    endDate
}: AvailabilityModalProps) { 
    const supabase = useSupabaseClient()
    const user = useUser()

    const [day, setDay] = useState('')
    const [startTime, setStartTime ] = useState('')
    const [endTime, setEndTime] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(()=> {
        if(existingAvailability){
            setDay(existingAvailability.day)
            setStartTime(existingAvailability.start_time)
            setEndTime(existingAvailability.end_time)
        } else{
            setDay('')
            setStartTime('')
            setEndTime('')
        }
    },[existingAvailability, open])

    const handleSave = async () => {
        if(!user) {
            setError("You must be logged in to submit availability")
            return
        }
        if (!day || !startTime || ! endTime) {
            setError("Please fill in all fields")
            return  
        }

        const planStart = new Date(startDate)
        const planEnd = new Date(endDate)   
        let selectedDay = new Date(day)

        if (selectedDay < planStart || selectedDay > planEnd) {
          toast.error(`Pick a day between ${planStart.toDateString()} - ${planEnd.toDateString()}`)
          return
        }

        if (startTime >= endTime) {
          toast.error("Start time must be before end time")
          return
        }

        setLoading(true)
        setError(null)

        try {
            if (existingAvailability?.id){
                // Edit mode: update
                const {error : updateError} = await supabase
                  .from("plan_availability")
                  .update({
                    day: day,
                    start_time: startTime,
                    end_time: endTime,
                    updated_at: new Date()
                  })
                  .eq("id",existingAvailability.id)

                  if (updateError) throw updateError
            } else {
                // Add mode: insert
                const { error: insertError } = await supabase
                  .from("plan_availability")
                  .insert({
                    plan_id: planId,
                    user_id: user.id,
                    day: day,
                    start_time: startTime,
                    end_time: endTime,
                    created_at: new Date(),
                    updated_at: new Date()
                  })
                
                if (insertError) throw insertError
            }

            onOpenChange(false)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to save availability")
        } finally {
            setLoading(false)
        }
    }

         return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingAvailability ? "Edit Availability" : "Add Availability"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <label className="block">
            Day
            <input
              type="date"
              className="w-full border rounded p-2 mt-1"
              value={day}
              onChange={(e) => setDay(e.target.value)}
            />
          </label>

          <label className="block">
            Start Time
            <input
              type="time"
              className="w-full border rounded p-2 mt-1"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </label>

          <label className="block">
            End Time
            <input
              type="time"
              className="w-full border rounded p-2 mt-1"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </label>

          {error && <p className="text-red-600">{error}</p>}
        </div>

        <DialogFooter className="mt-4 flex justify-end space-x-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
    
}