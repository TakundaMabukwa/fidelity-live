import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { AppProvider } from '@/contexts/app-context';
import { RoutesProvider } from '@/contexts/routes-context';
import { BranchesProvider } from '@/contexts/branches-context';
import { CustomersProvider } from '@/contexts/customers-context';
import { DriversProvider } from '@/contexts/drivers-context';
import { StaffProvider } from '@/contexts/staff-context';
import { RouteAssignmentProvider } from '@/contexts/route-assignment-context';
import { VehiclesProvider } from '@/contexts/vehicles-context';
import { LiveFeedProvider } from '@/contexts/live-feed-context';
import { LiveFeedManager } from '@/components/live-feed-manager';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    redirect("/auth/login");
  }
  return (
    <AppProvider>
      <RoutesProvider>
        <BranchesProvider>
          <CustomersProvider>
            <DriversProvider>
              <StaffProvider>
                <RouteAssignmentProvider>
                  <VehiclesProvider>
                    <LiveFeedProvider>
                      <LiveFeedManager>
                        <div className="flex bg-gray-50 h-screen">
                          <Sidebar />
                          <div className="flex flex-col flex-1">
                            <Header />
                            <main className="flex-1 p-6 overflow-auto">
                              {children}
                            </main>
                          </div>
                        </div>
                      </LiveFeedManager>
                    </LiveFeedProvider>
                  </VehiclesProvider>
                </RouteAssignmentProvider>
              </StaffProvider>
            </DriversProvider>
          </CustomersProvider>
        </BranchesProvider>
      </RoutesProvider>
    </AppProvider>
  );
}