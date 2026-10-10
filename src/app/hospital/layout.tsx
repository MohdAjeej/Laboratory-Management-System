import { RoleBasedLayout } from '@/components/layout/RoleBasedLayout';

export default function HospitalLayout({ children }: { children: React.ReactNode }) {
  return <RoleBasedLayout>{children}</RoleBasedLayout>;
}
