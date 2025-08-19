import type { Metadata } from "next";
import "./globals.css";
import {SupabaseProvider} from '@/components/SupabaseProvider'


export const metadata: Metadata = {
  title: "Lets Link!",
  description: "Find common availability effortlessly.",
};

export default function RootLayout( {children} : {children: React.ReactNode}) {

  return (
    <html lang="en">
      <body>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  );
}
