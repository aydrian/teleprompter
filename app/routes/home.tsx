import { Monitor, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
	return [
		{ title: "LiveKit Teleprompter" },
		{
			name: "description",
			content: "Real-time speech transcription teleprompter powered by LiveKit",
		},
	];
}

export default function Home() {
	return (
		<div className="min-h-screen bg-background flex items-center justify-center">
			<div className="text-center space-y-8 p-8">
				<div className="space-y-4">
					<Monitor className="h-16 w-16 mx-auto text-primary" />
					<h1 className="text-4xl font-bold">LiveKit Teleprompter</h1>
					<p className="text-lg text-muted-foreground max-w-md mx-auto">
						Real-time speech transcription displayed in a clean teleprompter interface
					</p>
				</div>

				<Button asChild size="lg" className="gap-2">
					<Link to="/teleprompter">
						Launch Teleprompter
						<ArrowRight className="h-4 w-4" />
					</Link>
				</Button>
			</div>
		</div>
	);
}
