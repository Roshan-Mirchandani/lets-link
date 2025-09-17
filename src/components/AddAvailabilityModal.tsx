'use client'

import { useState, useEffect } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { AvailabilityModalProps, PresetTimings } from "@/types/supabase"
import { toast } from "sonner"
import { generalPresets } from "@/lib/availabilityPresets"
import { Check } from "lucide-react"
import NewCustomPreset from "./NewCustomPresetModal"

export default function AvailabilityModal({ 
    open,
    onOpenChange,
    planData,
    existingAvailability
}: AvailabilityModalProps) { 
    const supabase = useSupabaseClient()
    const user = useUser()
    
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')
    const [startTime, setStartTime ] = useState('')
    const [endTime, setEndTime] = useState('')


    const [page, setPage] = useState <1 | 2>(1)
    const [endDateSameAsStart, setEndDateSameAsStart] = useState<boolean>(false)
    const [mode, setMode] = useState<'custom' | 'preset'>('custom')
    const [selectedPresets, setSelectedPresets] = useState<PresetTimings[]>([])
    const [customPresets, setCustomPresets] = useState<PresetTimings[]>([])

    const [openCustomPresetModal, setOpenCustomPresetModal] = useState(false)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)


    function breakDownAvailability(startDate: string, endDate: string, startTime: string, endTime: string){
      const results: {day: string, start_time: string, end_time: string}[] = []
      const start = new Date(startDate)
      const end = new Date(endDate)

      let current = new Date(start)
      console.log("mod ation", mode)
      if (mode === 'custom') {
        while (current <= end){
          const dayStr = current.toISOString().split("T")[0]

          if (dayStr === startDate && dayStr === endDate){
            // Same day case
            results.push({day: dayStr, start_time: startTime, end_time: endTime})
          } // From now on, case goes over midnight
          else if (dayStr === startDate){
            results.push({day: dayStr, start_time: startTime, end_time: "23:59"})
          } // Last day reached
          else if (dayStr === endDate){
            results.push({day: dayStr, start_time: "00:00", end_time: endTime})
          } // Somewhere in between, where the whole day is considered
        else {
          results.push({day: dayStr, start_time: "00:00", end_time: "23:59"})
          }

          current.setDate(current.getDate() + 1) // Add one day
        }
        return results
      } else {
        while (current <= end ){
          const dayStr = current.toISOString().split("T")[0]
          // Push the same start and end times for presets
          results.push({day: dayStr, start_time: startTime, end_time: endTime })

          current.setDate(current.getDate() + 1) // Add one day
        }
        return results
      }
    }

    const handleSave = async () => {
        if(!user) {
            setError("You must be logged in to submit availability")
            return
        }

        if (mode === 'custom'){
          if (!startDate || !startTime || !endTime || !endDate) {
            setError("Please fill in all fields")
            return  
          }
          if (startTime >= endTime) {
            toast.error("Start time must be before end time")
            return
          }
        }

        if (mode === 'preset'){
          if (!startDate || !endDate) {
            setError("Please fill in all fields")
            return
          }
          if (selectedPresets.length === 0) {
            setError("Please select at least one preset")
            return
          }
        }

        const planStart = new Date(planData.start_date)
        const planEnd = new Date(planData.end_date)   


        if (new Date(startDate) < planStart || new Date(endDate) > planEnd) {
          toast.error(`Pick a day between ${planStart.toDateString()} - ${planEnd.toDateString()}`)
          return
        }

        let dailySlots : {day: string, start_time: string, end_time: string} [] = []
        
        if (mode === 'custom'){
          dailySlots = breakDownAvailability(startDate, endDate, startTime, endTime)
        }

        if (mode === 'preset') {
          for (const preset of selectedPresets) {
            const oneDay = breakDownAvailability(startDate, endDate, preset.start, preset.end)
            dailySlots.push(...oneDay)
          }
        }

        console.log("slooootos", dailySlots)
        setLoading(true)
        setError(null)

        try {
          // Add mode: insert
          const { error: insertError } = await supabase
            .from("plan_availability")
            .insert(
              dailySlots.map( row =>({
                plan_id: planData.id,
                user_id: user.id,
                day: row.day, 
                start_time: row.start_time,
                end_time: row.end_time,
                created_at: new Date(),
                updated_at: new Date()
              }))
            )
          if (insertError) throw insertError
          onOpenChange(false)
        } catch (err: any) {
            console.error(err)
            setError(err.message || "Failed to save availability")
        } finally {
            setLoading(false)
        }
    }

    const togglePreset = (preset: PresetTimings) =>{
        const exists = selectedPresets.some(p => p.label === preset.label)

        if (exists) {
          setSelectedPresets(selectedPresets.filter(p => p.label !== preset.label))
        } else {
          setSelectedPresets([...selectedPresets, preset])
        }
      }
      
    useEffect(()=>{ 
      async function fetchCustomPresets() {
          if (!user) return    
                      
          setLoading(true)

          const { data , error } = await supabase
            .from("availability_presets")
            .select("label, start_time, end_time")
            .eq("user_id", user.id)

            if (error) {
              toast.error("could not retrieve presets")
              return
            }

            setCustomPresets(data.map(p=>({
              label: p.label,
              start: p.start_time,
              end: p.end_time
            })))

          setLoading(false)
      }
      fetchCustomPresets()

    },[mode])


    // make sure if check box for end date is clicked, any changes to start date changes end date
    useEffect(()=>{
      if (endDateSameAsStart) setEndDate(startDate)
    },[startDate])

    return ( 
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existingAvailability ? "Edit Availability" : "Add Availability"}</DialogTitle>
            </DialogHeader>
              {/* Button to switch between pages */}
              <div className="flex justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPage((prev) => (prev === 1 ? 2 : 1))
                    setMode((mode) => (mode === 'custom' ? 'preset' : 'preset'))
                  }}
                >
                  {page === 1 ? "Go to presets ->" : " <- Custom Time"}
                </Button>
              </div>  

              <label className="block">
                    Start Date
                    <input
                      type="date"
                      className="w-full border rounded p-2 mt-1"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </label>

                  <label className="flex items-center space-x-2">
                    End date same as Start date?
                    <input
                      type="checkbox"
                      checked = {endDateSameAsStart}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setEndDateSameAsStart(checked)
                        if (checked) setEndDate(startDate) 
                        else setEndDate('')
                      }}
                    />
                  </label>

                   <label className="block">
                    End Date
                    <input
                      type="date"
                      className="w-full border rounded p-2 mt-1"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      disabled={endDateSameAsStart}
                    />
                  </label>

              <div className="space-y-4 mt-4">
                {/* Page 1: Custom timings */}
                {page === 1 && (
                  <>
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
                  </>
                )} 
                {/* Page 2: Quick presets */}
                { page === 2 && (
                  <>
                    <p className="font-medium">Select preset timings</p>
                    <div className="space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setOpenCustomPresetModal(true)}
                      >
                        + Add Custom Preset
                      </Button>
                      {generalPresets.map((preset)=> {
                        const isSelected = selectedPresets.some(p => p.label === preset.label)
                        return (
                          <Button
                            key={preset.label}
                            variant={isSelected ? "outline" : "default"}
                            className="w-full"
                            onClick={() => { togglePreset(preset) }}
                          >
                            <span>
                              {preset.label} ({preset.start}-{preset.end})
                            </span>
                            {isSelected && (
                              <Check className="w-4 h-4 text-green-400"/>
                            )}
                          </Button>
                        )
                      })}

                      {customPresets.length > 0 && (
                        <>
                          <p className="font-medium mt-4">My Presets</p>
                          <div className="space-y-2">
                            {customPresets.map((preset) => {
                              const isSelected = selectedPresets.some(p => p.label === preset.label)
                              return (
                              <Button
                                key={preset.label}
                                variant={isSelected ? "outline" : "default"}
                                className={`w-full ${selectedPresets.some(p => p.label === preset.label) ? "bg-blue-100" : ""}`}
                                onClick={() => togglePreset(preset)}
                              >
                                 <span>
                                  {preset.label} ({preset.start}-{preset.end})
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-green-400"/>
                                )}
                              </Button>
                            )})
                          }
                          </div>
                        </>
                      )}
                      <NewCustomPreset
                        open = {openCustomPresetModal}
                        onOpenChange={setOpenCustomPresetModal}
                        onSave={(preset) => setCustomPresets(prev => [...prev, preset])}
                      />
                    </div>
                  </>
                )}
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