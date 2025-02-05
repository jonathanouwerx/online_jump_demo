import { Card } from "@/components/ui/card";
import Terminal from "@/components/terminal";
import { Command } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <Command className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold text-primary">
            Jump CLI Tool Demo
          </h1>
        </header>

        <Card className="p-6 mb-8 bg-muted/50 shadow-lg rounded-2xl">
          <p className="text-lg text-foreground mb-4">
            This is an absolute barebones terminal with just enough
            functionality to demonstrate the{" "}
            <span className="font-semibold text-primary">jump CLI tool</span>.
          </p>
          <h2 className="text-2xl font-semibold text-primary mb-3">
            Instructions:
          </h2>
          <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
            <li>
              <code className="bg-muted px-2 py-1 rounded">jump list</code> -
              Display all available jumps
            </li>
            <li>
              <code className="bg-muted px-2 py-1 rounded">jump add NAME</code>{" "}
              - Add a new jump location in the working directory
            </li>
            <li>
              <code className="bg-muted px-2 py-1 rounded">jump to NAME</code> -
              Open a directory in VS Code
            </li>
            <li>
              <code className="bg-muted px-2 py-1 rounded">jump rm NAME</code> -
              Remove a jump location
            </li>
          </ul>
        </Card>

        <Terminal />
      </div>
    </div>
  );
}
