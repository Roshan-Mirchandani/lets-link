'use client'

import { addHours, subHours, format, differenceInHours, max as dateMax, min as dateMin } from 'date-fns'
import { AvailabilityChartProps, Slot } from "@/types/supabase"
import { useEffect } from 'react'
import { useUser } from '@supabase/auth-helpers-react'

export default function AvailabilityChart({
    availabilities,
    interval,
    members,
    planDetails,
    onBarClick
}: AvailabilityChartProps){
    const user = useUser()
 
    const startDate = new Date(planDetails.start_date)
    startDate.setHours(0,0,0,0) // set time to local midnight
    const endDate =  new Date(planDetails.end_date)
    endDate.setHours(0,0,0,0) // set time to local midnight

    const bufferStart = subHours(startDate, interval)
    // const bufferEnd = addHours(endDate, interval)

    // Generate slot: the sections of the graph
    const totalHoursWithBuffer = differenceInHours(endDate, bufferStart)
    const slots: Slot[] = []

    for(let i=0; i<=totalHoursWithBuffer; i+= interval){
        const start = addHours(bufferStart, i)
        const end = addHours(start, interval)
    
        slots.push({
            start,
            end,
            day: format(start, 'EEE MMM dd'),
            hour: format(start, 'HH:mm')
        })
    }

    // Group them by day 
    const slotsByDay: Record<string, Slot[]> = {}
    slots.forEach((slot)=> {
        if(!slotsByDay[slot.day]) slotsByDay[slot.day] = []
        slotsByDay[slot.day].push(slot)
    })

    // console.log("yasss",availabilityRanges)

    // For mergeAvailabilities()
    const availabilitiesAsDates = availabilities.map((a)=>({
        id: a.id,
        user_id: a.user_id,
        start: new Date(`${a.day}T${a.start_time}`),
        end: new Date(`${a.day}T${a.end_time}`)
    }))

    // When rendered, filtered by user 
    function mergedAvailabilities(availabilitiesAsDates: { id: string, user_id: string, start: Date, end: Date}[]) {
        const sorted = [...availabilitiesAsDates].sort(
            (a,b) => a.start.getTime() - b.start.getTime()
        )

        type MergedSlot = {
            user_id: string
            start: Date
            end: Date
            ids: string[] // keep track of the ids of the rows involved
        }

        const merged: MergedSlot[] = []

        for(const a of sorted) {
            const last = merged[merged.length -1]
            // KEEP AS IS. Repetition of code for if statements, factoring out whats common seems to break rendering
            if( // one slot end =< one slot start (except for midnight case)
                last && 
                last.user_id === a.user_id && 
                last.end >= a.start
            ) {
                last.end = new Date(Math.max(last.end.getTime(), a.end.getTime()))
                last.ids.push(a.id)
            } else if ( // the midnight case
                last && 
                last.user_id === a.user_id && 
                last.end.getTime() + 60000 >= a.start.getTime() // 60000ms is 1 minute, enough to check the midnight case
            ){  
                // console.log("across mignight connection")
                last.end = new Date(Math.max(last.end.getTime(), a.end.getTime()))
                last.ids.push(a.id)
            } else { // no overlap, push and move on
                merged.push({...a, ids: [a.id]})
            }
        }
        return merged 
    }

    useEffect(()=>{
        members.forEach((m)=>{
            const ranges =  mergedAvailabilities(
                availabilitiesAsDates.filter(a => a.user_id === m.user_id)
                )
            // console.log("muuuurge", m.first_name, ranges)
        })
    },[])

    if (!user) return <p>Please log in</p>
    return (
        <div className='overflow-x-scroll bg-white'>
            {/* Grid template: 1 columns for names + N columns for slots */}
            <div 
                className={'grid'}
                style = {{
                    gridTemplateColumns: `150px repeat(${slots.length}, minmax(60px, 1fr))`
                }}
            >
                {/* Outer Header : Dates*/}
                <div className="sticky left-0 z-10 bg-white border-b border-r font-semibold text-sm flex items-center justify-center">
                    Date
                </div>
                {/* DAYS */}
                {Object.entries(slotsByDay).map(([day, daySlots], dayIdx, arr) => {
                    const span = daySlots.length
                    // If first or last group (buffers), render an empty spacer that still occupies the columns
                    if (dayIdx === 0 || dayIdx === arr.length - 1) {
                        return (
                        <div
                            key={`spacer-${day}`}
                            className="border-b border-r bg-white"
                            style={{ gridColumn: `span ${span}` }}
                        />
                        )
                    }

                    // Normal day label spanning its slots
                    return (
                        <div
                            key={day}
                            className="border-b border-r text-center bg-gray-50 font-medium"
                            style={{ gridColumn: `span ${span}` }}
                        >
                            {day}
                        </div>
                    )
                })}
                {/* Inner Header : Hours */}
                <div
                    className='sticky left-0 z-10 bg-white border-b border-r font-semibold text-sm flex items-center justify-center'
                >
                    Hours
                </div>

                {/* HOURS */}
                {slots.map((slot,idx)=> {
                    if(idx ===0 ) { // buffer start remove time
                        return <div key={`hour-spacer-${idx}`} className="border-b border-r bg-white" />
                    }    
                    // rest display as normal
                    return (
                        <div 
                            key = {`hour-${idx}`}
                            className="border-b border-r relative"
                        >
                            <span className="absolute -top-0 -translate-x-1/2 text-[10px] text-gray-600">
                                {slot.hour}
                            </span>
                        </div>
                    )   
                })}

                {/* MEMBER ROWS */}
                {members.map((m) => (
                    <div className='contents' key={m.user_id}>
                        {/* User name */}
                        <div className='sticky left-0 bg-white border-r flex items-center justify-center px-2 text-sm font-medium'>
                            {m.first_name}
                        </div>
                        
                        {/* Member BARS */}
                        {
                        slots.map((slot, idx) => {
                            const mergedUserAvailabilities = mergedAvailabilities(
                                availabilitiesAsDates.filter(a => a.user_id === m.user_id)
                            )

                            return (
                                <div
                                    key={`${m.user_id}-slot-${idx}`}
                                    className="border-r h-12 relative bg-white"
                                >
                                    {mergedUserAvailabilities.map((a,i) =>{
                                        const slotDuration = slot.end.getTime() - slot.start.getTime()
                                        const overlapStart = dateMax([a.start, slot.start])
                                        const overlapEnd = dateMin([a.end, slot.end])
                                        const overlapMs = Math.max(0, overlapEnd.getTime() - overlapStart.getTime())
                                        
                                        if (overlapMs <= 0) return null

                                        const leftFrac = (overlapStart.getTime() - slot.start.getTime()) / slotDuration
                                        const widthFrac=  overlapMs / slotDuration
                                    
                                        return (
                                            <div
                                                key ={`${m.user_id}-slot-${idx} - ${i}`}
                                                className="absolute top-0 h-full bg-blue-500 opacity-70 group"
                                                style={{
                                                left: `${leftFrac * 100}%`,
                                                width: `${widthFrac * 100}%`,
                                                }}
                                                onClick={() => {if(user.id === a.user_id) {
                                                    onBarClick?.({user_id: m.user_id, start_date: a.start, end_date: a.end, ids: a.ids })}
                                                }}
                                            >
                                                {/* Tooltip */}
                                                <div className="absolute hidden group-hover:flex flex-col gap-1 bg-gray-800 text-white text-xs rounded px-2 py-1 -top-10 left-1/2 -translate-x-1/2 whitespace-nowrap shadow">
                                                    <span>
                                                        {m.first_name}: {format(a.start, "HH:mm dd MMM")} - {format(a.end, "HH:mm dd MMM")}
                                                    </span>
                                                    {a.user_id === user?.id &&  (
                                                        <span className='font-style: italic'>Edit/ Delete</span>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </div>
                ))}
            </div>
        </div>
  )
}
