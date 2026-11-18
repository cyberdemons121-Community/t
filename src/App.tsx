import { SiteLayout } from "./components/SiteLayout";
import type { PageId } from "./data/site";
import { CtfPage } from "./pages/CtfPage";
import { HackathonPage } from "./pages/HackathonPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";

interface AppProps {
  page: PageId;
}

function App({ page }: AppProps) {
  return (
    <SiteLayout page={page}>
      {page === "home" ? <HomePage /> : null}
      {page === "hackathon" ? <HackathonPage /> : null}
      {page === "ctf" ? <CtfPage /> : null}
      {page === "login" ? <LoginPage /> : null}
    </SiteLayout>
  );
}

export default App;
