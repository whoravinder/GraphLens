import { DashboardLayout } from '@/components/layout/sidebar'

export default function DashboardRootLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>
}
