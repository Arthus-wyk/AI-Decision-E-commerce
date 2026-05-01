import type {RouteObject} from "react-router-dom";
import ChatPage from "./ChatPage.tsx";
import CompareGroups from "./CompareGroups.tsx";


export const compareRoutes: RouteObject = {
    path: "/compare",
    // element: <CompareLayout />,
    children: [
        {
            path: 'groups',
            // element: <CompareGroups/>,
            children: [
                {
                    index: true,
                    element: <CompareGroups />,
                },
                {
                    path: ":groupId",
                    element: <ChatPage/>,
                }
            ]
        },

    ],
};
