import DashboardApp from "./dashboard-app";
import { fallbackBills, fallbackFees, fallbackResidents, fallbackTransactions } from "./fallback-data";

export const dynamic = "force-static";

export default function HomePage() {
  return (
    <DashboardApp
      residents={fallbackResidents}
      transactions={fallbackTransactions}
      bills={fallbackBills}
      fees={fallbackFees}
    />
  );
}
