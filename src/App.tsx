import "./App.css";
import { Calendar } from "./components/calendar";
import { Navbar } from "./components/navbar";
import { CurdContextProvider } from "./context/useCrudContext";
import { Toaster } from "sonner";
function App() {
  return (
    <main>
      <CurdContextProvider>
        <Navbar />
        <Calendar />
        <Toaster position="bottom-right" richColors />
      </CurdContextProvider>
    </main>
  );
}

export default App;
