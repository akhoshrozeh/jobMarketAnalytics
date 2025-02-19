import { verifyIdToken } from '../../utils/verifyToken'
import Sidebar from "./Sidebar"

export default async function AnalyticsLayout({children}: {children: React.ReactNode}) {
  const tokenPayload = await verifyIdToken();
  const tier = tokenPayload?.["custom:tier"] as string || "free";
  return (
    <div>
      <Sidebar tier={tier as 'free' | 'basic' | 'premium'}>
        {children}
      </Sidebar>
    </div>
  )
}