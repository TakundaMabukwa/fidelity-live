import { RoutesProvider } from '@/contexts/routes-context';
import { DriversProvider } from '@/contexts/drivers-context';
import { StaffProvider } from '@/contexts/staff-context';
import { VehiclesProvider } from '@/contexts/vehicles-context';
import { CustomersProvider } from '@/contexts/customers-context';
import { CustomersLocationProvider } from '@/contexts/customers-location-context';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen">
      <RoutesProvider>
        <DriversProvider>
          <StaffProvider>
            <VehiclesProvider>
              <CustomersProvider>
                <CustomersLocationProvider>
                  {children}
                </CustomersLocationProvider>
              </CustomersProvider>
            </VehiclesProvider>
          </StaffProvider>
        </DriversProvider>
      </RoutesProvider>
    </main>
  );
}
