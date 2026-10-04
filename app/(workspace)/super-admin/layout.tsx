import WorkspaceGate from '@/components/accounts/WorkspaceGate';
export default function Layout({ children }: { children: React.ReactNode }) { return <WorkspaceGate scope="super-admin">{children}</WorkspaceGate>; }
