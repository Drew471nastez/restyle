import { AppBottomNav } from '@/components/layout/AppBottomNav';
import { AppTopBar } from '@/components/layout/AppTopBar';
import { ToastProvider } from '@/components/ui/Toast';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <AppTopBar />
      <div className="flex-1 pb-20 md:pb-0">
        <div className="mx-auto max-w-7xl">
          {children}
        </div>
      </div>
      <AppBottomNav />
    </ToastProvider>
  );
}
