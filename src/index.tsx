import ReactDOM from "react-dom";
import App from "./App";
// import "@elastic/eui/dist/eui_theme_light.css";
// import "@elastic/eui/dist/eui_theme_dark.css";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { BrowserRouter } from "react-router-dom";
import StreamContextProvider from "./pages/StreamContext";

ReactDOM.render(
  <Provider store={store}>
    <BrowserRouter>
      <StreamContextProvider>
        <App />
      </StreamContextProvider>
    </BrowserRouter>
  </Provider>,
  document.getElementById("root")
);
