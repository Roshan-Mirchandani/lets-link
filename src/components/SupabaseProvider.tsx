'use client'

import { ReactNode } from "react"
import { SessionContextProvider } from "@supabase/auth-helpers-react"
import {supabase} from '@/lib/supabaseClient'

export function SupabaseProvider ({children} : {children: ReactNode}){
    return (
        <SessionContextProvider supabaseClient = {supabase}>
            {children} 
        </SessionContextProvider>
)}


