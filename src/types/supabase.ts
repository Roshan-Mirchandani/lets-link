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
  name: string
  description?: string
  start_date: string  // ISO string
  end_date: string    // ISO string
}

export type Availability = {
  id: string
  plan_id: string
  user_id: string
  day: string
  start_time: string
  end_time: string
  created_at: string,
  updated_at: string
}

export type AvailabilityModalProps = { 
    open: boolean
    onOpenChange: (open: boolean) => void
    planId: string
    existingAvailability?: Availability
    startDate: string // ISO date string
    endDate: string // ISO date string
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