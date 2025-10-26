'use client'

import { EditCustomPresetModalProps } from "@/types/supabase"
import { useUser, useSupabaseClient } from "@supabase/auth-helpers-react"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"


export default function EditCustomPresetModal({
    selectedCustomPreset, allCustomPresets, open, onOpenChange, onSave
}: EditCustomPresetModalProps
) {
    const user = useUser()
    const supabase = useSupabaseClient()

    const [presetId, setPresetId] = useState('')
    const [label, setLabel] = useState('')
    const [start, setStart] = useState('')
    const [end, setEnd] = useState('')

    const [loading, setLoading] = useState(false)

    useEffect(()=>{
        if (!user) return
        if (!selectedCustomPreset) return
        setPresetId(selectedCustomPreset.id!)
        setLabel(selectedCustomPreset.label)
        setStart(selectedCustomPreset.start)
        setEnd(selectedCustomPreset.end)
        // console.log("rannnin", selectedCustomPreset)
    },[selectedCustomPreset, user])

    const handleUpdate = async () => {
        if (!user) {
            return
        }

        // check if any changes were made
        const isChanged =
          label !== selectedCustomPreset.label ||
          start !== selectedCustomPreset.start ||
          end !== selectedCustomPreset.end
        
        if (!isChanged) {
            toast.info("No changes detected");
            return;
        }

        //check for existing name
        const normalizedLabel = label.trim().toLowerCase();
        const hasDuplicate = allCustomPresets.some(
            (p) =>  
                p.label.trim().toLowerCase() === normalizedLabel &&
                p.id !== presetId
            );

        if (hasDuplicate) {
            toast.warning("A preset with this name already exists");
            return;
        }

        setLoading(true)
        // update in supabase
        setLoading(true)
        try {
          const { data, error } = await supabase
            .from("availability_presets")
            .update({
              label,
              start_time: start,
              end_time: end,
            })
            .eq("id", presetId)
            .eq("user_id", user.id)
            .select()

          if (error) {
            toast.error("Failed to update preset: " + error.message)
            return
          }

          if (!data || data.length === 0) {
            toast.error("No matching preset found or no changes were applied.")
            return
          }

          toast.success("Preset updated successfully")
          onOpenChange(false)
        } catch (err) {
          console.error("Unexpected error while updating preset:", err)
          toast.error("Something went wrong while updating the preset.")
        } finally {
          setLoading(false)
        }
    }

    const handleDelete = async () => {
        if (!user) {
            return
        }

        try {
            setLoading(true)
            const {error: deleteError, count: deleteCount} = await supabase
              .from("availability_presets")
              .delete()
              .eq("user_id",user.id)
              .eq("id", presetId)

            setLoading(false)

            if (deleteError) throw deleteError
            
            if (!deleteCount) {
                toast.warning("No matching preset found or already deleted.");
                return;
                }

            toast.success("Preset deleted successfully");
            onOpenChange(false)
            return
        } catch(err: any) {
            console.error("Preset delete failed:", err)
            toast.error("Failed to delete preset");
        }
    }
    // console.log("edit", start, end, label)
    return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Custom Preset</DialogTitle>
          <DialogDescription>
            Update or delete your custom preset timing below.
          </DialogDescription>
        </DialogHeader>

        {!selectedCustomPreset ? (
          <p className="text-sm text-muted-foreground">No preset selected.</p>
        ) : (
          <div className="space-y-4">
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Preset name"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                id="start"
                type="time"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
              <Input
                id="end"
                type="time"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </div>
          </div>
        )}

        <DialogFooter className="flex justify-between mt-4">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                {/* <Loader2 className="w-4 h-4 animate-spin mr-2" /> */}
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>

          <Button onClick={handleUpdate} disabled={loading}>
            {loading ? (
              <>
                {/* <Loader2 className="w-4 h-4 animate-spin mr-2" /> */}
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
