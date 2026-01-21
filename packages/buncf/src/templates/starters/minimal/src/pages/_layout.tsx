
import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div>
      <header style={{ marginBottom: "2rem", borderBottom: "1px solid #eee", paddingBottom: "1rem" }}>
        <h1 style={{ margin: 0 }}>{{PROJECT_NAME}}</h1>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
