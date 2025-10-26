'use client'

import { useEffect, useState } from "react"
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react"
import { NewCustomPresetModalProps, PresetTimings } from "@/types/supabase"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "./ui/input"
import { toast } from "sonner"

export default function NewCustomPreset({
    open, onOpenChange, onSave
}: NewCustomPresetModalProps
) {
    const user = useUser()
    const supabase = useSupabaseClient()

    const [label, setLabel] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    const [existingPresets, setExistingPresets] = useState<PresetTimings[]>([]) // for validation to avoid duplicate labels
    const [loading, setLoading] = useState(false)

    useEffect(()=>{ 
        async function fetchCustomPresets() {
            if (!user) return    
                        
            setLoading(true)

            const { data , error } = await supabase
              .from("availability_presets")
              .select("id, label, start_time, end_time")
              .eq("user_id", user.id)

              if (error) {
                toast.error("could not retrieve presets")
                return
              }

              setExistingPresets(data.map(p=>({
                id: p.id,
                label: p.label,
                start: p.start_time,
                end: p.end_time
              })))

              setLoading(false)
        }
        fetchCustomPresets()

    },[])

    const handleSave = async () => { 
        if (!user) {
            return
        }
        if (!label || ! start || !end){
           toast.error("fill in all fields")
           return
        }

        // a check for an existing name
        const labelAlreadyUsed = existingPresets.some((p) => (p.label === label))

        if(labelAlreadyUsed) {
          toast.error("This label is already in use, please use a different one")
          return
        }

        setLoading(true)
        const { data, error } = await supabase
          .from("availability_presets")
          .insert({
            user_id: user.id,
            label: label,
            start_time: start,
            end_time: end
          })
          .select() // this and next line
          .single() // to save in onSave() GPT- rec

          setLoading(false)

          if (error) {
            if (error.code == "23505"){ 
              toast.error("This label is already in use, please use a different one")
            } else {
              console.error(error)
              toast.error("Failed to save preset")
              return
            }
          }

          toast.success("Preset saved")
          setLabel('')
          setStart('')
          setEnd('')
          onOpenChange(false)
          onSave?.(data)
    }

    return (
        <Dialog open= {open} onOpenChange={onOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle> Add Custom Preset </DialogTitle>
              </DialogHeader>

            <div className="space-y-4">
                <Input placeholder="Label (e.g. after work)" value = {label} onChange={((e)=>setLabel(e.target.value))} />
                <Input type="time" value={start} onChange={e => setStart(e.target.value)} />
                <Input type="time" value={end} onChange={e => setEnd(e.target.value)} />
            </div>

            <DialogFooter>
                <Button onClick={handleSave} disabled={loading}>
                    {loading ? "Saving" : "Save"}
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
    )
}