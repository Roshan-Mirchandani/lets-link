'use client'

import { 
    LineChart,Line,
    XAxis, YAxis,
    Tooltip, ResponsiveContainer, CartesianGrid
} from "recharts"
import { Availability, Plan, AvailabilityChartProps } from "@/types/supabase"
import { differenceInDays, addDays, format } from "date-fns"
import { useEffect } from "react"

export default function AvailabilityChart({
    availabilities,
    interval,
    members,
    planDetails
    
}: AvailabilityChartProps){

    const generateIntervals = () => {
        const start = new Date(planDetails.start_date)
        const end = new Date(planDetails.end_date)
        const labels: string[] = []

        const totalDays = differenceInDays(end,start) + 1

        for (let i = 0; i < totalDays; i++){
            const day = addDays(start, i)

            if ( interval === 24) {
                labels.push(format(day,"yyyy-MM-dd"))
            } else {
                for (let h = 0; h <24; h+= interval){
                    labels.push(`${format(day,"yyyy-MM-dd")} ${String(h).padStart(2,"0")}:00`)
                }
            }
        }
        return labels
    }

    function transformAvailabilities(
        availabilities: Availability[], // raw Supabase rows
        intervalLabelsIso : string[], // interval labels made my generateIntervals()
        intervalLengthMs : number // interval length in ms, used for maths in function
    ) {
        // turn interval labels into date objects
        const intervalLabels = intervalLabelsIso.map(dateStr => new Date(dateStr))
        
        // get an array with unique elements of all user ids 
        const members = Array.from(new Set(availabilities.map(a => a.user_id)))

        // for each member (with their availability shared) create a data set
        return members.map(memberId => {
            // loop over each interval
            const dataPoints = intervalLabels.map(intervalStart => { // the beginning of the slot
                const intervalEnd = new Date(intervalStart.getTime() + intervalLengthMs) // the end of the slot

                const fraction = availabilities
                  .filter(a => a.user_id === memberId) // only get current members (in loop) availabiity
                  .map(a=> {
                    // make javascript date time objects
                    const start = new Date(`${a.day}T${a.start_time}`) 
                    const end = new Date(`${a.day}T${a.end_time}`)
                  
                    const overlap = // math part
                        Math.max (
                            0, // ensures 0 as minimum (in case of no ovelap)
                            Math.min(intervalEnd.getTime(), end.getTime()) - // takes the minimum time
                              Math.max(intervalStart.getTime(), start.getTime()) // takes the maximum time
                        ) / intervalLengthMs // to get the fraction

                    return overlap
                })
                .reduce((max,val) => Math.max(max,val), 0) // reducer for multiple entries that overlapped
                
                return{
                    interval: intervalStart.toISOString().slice(0,16), // timestamp till minutes
                    available: fraction
                }
            })

            return { memberId, data: dataPoints}
        })
    }

    function prepareChartData(transformed: ReturnType<typeof transformAvailabilities>){
        if (transformed.length === 0) return []

        const intervals = transformed[0].data.map(d => new Date(d.interval).getTime())

        return intervals.map((interval, idx) => {
            const row: Record<string, any> = { interval }
            transformed.forEach(memberData => {
                row[memberData.memberId] = memberData.data[idx].available
            })
            return row
        })
    }

    const intervalLabels =  generateIntervals() 
    const intervalSize = interval * 60 * 60 * 1000
    const transformedData =  transformAvailabilities(availabilities, intervalLabels, intervalSize)
    const chartData = prepareChartData(transformedData)
    console.log(chartData)


   return (
  <div className="w-full h-[400px] p-4 border rounded shadow-sm bg-white">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 50, right: 30, left: 60, bottom: 60 }}
      >
        <CartesianGrid strokeDasharray="3 3" />

        {/* X Axis bottom: show times */}
        <XAxis
          dataKey="interval"
          type="number"
          domain={['dataMin', 'dataMax']}
          scale="time"
          tickFormatter={(tick) => format(new Date(tick), 'HH:mm')}
          tick={{ fontSize: 12 }}
          height={40}
          interval={0}
        />

        {/* Custom top X axis for dates */}
        <XAxis
          dataKey="interval"
          type="number"
          scale="time"
          orientation="top"
          tick={false}
          axisLine={false}
          domain={['dataMin', 'dataMax']}
          height={30}
          label={{ value: '', position: 'insideTop' }}
        >
          {chartData.map((d, i) => {
            const dateStr = format(new Date(d.interval), 'dd/MM');
            // Only label when date changes
            if (i === 0 || format(new Date(chartData[i-1].interval), 'dd/MM') !== dateStr) {
              return <text key={i} x={i * 50} y={0}>{dateStr}</text>;
            }
            return null;
          })}
        </XAxis>

        {/* Y axis as users */}
        <YAxis
          type="category"
          dataKey="memberNames" // map user IDs -> names in chartData
          width={120}
          tick={{ fontSize: 12 }}
        />

        <Tooltip
          labelFormatter={(label) => format(new Date(label), 'dd/MM HH:mm')}
          formatter={(value: number) => `${(value*100).toFixed(0)}%`}
        />

        {/* Lines per user */}
        {members.map((user) => (
          <Line
            key={user.user_id}
            type="monotone" // smooth line
            dataKey={user.user_id}
            stroke={`#${Math.floor(Math.random()*16777215).toString(16)}`}
            dot={false}
            isAnimationActive={false}
          />
        ))}

      </LineChart>
    </ResponsiveContainer>
  </div>
    )

}
