import { RoutesProvider } from '@/contexts/routes-context';
import { DriversProvider } from '@/contexts/drivers-context';
import { StaffProvider } from '@/contexts/staff-context';
import { VehiclesProvider } from '@/contexts/vehicles-context';
import { CustomersProvider } from '@/contexts/customers-context';
import { CustomersLocationProvider } from '@/contexts/customers-location-context';
import { GroupedRoutesProvider } from '@/contexts/grouped-routes-context';
import { ExternalVehiclesProvider } from '@/contexts/external-vehicles-context';

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
                  <GroupedRoutesProvider>
                    <ExternalVehiclesProvider>
                      {children}
                    </ExternalVehiclesProvider>
                  </GroupedRoutesProvider>
                </CustomersLocationProvider>
              </CustomersProvider>
            </VehiclesProvider>
          </StaffProvider>
        </DriversProvider>
      </RoutesProvider>
    </main>
  );
}
