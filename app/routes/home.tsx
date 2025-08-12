import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { LiveKitTest } from "@/components/LiveKitTest";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Teleprompter App" },
    { name: "description", content: "Real-time speech transcription teleprompter" }
  ];
}

export async function loader(_: Route.LoaderArgs) {
  return { 
    message: "Welcome to the Teleprompter App!" 
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-8">
      <Welcome value={loaderData.message} />
      <div className="flex justify-center">
        <LiveKitTest />
      </div>
    </div>
  );
}
