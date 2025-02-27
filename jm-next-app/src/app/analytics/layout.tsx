import { verifyIdToken } from '../../utils/verifyToken'
import ClientLayout from './clientLayout'

export default async function AnalyticsLayout({children}: {children: React.ReactNode}) {
  const tokenPayload = await verifyIdToken();
  const tier = tokenPayload?.["custom:tier"] as string || "free";

  return <ClientLayout tier={tier as 'free' | 'basic' | 'premium'}>{children}</ClientLayout>
}