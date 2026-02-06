import { ReactNode } from "react";
import { TopBar } from "./TopBar.js";
import { Sidebar } from "./Sidebar.js";

interface MainLayoutProps {
  children: ReactNode;
  showImport: boolean;
  onImportClick: () => void;
}

export function MainLayout({ children, showImport, onImportClick }: MainLayoutProps): JSX.Element {
  return (
    <>
      <TopBar onImportClick={onImportClick} />
      <div className="main-layout">
        <Sidebar />
        <main className="content" role="main" aria-label="API content">
          <div className="content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </>
  );
}
