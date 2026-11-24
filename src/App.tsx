import { AdminPage } from "./pages/AdminPage";
import { SiteLayout } from "./components/SiteLayout";
import type { PageId } from "./data/site";
import { CtfPage } from "./pages/CtfPage";
import { HackathonPage } from "./pages/HackathonPage";
import { HackathonUpdatesPage } from "./pages/HackathonUpdatesPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { UserDashboardPage } from "./pages/UserDashboardPage";

interface AppProps {
  page: PageId;
}

function App({ page }: AppProps) {
  return (
    <SiteLayout page={page}>
      {page === "home" ? <HomePage /> : null}
      {page === "hackathon" ? <HackathonPage /> : null}
      {page === "hackathon-updates" ? <HackathonUpdatesPage /> : null}
      {page === "ctf" ? <CtfPage /> : null}
      {page === "login" ? <LoginPage /> : null}
      {page === "dashboard" ? <UserDashboardPage /> : null}
      {page === "admin" ? <AdminPage /> : null}
    </SiteLayout>
  );
}

export default App;
