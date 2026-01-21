import { createApp } from 'buncf';
import { cmsPlugin } from "./plugins/cms";
// import tailwind from "bun-plugin-tailwind";

export default createApp({
    plugins: [
        // tailwind,
        cmsPlugin({
            adminPath: "/admin"
        })
    ]
});
