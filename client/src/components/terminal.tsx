import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { executeCommand, CustomFileSystem } from "@/lib/commands";
import { Card } from "@/components/ui/card";

const fileSystem: CustomFileSystem = {
  directories: {
    "/": ["home"],
    "/home": ["user"],
    "/home/user": ["documents", "projects", "downloads"],
    "/home/user/documents": ["resume.pdf", "notes.txt"],
    "/home/user/projects": ["project1", "project2"],
    "/home/user/projects/project1": ["index.js", "README.md"],
    "/home/user/projects/project2": ["app.py", "requirements.txt"],
    "/home/user/downloads": ["movie.mp4", "song.mp3"],
  },
  currentPath: "/home/user",
};

export default function Terminal() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const currentLineRef = useRef<string>("");
  const fileSystemRef = useRef<CustomFileSystem>(fileSystem);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      fontFamily: "monospace",
      fontSize: 14,
      theme: {
        background: "#1a1b26",
        foreground: "#a9b1d6",
        cursor: "#c0caf5",
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();
    term.focus();

    const prompt = " $ ";

    const printPrompt = () => {
      term.write("\r" + prompt);
    };

    printPrompt();

    term.onKey(async ({ key, domEvent }) => {
      const ev = domEvent as KeyboardEvent;

      if (ev.key === "Enter") {
        term.writeln("");

        const command = currentLineRef.current.trim();
        if (command) {
          commandHistoryRef.current.push(command);
          historyIndexRef.current = -1;

          try {
            const output = await executeCommand(command, fileSystemRef.current);
            if (output === "__CLEAR__") {
              term.clear();
            } else {
              for (const line of output.split("\n")) {
                term.writeln(line.trim());
              }
            }
          } catch (error) {
            term.writeln("\rError executing command");
          }
        }

        currentLineRef.current = "";
        printPrompt();
      } else if (ev.key === "Backspace") {
        if (currentLineRef.current.length > 0) {
          currentLineRef.current = currentLineRef.current.slice(0, -1);
          term.write("\b \b");
        }
      } else if (ev.key === "ArrowUp") {
        if (commandHistoryRef.current.length > 0) {
          if (historyIndexRef.current < commandHistoryRef.current.length - 1) {
            historyIndexRef.current++;
            const historyCommand =
              commandHistoryRef.current[
                commandHistoryRef.current.length - 1 - historyIndexRef.current
              ];
            while (currentLineRef.current.length > 0) {
              term.write("\b \b");
              currentLineRef.current = currentLineRef.current.slice(0, -1);
            }
            currentLineRef.current = historyCommand;
            term.write(historyCommand);
          }
        }
      } else if (ev.key === "ArrowDown") {
        if (historyIndexRef.current > -1) {
          historyIndexRef.current--;
          while (currentLineRef.current.length > 0) {
            term.write("\b \b");
            currentLineRef.current = currentLineRef.current.slice(0, -1);
          }
          if (historyIndexRef.current >= 0) {
            const historyCommand =
              commandHistoryRef.current[
                commandHistoryRef.current.length - 1 - historyIndexRef.current
              ];
            currentLineRef.current = historyCommand;
            term.write(historyCommand);
          }
        }
      } else if (ev.key === "Tab") {
        ev.preventDefault();
        const input = currentLineRef.current.trim().split(" ");
        const lastInput = input[input.length - 1];
        const dirContents =
          fileSystemRef.current.directories[
            fileSystemRef.current.currentPath
          ] || [];

        const matches = dirContents.filter((item) =>
          item.startsWith(lastInput),
        );
        if (matches.length === 1) {
          const completion = matches[0].slice(lastInput.length);
          currentLineRef.current += completion;
          term.write(completion);
        } else if (matches.length > 1) {
          term.writeln("");
          matches.forEach((match) => term.writeln(match));
          printPrompt();
          term.write(currentLineRef.current);
        }
      } else if (!ev.ctrlKey && !ev.altKey && key.length === 1) {
        currentLineRef.current += key;
        term.write(key);
      }
    });

    xtermRef.current = term;

    const handleResize = () => {
      fitAddon.fit();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
    };
  }, []);

  return (
    <Card className="w-full h-[500px] overflow-hidden rounded-lg border bg-black">
      <div ref={terminalRef} className="w-full h-full" />
    </Card>
  );
}
