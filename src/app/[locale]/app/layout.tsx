import { AppBottomNav } from '@/components/layout/AppBottomNav';
import { AppTopBar } from '@/components/layout/AppTopBar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppTopBar />
      <div className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </div>
      <AppBottomNav />
    </>
  );
}
