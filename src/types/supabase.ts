export type Group = {
  id: string
  name: string
  owner: string
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
    existingAvailability?: Availability
}

export type AvailabilityChartProps = {
    availabilities : Availability[]
    interval: number
    members : Member[]
    planDetails: Plan
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
  label: string,
  start: string,
  end: string
}

export type NewCustomPresetModalProps = {
  open: boolean,
  onOpenChange: (open: boolean) => void,
  onSave: (preset: PresetTimings) => void
}