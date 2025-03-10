import Sidebar from "./Sidebar"
import { verifyIdToken } from "@/utils/verifyToken"

export default async function AnalyticsLayout({children}: {children: React.ReactNode}) {
  const tier = await verifyIdToken();
  return <div>  
    <Sidebar tier={tier.payload?.["custom:tier"] as 'free' | 'basic' | 'premium' || 'free'}>
      {children}
    </Sidebar>
  </div>
}