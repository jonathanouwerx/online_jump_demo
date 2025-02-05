type CommandHandler = (
  args: string[],
  fileSystem: CustomFileSystem, // Add the filesystem parameter
) => Promise<string> | string;

interface Command {
  description: string;
  aliases?: string[];
  handler: CommandHandler;
}

export interface CustomFileSystem {
  directories: { [path: string]: string[] };
  currentPath: string;
}

const commands: Record<string, Command> = {
  help: {
    description: "Show this help message",
    handler: async (_, fileSystem) => handleHelpCommand(),
  },
  clear: {
    description: "Clear the terminal",
    handler: async (_, fileSystem) => "__CLEAR__", // Special token for clearing terminal
  },
  echo: {
    description: "Echo back the arguments",
    handler: async (args, fileSystem) => args.join(" ") || "No input provided.",
  },
  version: {
    description: "Show CLI tool version",
    aliases: ["v"],
    handler: async (_, fileSystem) => "CLI Tool Demo v1.0.0",
  },
  ls: {
    description: "List files in the current directory",
    handler: async (args, fileSystem) => handleLsCommand(args, fileSystem),
  },
  pwd: {
    description: "Show the current working directory",
    handler: async (args, fileSystem) => fileSystem.currentPath,
  },
  mkdir: {
    description: "Create a new directory",
    handler: async (args, fileSystem) => handleMkdirCommand(args, fileSystem),
  },
  cd: {
    description: "Change the current working directory",
    handler: async (args, fileSystem) => handleCdCommand(args, fileSystem),
  },
  touch: {
    description: "Create a new file",
    handler: async (args, fileSystem) => handleTouchCommand(args, fileSystem),
  },
  jump: {
    description: "Use the jump cli tool",
    handler: async (args, fileSystem) => handleJumpCommand(args, fileSystem),
  },
};

let jumps: { [key: string]: string } = {
  p2: "/home/user/projects/project2",
};

function handleJumpCommand(args: string[], fileSystem: CustomFileSystem) {
  if (args.length === 0) {
    return "Usage: jump <add|to|list|rm>";
  }

  const subcommand = args.shift();
  switch (subcommand) {
    case "add":
      return jumpAdd(args, fileSystem);
    case "to":
      return jumpTo(args, fileSystem);
    case "list":
      return jumpList();
    case "rm":
      return jumpRemove(args);
    default:
      return `Unknown jump subcommand: ${subcommand}`;
  }
}

function jumpAdd(args: string[], fileSystem: CustomFileSystem) {
  if (args.length < 1) {
    return "Usage: jump add <name> [-p <path>]";
  }

  const name = args[0];
  const pathIndex = args.indexOf("-p");
  let path = fileSystem.currentPath;

  if (pathIndex !== -1 && args.length > pathIndex + 1) {
    path = args[pathIndex + 1];
  }

  jumps[name] = path;
  return `Added jump '${name}' pointing to '${path}'`;
}

function jumpTo(args: string[], fileSystem: CustomFileSystem) {
  if (args.length < 1) {
    return "Usage: jump to <name> [-i]";
  }

  const name = args[0];
  const inplace = args.includes("-i");

  if (!jumps[name]) {
    return `No jump found for '${name}'`;
  }

  fileSystem.currentPath = jumps[name];
  return inplace
    ? `Changed directory to ${jumps[name]}`
    : `Opening ${jumps[name]} in VS Code...`;
}

function jumpList() {
  if (Object.keys(jumps).length === 0) {
    return "No jumps have been added. Use 'jump add <name>' to add one.";
  }

  return Object.entries(jumps)
    .map(([name, path]) => `${name} -> ${path}`)
    .join("\n");
}

function jumpRemove(args: string[]) {
  if (args.includes("--all")) {
    Object.keys(jumps).forEach((key) => delete jumps[key]);
    return "Removed all jumps.";
  }
  if (args.length < 1) {
    return "Usage: jump rm <name> or jump rm --all";
  }

  const name = args[0];
  if (!jumps[name]) {
    return `No jump found for '${name}'`;
  }

  delete jumps[name];
  return `Removed jump '${name}'.`;
}

