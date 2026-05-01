import { createBrowserRouter } from "react-router-dom";
import {compareRoutes} from "../pages/AI/routes.tsx";
import App from "../App.tsx";

export const router = createBrowserRouter([
    {
        path: "/",
        // element: <App />,
        children: [
            {
                index: true,
                element: <App />,
            },
            compareRoutes,
        ],
    },
]);
