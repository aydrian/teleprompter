import type { Config } from "@react-router/dev/config";
import "react-router";

declare module "react-router" {
  interface Future {
    unstable_middleware: true;
  }
}

export default {
  ssr: true, // Enable server-side rendering (Framework Mode)
  future: {
    unstable_middleware: true,
    unstable_optimizeDeps: true,
    unstable_splitRouteModules: true,
    unstable_viteEnvironmentApi: true
  }
} satisfies Config;
