import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";

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
  return <Welcome value={loaderData.message} />;
}
