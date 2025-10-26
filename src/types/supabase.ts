export type Group = {
  id: string
  name: string
  owner: string
}

export type ProfileCardProps = {
  firstName : string,
  surname : string,
  email : string,
  avatarUrl? : string
}

export type Member = {
  user_id: string
  role: string
  first_name : string
  surname : string
  avatar_url :string
}

export type Plan = {
  id: string,
  name: string
  description?: string
  start_date: string  // ISO string
  end_date: string    // ISO string
}

export type Availability = {
  id: string
  plan_id: string
  user_id: string
  day:string,
  start_time: string
  end_time: string
  time_blocks: any[]
  created_at: string,
  updated_at: string
}

export type AvailabilityModalProps = { 
    open: boolean
    onOpenChange: (open: boolean) => void
    planData: Plan
    existingAvailability?: {
      user_id: string
      start_date: Date
      end_date: Date
      ids: string [] 
    } | null
}

export type AvailabilityChartProps = {
    availabilities : Availability[]
    interval: number
    members : Member[]
    planDetails: Plan
    onBarClick? : (availability : {
      user_id: string
      start_date: Date
      end_date: Date
      ids: string[] 
    }) => void
}

export type InviteLinkButtonProps = {
    groupId : string
}

export type Slot = {
    start: Date
    end: Date
    day: string
    hour: string
}

export type PresetTimings = {
  id?: string,
  label: string,
  start: string,
  end: string
}

export type NewCustomPresetModalProps = {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSave?: (preset: PresetTimings) => void
}

export type EditCustomPresetModalProps = {
  selectedCustomPreset: PresetTimings,
  allCustomPresets: PresetTimings[],
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSave?: (preset: PresetTimings) => void
}