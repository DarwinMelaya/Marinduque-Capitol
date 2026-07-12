import { Toaster } from "react-hot-toast";
import { Routers } from "./Routers/Routers";

const App = () => {
  return (
    <div>
      <Routers />
      <Toaster position="top-right" />
    </div>
  );
};

export default App;