function handleMkdirCommand(args: string[], fileSystem: CustomFileSystem) {
  if (args.length === 0 || args[0].trim() === "") {
    return "No directory name provided.";
  }

  const newDirName = args[0];
  let newPath = fileSystem.currentPath;

  // Ensure 'files' cannot be used as a directory name
  if (newDirName === "files") {
    return "'files' cannot be used as a directory name.";
  }

  // Handle absolute paths
  if (newDirName.startsWith("/")) {
    newPath = newDirName;
  } else {
    newPath += (newPath === "/" ? "" : "/") + newDirName;
  }

  // Check if directory already exists
  if (fileSystem.directories[newPath]) {
    return `Directory '${newDirName}' already exists.`;
  }

  // Create the new directory
  fileSystem.directories[newPath] = [];

  // Add the new directory to the current directory's listing
  fileSystem.directories[fileSystem.currentPath].push(newDirName);

  return `Directory '${newDirName}' created successfully.`;
}

function handleTouchCommand(args: string[], fileSystem: CustomFileSystem) {
  if (args.length === 0 || args[0].trim() === "") {
    return "No file name provided.";
  }

  const newFileName = args[0];
  const currentDirPath = fileSystem.currentPath;

  // Ensure files are not named 'directories'
  if (newFileName === "directories") {
    return "'directories' cannot be used as a file name.";
  }

  // Check if file already exists in the directory listing
  if (fileSystem.directories[currentDirPath].includes(newFileName)) {
    return `File '${newFileName}' already exists.`;
  }

  // Add the new file to the current directory's listing
  fileSystem.directories[currentDirPath].push(newFileName);

  return `File '${newFileName}' created successfully.`;
}

function handleLsCommand(args: string[], fileSystem: CustomFileSystem): string {
  console.log("Current Path:", fileSystem.currentPath);
  console.log(
    "Directory Contents:",
    fileSystem.directories[fileSystem.currentPath],
  );

  const contents = fileSystem.directories[fileSystem.currentPath] || [];
  return contents.join("\n");
}

function handleCdCommand(args: string[], fileSystem: CustomFileSystem): string {
  if (args.length === 0 || args[0].trim() === "") {
    return "No argument given to cd";
  }

  const pathParts = args[0].split("/").filter((part) => part !== "");
  let tempPath = fileSystem.currentPath;

  if (args[0] == "..") {
    if (tempPath === "/") {
      return "Already at the root directory.";
    }
    fileSystem.currentPath = tempPath.substring(0, tempPath.lastIndexOf("/"));
    return fileSystem.currentPath;
  }

  // Handle absolute paths
  if (args[0].startsWith("/")) {
    tempPath = "";
  }

  for (const part of pathParts) {
    tempPath += (tempPath === "" ? "/" : "/") + part;
    if (!fileSystem.directories[tempPath]) {
      return "Directory not found";
    }
  }

  // Update currentPath only if all parts are valid
  fileSystem.currentPath = tempPath;
  return tempPath;
}

// Generate dynamic help message based on registered commands
function handleHelpCommand(): string {
  const helpLines = ["Available commands:"];
  for (const [cmd, { description, aliases }] of Object.entries(commands)) {
    const aliasStr = aliases ? ` (aliases: ${aliases.join(", ")})` : "";
    helpLines.push(`${cmd.padEnd(10)} - ${description}${aliasStr}`);
  }
  return helpLines.join("\n");
}

// Suggest closest command if not found
function suggestCommand(input: string): string | null {
  const commandNames = Object.keys(commands);
  let closestMatch: string | null = null;
  let shortestDistance = Infinity;

  for (const command of commandNames) {
    const distance = levenshteinDistance(input, command);
    if (distance < shortestDistance && distance <= 3) {
      // Allow minor typos
      shortestDistance = distance;
      closestMatch = command;
    }
  }

  return closestMatch;
}

// Levenshtein Distance for typo detection
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array.from({ length: a.length + 1 }, () =>
    Array(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost, // substitution
      );
    }
  }
  return matrix[a.length][b.length];
}

// Main command execution function
export async function executeCommand(
  command: string,
  fileSystem: CustomFileSystem,
): Promise<string> {
  const [cmd, ...args] = command.trim().split(/\s+/);
  if (!cmd) return "";

  // Find matching command or alias
  const matchedCommand =
    Object.entries(commands).find(
      ([name, { aliases }]) =>
        name === cmd.toLowerCase() ||
        (aliases && aliases.includes(cmd.toLowerCase())),
    ) || null;

  if (matchedCommand) {
    const [, { handler }] = matchedCommand;
    try {
      return await handler(args, fileSystem);
    } catch (error) {
      return `Error executing command: ${(error as Error).message}`;
    }
  } else {
    const suggestion = suggestCommand(cmd);
    return suggestion
      ? `Command not found: ${cmd}\nDid you mean '${suggestion}'?\nType 'help' to see available commands.`
      : `Command not found: ${cmd}\nType 'help' to see available commands.`;
  }
}
