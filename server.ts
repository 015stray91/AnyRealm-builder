import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { WebSocketServer, WebSocket } from "ws";

dotenv.config();

const app = express();
app.use(express.json({ limit: "20mb" }));

const PORT = 3000;

// Initialize Gemini SDK with named parameters & safe error margins.
let ai: GoogleGenAI | null = null;
try {
  if (process.env.GEMINI_API_KEY) {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  } else {
    console.warn("GEMINI_API_KEY is not defined in the environment.");
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI:", error);
}

// ----------------- Real-time Workspace State in Memory -----------------
let activeProjectTemplateId = "react-dashboard";

// Termux Mobile Emulator Simulator State variables
let termuxPackages = ["bash", "coreutils", "termux-exec", "apt", "termux-api", "shizuku-api"];
let termuxRoot = false;
let termuxStorage = false;
let termuxTheme = "dracula";
let termuxFont = "JetBrains Mono";
let termuxShizukuActive = true;
let termuxRishActive = false;

let globalFiles: any[] = [
  {
    id: "index-html",
    path: "index.html",
    type: "file" as const,
    content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Zenith Cloud Analytics</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: 'Inter', sans-serif; }
    </style>
</head>
<body class="bg-[#0b0f14] text-gray-100 min-h-screen">
    <div id="app"></div>
    <script src="app.js"></script>
</body>
</html>`
  },
  {
    id: "app-js",
    path: "app.js",
    type: "file" as const,
    content: `// Zenith Cloud Operations Engine
const state = {
  users: 24890,
  growth: 14.8,
  revenue: 124500,
  activeNow: 412,
  metrics: [
    { label: "Mon", value: 3200 },
    { label: "Tue", value: 4100 },
    { label: "Wed", value: 3900 },
    { label: "Thu", value: 5200 },
    { label: "Fri", value: 6500 },
    { label: "Sat", value: 4800 },
    { label: "Sun", value: 5900 }
  ]
};

function renderDashboard() {
  const container = document.getElementById('app');
  if (!container) return;

  container.innerHTML = \`
    <div class="max-w-4xl mx-auto px-6 py-8">
      <div class="flex items-center justify-between mb-8 pb-6 border-b border-gray-800">
        <div>
          <h1 class="text-2xl font-semibold text-white tracking-tight flex items-center gap-2">
            <span class="text-cyan-400 font-black">⚙</span> Zenith Cloud Analytics
          </h1>
          <p class="text-sm text-gray-400 mt-1">Real-time collaborative analytics cluster.</p>
        </div>
        <div>
          <span class="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span> Live Node
          </span>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-6 mb-8">
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Users</span>
          <h3 class="text-3xl font-bold text-white">\${state.users.toLocaleString()}</h3>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Revenue</span>
          <h3 class="text-3xl font-bold text-white">$\${state.revenue.toLocaleString()}</h3>
        </div>
        <div class="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <span class="text-xs font-medium text-gray-400 uppercase tracking-wider block mb-2">Active Sessions</span>
          <h3 class="text-3xl font-bold text-cyan-400 animate-pulse">\${state.activeNow}</h3>
        </div>
      </div>

      <div class="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <h3 class="text-base font-semibold text-white mb-6">Traffic (Past Week)</h3>
        <div class="flex items-end gap-3 h-48 pt-4">
          \${state.metrics.map(d => {
            const heightPercent = Math.round((d.value / 7000) * 100);
            return \`
              <div class="flex-1 flex flex-col items-center gap-2">
                <div class="w-full bg-[#00D1FF]/20 hover:bg-[#00D1FF]/30 rounded-md transition-all flex flex-col justify-end" style="height: \${heightPercent}%">
                  <div class="w-full bg-gradient-to-t from-[#0055FF] to-[#00D1FF] rounded-md min-h-[4px]" style="height: 50%"></div>
                </div>
                <span class="text-xs text-gray-500 font-mono">\${d.label}</span>
              </div>
            \`;
          }).join('')}
        </div>
      </div>
    </div>
  \`;
}

window.addEventListener('DOMContentLoaded', renderDashboard);
renderDashboard();`
  }
];

// Instantiating collaborative Git database in active memory
let gitState = {
  isInitialized: false,
  currentBranch: "main",
  branches: ["main"],
  commits: [] as any[],
  staged: {} as { [path: string]: string },
  stash: [] as any[],
  remotes: ["origin  https://github.com/windsurf/collaborative-app.git"]
};

// System terminal stream history
let terminalCommands: any[] = [
  {
    id: "init",
    input: "system --status",
    output: "Windsurf Engine version 1.4.2 [ACTIVE]\nSync network initialized over collaborative Secure WebSockets.\nReady.",
    directory: "~",
    timestamp: new Date().toLocaleTimeString()
  }
];

// Presences list of connected contributors
interface CollaboratorUser {
  id: string;
  name: string;
  color: string;
  cursor?: {
    fileId: string;
    line: number;
    ch: number;
  };
}

let activeUsers: { [wsId: string]: CollaboratorUser } = {};

// Helper: Names Generator for Realtime Guests
const FIRST_NAMES = ["Space", "Quantum", "Nebula", "Cyber", "Delta", "Pixel", "Cosmic", "Async", "Apex", "Nova", "Git"];
const LAST_NAMES = ["Architect", "Wizard", "Scripter", "Coder", "Dev", "Explorer", "Hacker", "Pilot", "Naut", "Operator"];
const COLORS = ["#00D1FF", "#A3E635", "#F43F5E", "#FB923C", "#38BDF8", "#EC4899", "#8B5CF6", "#10B981", "#EAB308", "#F472B6"];

function generateRandomUser(id: string): CollaboratorUser {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  const color = COLORS[Math.floor(Math.random() * COLORS.length)];
  return {
    id,
    name: `${first} ${last}`,
    color
  };
}

// Cascade/Gemini proxy endpoint keeps fully functional
app.post("/api/cascade/chat", async (req, res) => {
  try {
    const { messages, currentFile, mode } = req.body;

    if (!ai) {
      return res.status(503).json({
        error: "Gemini API client is not configured on the server. Please check your GEMINI_API_KEY secret.",
      });
    }

    // Format the current workspace state so Gemini understands what's available
    const workspaceRepresentation = globalFiles
      .map((f: any) => `### FILE: ${f.path}\n\`\`\`${f.path.split(".").pop() || ""}\n${f.content}\n\`\`\``)
      .join("\n\n");

    const recentCommands = terminalCommands.length > 0
      ? terminalCommands.map((cmd: any) => `$ ${cmd.input}\n${cmd.output}`).slice(-5).join("\n")
      : "No command history yet.";

    const systemInstruction = `You are Cascade, the advanced AI coding agent integrated into the Windsurf IDE (developed by Codeium).
Your goal is to help developers create, edit, debug, and understand projects within a collaborative code space.

You operate in two modes:
1. "chat" (Ask): Answering questions, conceptual explanations, reviews, formatting, or code walk-throughs.
2. "agent" (Write): Proactively coding, proposing additions, making edits, creating directories, and verifying via terminal.

Current State of virtual workspace:
${workspaceRepresentation}

Current open file: ${currentFile || "None"}
Recent Terminal Commands & Outputs:
${recentCommands}

Current Mode: ${mode || "agent"}

You MUST return a JSON response adhering to the exact schema.
If in "agent" mode, prefer suggesting edits or creating files to help fulfill the user's instructions.
- To create a new file or completely overwrite a file, suggest a "create_file" action.
- To modify specific lines of an existing file, use "edit_file". Ensure "targetLines" contains the EXACT text that already exists in that file, and "replacementLines" contains the new version.
- To suggest running a terminal command to test, run, or verify, use "run_command" (e.g. "npm run test", "python app.py", "git init", "node index.js").
- To show a web preview inside the IDE, use "show_preview".
- Remember that you are simulating a fully functional virtual environment inside a web sandbox. The workspace files can be parsed dynamically, and when a user runs the suggested terminal commands, the web IDE simulator will output custom terminal streams!

Keep explanations highly professional, concise, and focused on visual styling, structure, and execution. No unnecessary preamble.`;

    // Construct request to Gemini
    const lastUserMessage = messages[messages.length - 1];
    
    // Provide a chat context. We will pack previous conversation context into the prompt
    const chatHistory = messages
      .slice(0, -1)
      .map((m: any) => `${m.role === "user" ? "Developer" : "Cascade"}: ${m.text || m.content}`)
      .join("\n");

    const prompt = `Here is the conversation history:\n${chatHistory}\n\nDeveloper's prompt: ${lastUserMessage.text || lastUserMessage.content}\n\nAnalyze the request based on the workspace, then respond with a JSON object.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["thought", "explanation"],
          properties: {
            thought: {
              type: Type.STRING,
              description: "Internal thinking process of Cascade, describing what changes are required and why.",
            },
            explanation: {
              type: Type.STRING,
              description: "Conversational text or Markdown explanation to present to the developer in the chat.",
            },
            actions: {
              type: Type.ARRAY,
              description: "Optional list of IDE tools that Cascade wants to execute to fulfill the user request.",
              items: {
                type: Type.OBJECT,
                required: ["type", "description"],
                properties: {
                  type: {
                    type: Type.STRING,
                    description: "The action to take matching ('create_file', 'edit_file', 'run_command', 'show_preview')",
                  },
                  path: {
                    type: Type.STRING,
                    description: "Target file path (required for 'create_file' or 'edit_file').",
                  },
                  content: {
                    type: Type.STRING,
                    description: "Entire content of the file for 'create_file'.",
                  },
                  targetLines: {
                    type: Type.STRING,
                    description: "EXACT lines within the existing file to match for replacements in 'edit_file'. Ensure whitespace and indenting match 100%.",
                  },
                  replacementLines: {
                    type: Type.STRING,
                    description: "Replacement lines of code to substitute for the target lines in 'edit_file'.",
                  },
                  command: {
                    type: Type.STRING,
                    description: "The term command to run for 'run_command'.",
                  },
                  description: {
                    type: Type.STRING,
                    description: "Short human-readable description shown in the tool interface.",
                  },
                },
              },
            },
          },
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    return res.json(parsedResponse);
  } catch (err: any) {
    console.error("API Error in /api/cascade/chat:", err);
    return res.status(500).json({
      error: err.message || "An error occurred with Gemini Cascade.",
    });
  }
});

// Serve Vite dev server static files or production assets
async function startServer() {
  let viteMiddlewares: any = null;
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    viteMiddlewares = vite.middlewares;
    app.use(viteMiddlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });

  // Attach WebSocket connection server
  const wss = new WebSocketServer({ server: httpServer });

  // Broadcasting helper
  function broadcast(payload: any, skipSenderWs?: WebSocket) {
    const rawMsg = JSON.stringify(payload);
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== skipSenderWs) {
        client.send(rawMsg);
      }
    });
  }

  wss.on("connection", (ws) => {
    const clientId = Math.random().toString(36).substring(2, 10);
    const guestUser = generateRandomUser(clientId);
    activeUsers[clientId] = guestUser;

    // Send initial join configuration stats
    ws.send(JSON.stringify({
      type: "sync-state",
      clientInfo: guestUser,
      workspace: {
        templateId: activeProjectTemplateId,
        files: globalFiles,
        gitState,
        terminalCommands,
        activeUsers
      }
    }));

    // Broadcast registration join alert
    broadcast({
      type: "user-joined",
      user: guestUser
    }, ws);

    ws.on("message", (msg) => {
      try {
        const payload = JSON.parse(msg.toString());
        
        switch (payload.type) {
          case "cursor-move": {
            if (activeUsers[clientId]) {
              activeUsers[clientId].cursor = payload.cursor;
              broadcast({
                type: "cursor-updated",
                clientId,
                cursor: payload.cursor,
                user: activeUsers[clientId]
              }, ws);
            }
            break;
          }

          case "update-file": {
            const { path: filePath, content } = payload;
            const file = globalFiles.find(f => f.path === filePath);
            if (file) {
              file.content = content;
              broadcast({
                type: "file-updated",
                path: filePath,
                content,
                senderId: clientId
              }, ws);
            }
            break;
          }

          case "add-file": {
            const { path: filePath, content } = payload;
            const existingIdx = globalFiles.findIndex(f => f.path === filePath);
            const newFile = {
              id: filePath.replace(/\//g, "-").replace(/\./g, "-"),
              path: filePath,
              content: content || "",
              type: "file" as const
            };

            if (existingIdx !== -1) {
              globalFiles[existingIdx] = newFile;
            } else {
              globalFiles.push(newFile);
            }

            broadcast({
              type: "file-added",
              file: newFile,
              senderId: clientId
            });
            break;
          }

          case "delete-file": {
            const { path: filePath } = payload;
            globalFiles = globalFiles.filter(f => f.path !== filePath);
            broadcast({
              type: "file-deleted",
              path: filePath,
              senderId: clientId
            });
            break;
          }

          case "change-template": {
            const { templateId, files } = payload;
            activeProjectTemplateId = templateId;
            globalFiles = files;
            // Clear current staged git logs
            gitState = {
              isInitialized: false,
              currentBranch: "main",
              branches: ["main"],
              commits: [] as any[],
              staged: {} as { [path: string]: string },
              stash: [] as any[],
              remotes: ["origin  https://github.com/windsurf/collaborative-app.git"]
            };
            terminalCommands = [
              {
                id: Math.random().toString(),
                input: `system --load-template ${templateId}`,
                output: `Template changed to ${templateId} loaded successfully.\nSystem synced over websockets.\nRe-initializing virtual environment...`,
                directory: "~",
                timestamp: new Date().toLocaleTimeString()
              }
            ];

            broadcast({
              type: "template-changed",
              templateId,
              files: globalFiles,
              gitState,
              terminalCommands
            });
            break;
          }

          case "terminal-command": {
            const { input } = payload;
            // Parse and simulate beautiful Command Line outputs in Virtual Shell environment
            const output = executeVirtualCommand(input);
            const userString = termuxRishActive ? "shizuku@android" : (termuxRoot ? "root@termux" : "termux");
            const promptSymbol = termuxRishActive ? "adb-sh$" : (termuxRoot ? "#" : "$");
            const newCmd = {
              id: Math.random().toString(36).substring(5),
              input,
              output,
              directory: termuxRishActive 
                ? `[aarch64 /sdk/33]:` 
                : `${userString}:${gitState.isInitialized ? `~/${activeProjectTemplateId} (${gitState.currentBranch})` : `~/${activeProjectTemplateId}`} ${promptSymbol}`,
              timestamp: new Date().toLocaleTimeString()
            };
            terminalCommands.push(newCmd);

            broadcast({
              type: "terminal-result",
              command: newCmd,
              gitState, // Send back potentially updated virtual GIT properties
              termuxPackages,
              termuxRoot,
              termuxStorage,
              termuxTheme,
              termuxFont,
              termuxShizukuActive,
              termuxRishActive
            });
            break;
          }

          case "sync-git": {
            gitState = payload.gitState;
            broadcast({
              type: "git-updated",
              gitState
            }, ws);
            break;
          }
        }
      } catch (err) {
        console.error("WS error parsing message:", err);
      }
    });

    ws.on("close", () => {
      delete activeUsers[clientId];
      broadcast({
        type: "user-left",
        clientId
      });
    });
  });
}

// ----------------- Collaborative Virtual CLI Simulator -----------------
function executeVirtualCommand(input: string): string {
  const parts = input.trim().split(/\s+/);
  const cmd = parts[0].toLowerCase();

  switch (cmd) {
    case "clear":
      return "CLEAR_SIGNAL";

    case "help":
      return `Windsurf Virtual Shell Platform Instructions:
  help                             Show this tool menu.
  git init                         Initialize visual collaborative Git repository on current branch.
  git status                       View staged, unstaged tracked, and conflict files.
  git add <file> or git add .      Stage changes to tracked snapshots.
  git commit -m "<message>"      Commit staged changes.
  git branch                       List local branches.
  git branch <branch-name>         Create new branch.
  git checkout <branch-name>       Switch branches (reverts and updates files automatically!).
  git merge <branch-name>          Integrates branch modifications. Overlaps generate real conflicts!
  git push / git pull              Push/pull snapshots from virtual server remote.
  git stash / git stash pop        Stash your current unstaged file values.
  npm run build                    Compiles file template into interactive live preview engine.
  node app.js                      Executes Node app in virtual process sandbox.
  ls                               List files in the current active folder workspace.

📲 Advanced Android Emulation Shells (Termux):
  su                               Toggle simulated superuser root privilege level
  shizuku                          Toggle or query status of Shizuku Android Binder Services
  rish                             Link and boot local Shizuku safe ADB shell interface env
  sui                              Interact with Sui Magisk/KernalSU superuser controls`;

    case "ls": {
      return globalFiles.map(f => `${f.type === "directory" ? "📁" : "📄"} ${f.path.padEnd(25)}  [Size: ${f.content.length} B]`).join("\n") || "Workspace empty.";
    }

    case "node": {
      const target = parts[1];
      if (!target) return "Error: Specify target javascript file to execute (e.g., node app.js)";
      const matched = globalFiles.find(f => f.path === target);
      if (!matched) return `Error: File '${target}' not found. Try running 'ls' first.`;
      
      return `[Executing virtual node process: node ${target}]\n---------------------------------------\nZenith Cloud Operations Process Initialized.\nSystem: ${matched.content.length} bytes loaded.\nEnvironment: Dev Context\nStatus: Execution success without warnings.\n---------------------------------------`;
    }

    case "npm": {
      const sub = parts[1]?.toLowerCase();
      if (sub === "run") {
        const action = parts[2]?.toLowerCase();
        if (action === "build") {
          return `> windsurf-workspace@1.4.2 build\n> build:production --trace-warnings\n\n🎨 Initializing webpack/vite compilation framework...\n✔ Checking component imports and Tailwind parsing\n✔ Successfully compiled ${globalFiles.length} modules\n✔ Bundled application in 421ms\n✨ Status: Production build fully deployed. Launching Dynamic Simulated Server!`;
        }
        return `Error: Unknown script '${action || ""}' specified. Try 'npm run build'`;
      }
      return "Error: Unsupported npm instruction. Try 'npm run build'";
    }

    case "git": {
      const action = parts[1]?.toLowerCase();
      if (!action) return "Error: No git command specified. Type 'help' for instructions.";

      if (action === "init") {
        if (gitState.isInitialized) {
          return "Re-initialized existing Git repository in virtual workspace.";
        }
        gitState.isInitialized = true;
        gitState.currentBranch = "main";
        gitState.branches = ["main"];
        gitState.commits = [];
        gitState.staged = {};
        
        // Make an initial commit automatically with the current files
        const initialSnap: { [path: string]: string } = {};
        globalFiles.forEach(f => {
          initialSnap[f.path] = f.content;
        });

        const initialCommit = {
          hash: Math.random().toString(36).substring(2, 9),
          author: "Windsurf Collaborative Team",
          message: "Initial commit (Automatic Setup)",
          timestamp: new Date().toLocaleString(),
          filesSnapshot: initialSnap,
          meta: { branch: "main" }
        };
        gitState.commits.push(initialCommit);

        return "Initialized empty Git repository in virtual workspace.\nBranch 'main' created.\nCreated initial tracking commit capturing current files snapshot.";
      }

      if (!gitState.isInitialized) {
        return "fatal: not a git repository (run 'git init' first)";
      }

      switch (action) {
        case "status": {
          const lines: string[] = [];
          lines.push(`On branch ${gitState.currentBranch}`);
          lines.push("Your branch is up to date with 'origin/main'.");
          lines.push("");

          // Calculate changes
          const stagedPaths = Object.keys(gitState.staged);
          const lastCommit = getLatestCommit(gitState.currentBranch);
          const baseSnapshot = lastCommit ? lastCommit.filesSnapshot : {};

          const modifiedButUnstaged: string[] = [];
          const untracked: string[] = [];

          globalFiles.forEach(f => {
            const hasSnap = f.path in baseSnapshot;
            if (!hasSnap) {
              if (!stagedPaths.includes(f.path)) {
                untracked.push(f.path);
              }
            } else if (baseSnapshot[f.path] !== f.content) {
              if (!stagedPaths.includes(f.path)) {
                modifiedButUnstaged.push(f.path);
              }
            }
          });

          if (stagedPaths.length > 0) {
            lines.push("Changes to be committed:");
            lines.push("  (use \"git restore --staged <file>...\" to unstage)");
            stagedPaths.forEach(p => {
              lines.push(`\tgreen:   staged modified: ${p}`);
            });
            lines.push("");
          }

          if (modifiedButUnstaged.length > 0) {
            lines.push("Changes not staged for commit:");
            lines.push("  (use \"git add <file>...\" to update what will be committed)");
            modifiedButUnstaged.forEach(p => {
              lines.push(`\tred:      modified: ${p}`);
            });
            lines.push("");
          }

          if (untracked.length > 0) {
            lines.push("Untracked files:");
            lines.push("  (use \"git add <file>...\" to include in what will be committed)");
            untracked.forEach(p => {
              lines.push(`\tred:      untracked: ${p}`);
            });
            lines.push("");
          }

          if (stagedPaths.length === 0 && modifiedButUnstaged.length === 0 && untracked.length === 0) {
            lines.push("nothing to commit, working tree clean");
          }

          return lines.join("\n");
        }

        case "add": {
          const fileArg = parts[2];
          if (!fileArg) return "Nothing specified, nothing added.\nDid you mean 'git add .' ?";

          const lastCommit = getLatestCommit(gitState.currentBranch);
          const baseSnapshot = lastCommit ? lastCommit.filesSnapshot : {};

          if (fileArg === "." || fileArg === "*") {
            // Stage all files that represent modifications of existing snapshots
            globalFiles.forEach(f => {
              gitState.staged[f.path] = f.content;
            });
            return `Staged ${globalFiles.length} files successfully for tracking.`;
          } else {
            const matched = globalFiles.find(f => f.path === fileArg);
            if (!matched) return `fatal: pathspec '${fileArg}' did not match any files`;
            gitState.staged[matched.path] = matched.content;
            return `Staged modifications for '${matched.path}' successfully.`;
          }
        }

        case "commit": {
          const mIdx = parts.indexOf("-m");
          if (mIdx === -1 || !parts[mIdx + 1]) {
            return "error: switch `m` requires a value\nusage: git commit -m \"your commit message\"";
          }
          
          const message = parts.slice(mIdx + 1).join(" ").replace(/["']/g, "");
          const stagedKeys = Object.keys(gitState.staged);
          if (stagedKeys.length === 0) {
            return "On branch " + gitState.currentBranch + "\nnothing to commit, working tree clean (stage changes first using 'git add .')";
          }

          // Build snapshot: start with latest commit snapshot and apply modifications from files
          const lastCommit = getLatestCommit(gitState.currentBranch);
          const defaultSnap = lastCommit ? { ...lastCommit.filesSnapshot } : {};
          
          // Apply staged changes
          globalFiles.forEach(f => {
            if (f.path in gitState.staged) {
              defaultSnap[f.path] = gitState.staged[f.path];
            }
          });

          const newCommit = {
            hash: Math.random().toString(36).substring(2, 9),
            author: "Anonymous Git Contributor",
            message,
            timestamp: new Date().toLocaleTimeString() + " " + new Date().toLocaleDateString(),
            filesSnapshot: defaultSnap,
            meta: {
              branch: gitState.currentBranch,
              parent: lastCommit ? lastCommit.hash : undefined
            }
          };

          gitState.commits.push(newCommit);
          gitState.staged = {}; // Flush staged area

          return `[${gitState.currentBranch} ${newCommit.hash}] ${message}\n ${stagedKeys.length} files changed, staging successfully flushed.`;
        }

        case "branch": {
          const branchArg = parts[2];
          if (!branchArg) {
            // List branches
            return gitState.branches.map(b => b === gitState.currentBranch ? `* ${b}` : `  ${b}`).join("\n");
          }

          if (gitState.branches.includes(branchArg)) {
            return `fatal: A branch named '${branchArg}' already exists.`;
          }

          gitState.branches.push(branchArg);
          return `Branch '${branchArg}' spawned stemming from HEAD of '${gitState.currentBranch}'.`;
        }

        case "checkout": {
          const branchArg = parts[2];
          if (!branchArg) return "Error: Branch destination not specified (e.g., git checkout <branch-name>)";

          if (branchArg === "-b" && parts[3]) {
            const newBranch = parts[3];
            if (gitState.branches.includes(newBranch)) {
              return `fatal: A branch named '${newBranch}' already exists.`;
            }
            gitState.branches.push(newBranch);
            gitState.currentBranch = newBranch;
            return `Switched to a new branch '${newBranch}'`;
          }

          if (!gitState.branches.includes(branchArg)) {
            return `error: pathspec '${branchArg}' did not match any branch known to git`;
          }

          // SWAP ACTIVE FILE CONTENTS TO CHOSEN BRANCH'S LATEST SNAPSHOT!
          gitState.currentBranch = branchArg;
          const targetCommit = getLatestCommit(branchArg);
          if (targetCommit) {
            const snapshot = targetCommit.filesSnapshot;
            // Overwrite memory file array properties
            Object.keys(snapshot).forEach(filepath => {
              const matched = globalFiles.find(f => f.path === filepath);
              if (matched) {
                matched.content = snapshot[filepath];
              } else {
                globalFiles.push({
                  id: filepath.replace(/\//g, "-").replace(/\./g, "-"),
                  path: filepath,
                  type: "file",
                  content: snapshot[filepath]
                });
              }
            });
            return `Switched to branch '${branchArg}'\nVirtual filesystem updated dynamically to this branch's HEAD commit: [Commit Hash: ${targetCommit.hash}]`;
          }

          return `Switched to branch '${branchArg}'\n[Warning: No commits found, working environment state retained]`;
        }

        case "merge": {
          const branchArg = parts[2];
          if (!branchArg) return "Error: Target merge source branch not specified (e.g., git merge <branch-name>)";

          if (branchArg === gitState.currentBranch) {
            return "Already up to date. Cannot merge self.";
          }

          if (!gitState.branches.includes(branchArg)) {
            return `fatal: '${branchArg}' branch not found.`;
          }

          const currentHEAD = getLatestCommit(gitState.currentBranch);
          const mergeHEAD = getLatestCommit(branchArg);

          if (!mergeHEAD) {
            return `No commits on target branch '${branchArg}' to merge.`;
          }

          if (!currentHEAD) {
            gitState.commits.push({
              hash: Math.random().toString(36).substring(2, 9),
              author: "Merge Helper",
              message: `Merge branch '${branchArg}' into empty branch`,
              timestamp: new Date().toLocaleString(),
              filesSnapshot: { ...mergeHEAD.filesSnapshot },
              meta: { branch: gitState.currentBranch }
            });
            // Update workspace content
            Object.keys(mergeHEAD.filesSnapshot).forEach(pt => {
              const rootFile = globalFiles.find(f => f.path === pt);
              if (rootFile) rootFile.content = mergeHEAD.filesSnapshot[pt];
            });
            return `Fast-forward: Integrated all files successfully.`;
          }

          // Merge analysis! Look for content changes on both sides.
          let hasConflict = false;
          const mergedSnapshot = { ...currentHEAD.filesSnapshot };
          const loggedConfFiles: string[] = [];

          Object.keys(mergeHEAD.filesSnapshot).forEach(pathKey => {
            const destinationContent = currentHEAD.filesSnapshot[pathKey];
            const sourceContent = mergeHEAD.filesSnapshot[pathKey];

            if (destinationContent !== undefined && sourceContent !== undefined && destinationContent !== sourceContent) {
              // CONFLICT TRIGGERED! Insert actual Git style merge boundaries so users can resolve online!
              hasConflict = true;
              loggedConfFiles.push(pathKey);

              const conflictMarkerText = `<<<<<<< HEAD (Current Branch: ${gitState.currentBranch})\n${destinationContent}\n=======\n${sourceContent}\n>>>>>>> MERGE_SRC (Incoming Branch: ${branchArg})`;
              
              mergedSnapshot[pathKey] = conflictMarkerText;

              // Overwrite in-memory file content
              const matchedF = globalFiles.find(f => f.path === pathKey);
              if (matchedF) {
                matchedF.content = conflictMarkerText;
              }
            } else {
              mergedSnapshot[pathKey] = sourceContent;
            }
          });

          if (hasConflict) {
            return `❗ AUTOMATIC MERGE CONFLICT DETECTED IN:\n${loggedConfFiles.map(f => `  ->  ${f}`).join("\n")}\n\nUnmerged paths exist in your files.\nConflict tags injected successfully directly inside standard editor fields.\nResolving instruction: Review changes, strip Git tags and execute 'git add .' and 'git commit -m "Merge branch resolved"'.`;
          }

          // Otherwise, clean merge commit
          const cleanMergeCommit = {
            hash: Math.random().toString(36).substring(2, 9),
            author: "Automated Git Merger",
            message: `Merge branch '${branchArg}' into '${gitState.currentBranch}'`,
            timestamp: new Date().toLocaleString(),
            filesSnapshot: mergedSnapshot,
            meta: { branch: gitState.currentBranch }
          };

          gitState.commits.push(cleanMergeCommit);
          // Apply changes to workspace
          Object.keys(mergedSnapshot).forEach(pt => {
            const fl = globalFiles.find(f => f.path === pt);
            if (fl) fl.content = mergedSnapshot[pt];
          });

          return `Updating commit index... [Merge complete!]\nBranch '${branchArg}' integrated into '${gitState.currentBranch}' successfully without conflicts.\n HEAD is now pointing to commit ${cleanMergeCommit.hash}`;
        }

        case "push": {
          return `Connecting to cloud git service remote...\n🔐 Handshaking authentication...\n✔ Writing git pack file...\n📦 Uploaded [HEAD -> refs/heads/${gitState.currentBranch}] to upstream repository.\nSynchronized successfully! All contributors updated.`;
        }

        case "pull": {
          return `Fetching latest updates from remote origin server...\nAuthorized. Branch ${gitState.currentBranch} is already matching origin heads.\nNo downstream modifications fetched.`;
        }

        case "stash": {
          const subcommand = parts[2]?.toLowerCase();
          if (subcommand === "pop") {
            if (gitState.stash.length === 0) {
              return "No stashed values index found to re-apply.";
            }
            const popped = gitState.stash.pop();
            Object.keys(popped.files).forEach(pt => {
              const fle = globalFiles.find(f => f.path === pt);
              if (fle) fle.content = popped.files[pt];
            });
            return `Dropped refs/stash@{0} - Applied stashed changes: "${popped.msg}"`;
          }

          // Create standard stash
          const cachedFiles: { [path: string]: string } = {};
          globalFiles.forEach(f => {
            cachedFiles[f.path] = f.content;
          });
          gitState.stash.push({
            id: `stash-${Math.random()}`,
            msg: parts.slice(2).join(" ") || `Stashed changes on branch ${gitState.currentBranch}`,
            files: cachedFiles
          });
          return `Saved working directory state to refs/stash@{${gitState.stash.length - 1}}\nReady.`;
        }

        case "log": {
          if (gitState.commits.length === 0) {
            return "No commit histories found.";
          }
          return gitState.commits
            .slice()
            .reverse()
            .map(c => `green:commit ${c.hash}\nAuthor: ${c.author}\nDate:   ${c.timestamp}\n\n    ${c.message}\n`)
            .join("\n");
        }

        default:
          return `Unknown git instruction '${action}'. Try 'git status', 'git log', 'git add', 'git commit', or 'help'`;
      }
    }

    case "su": {
      termuxRoot = !termuxRoot;
      return termuxRoot 
        ? "Access granted. Simulated root permissions loaded.\nroot@termux:~#" 
        : "Returned to standard client level permissions.\nlocalhost:~$";
    }

    case "pkg":
    case "apt": {
      const subcommand = parts[1]?.toLowerCase();
      if (!subcommand) {
        return "apt/pkg Package Manager Suite:\n  pkg list-installed\n  pkg install <package>\n  pkg uninstall <package>";
      }
      if (subcommand === "list-installed" || subcommand === "list") {
        return `Installed packages across simulated Android repositories:\n${termuxPackages.map(p => ` - ${p}/stable,now 1.25.0 [installed]`).join("\n")}`;
      }
      if (subcommand === "install") {
        const pkgName = parts[2]?.toLowerCase();
        if (!pkgName) return "fatal: Specify package name to build/install (e.g. pkg install python)";
        if (termuxPackages.includes(pkgName)) {
          return `Package ${pkgName} is already satisfied inside stable repository path.`;
        }
        termuxPackages.push(pkgName);
        return `Retrieving repository updates...\nUnpacking package: aarch64/${pkgName}...\nSetting up ${pkgName} (v1.2.0-stable)...\n✔ Installation completed successfully!`;
      }
      if (subcommand === "uninstall" || subcommand === "remove") {
        const pkgName = parts[2]?.toLowerCase();
        if (!pkgName) return "fatal: Specify package name to uninstall";
        if (!termuxPackages.includes(pkgName)) {
          return `Package ${pkgName} not found or not currently installed.`;
        }
        termuxPackages = termuxPackages.filter(p => p !== pkgName);
        return `Removing ${pkgName} packages configuration index...\nPurging file configurations...\n✔ Package successfully uninstalled.`;
      }
      return `sh: apt/pkg: option '${subcommand}' is currently unrecognized.`;
    }

    case "termux-setup-storage": {
      termuxStorage = true;
      return "Requesting Android Storage Write Access Permissions (REQUEST_CODE_WRITE_EXTERNAL_STORAGE)...\n✔ Success. Symlinked sandbox directories inside: /storage/emulated/0/DCIM /sdcard/Workspace";
    }

    case "termux-battery-status": {
      return "{\n  \"health\": \"GOOD\",\n  \"percentage\": 94,\n  \"plugged\": \"PLUGGED_AC\",\n  \"status\": \"CHARGING\",\n  \"temperature\": 29.4,\n  \"type\": \"Li-poly\"\n}";
    }

    case "termux-vibrate": {
      const waitTime = parts[1] || "300";
      return `TERMUX_API:VIBRATE:${waitTime}\n[Device Motor Engine Action]: Vibrated for ${waitTime}ms.`;
    }

    case "termux-toast": {
      const message = parts.slice(1).join(" ") || "Interactive Termux API notification Triggered!";
      return `TERMUX_API:TOAST:${message}\n[Simulated Alert Popup]: displayed: "${message}"`;
    }

    case "termux-styling": {
      const subcommand = parts[1]?.toLowerCase();
      const val = parts[2]?.toLowerCase();
      if (subcommand === "theme" && val) {
        termuxTheme = val;
        return `TERMUX_API:STYLE_THEME:${val}\nConsole visual palette applied: [${val}]`;
      }
      return "Styling utility commands:\n  termux-styling theme <dracula|monokai|solarized|nord|retro-green|cobalt|matrix>";
    }

    case "termux-info": {
      return `Upstream build info tracker:\n-------------------------------------\nApplication: Termux Android Emulation client\nEnvironment: Antigravity Node Sandbox\nShell: bash v5.2\nAPI Platform Level: 33\nPackages count: ${termuxPackages.length}\n-------------------------------------`;
    }

    case "uname": {
      const flag = parts[1];
      if (flag === "-a") {
        return "Linux localhost 5.15.0-88-generic #98-Ubuntu SMP aarch64 Android API 33";
      }
      return "Linux";
    }

    case "shizuku": {
      const subcommand = parts[1]?.toLowerCase();
      if (!subcommand || subcommand === "status") {
        if (!termuxShizukuActive) {
          return "Shizuku Manager Service Info:\n-------------------------------------------\nStatus: STOPPED\nService Port: offline\nType 'shizuku start' to reboot Shizuku daemon process.";
        }
        return `Shizuku Manager Service Info:
-------------------------------------------
Status: RUNNING (as system service via ADB port 5555)
Active Mode: ADB (Wireless Debugging authorized)
Version: v13.5.4.r1024
Binder Socket: bound (/dev/shizuku_ipc)
Authorized Apps: Termux (uid=10287)

To activate an ADB Shell, type 'rish'!`;
      }
      if (subcommand === "start") {
        termuxShizukuActive = true;
        return "Spawning Shizuku system daemon process...\nBinding IPC client to /dev/shizuku_ipc...\n✔ Shizuku service successfully started and listening on ADB port 5555.";
      }
      if (subcommand === "stop") {
        termuxShizukuActive = false;
        termuxRishActive = false;
        return "🛑 Stopping Shizuku binder daemon...\nUnbinding Termux IPC ports...\n✔ Shizuku service successfully terminated.";
      }
      return `sh: shizuku: option '${subcommand}' unrecognized.`;
    }

    case "rish": {
      if (!termuxShizukuActive) {
        return "rish: fatal: Shizuku binder service is not running. Type 'shizuku start' first.";
      }
      termuxRishActive = true;
      return `Initializing secure Shizuku 'rish' binder socket connection...
Resolving target binder descriptor: android.os.IUserService
✔ Binder token handshake completed successfully.
✔ Elevated ADB access context granted (uid=2000, shell permissions).

Welcome to Android ADB shell (aarch64 rish terminal)!
Run commands under privileged security profiles.
Type 'exit' to terminate this rish adb session.`;
    }

    case "sui": {
      const subcommand = parts[1]?.toLowerCase();
      if (!subcommand) {
        return `Sui: Privileged Superuser controller over Shizuku:
--------------------------------------------
Sui provides Magisk/KernelSU root permission compliance on modern Android levels.
Commands:
  sui request     Request Superuser permission popup
  sui status      Check Magisk/KernelSU connection table`;
      }
      if (subcommand === "request") {
        if (!termuxShizukuActive) {
          return "sui: Shizuku service offline. Sui requires an active Shizuku backend to run binder requests.";
        }
        return "sui: Summoning Magisk/KernelSU Superuser Permission popup on Android Screen...\n✔ Permission GRANTED! Superuser clearance successfully enabled for Unix UID 10287.\nYou can now type 'su' to switch to root shell mode.";
      }
      if (subcommand === "status") {
        return `Sui Security Compliance Check:
--------------------------------------------
Magisk Core Version: v26.4 (MagiskSU compliance)
Sui Client Version: v13.5.4
Target App: com.termux (authorized)
Clearance: root capabilities simulated successfully.`;
      }
      return `sh: sui: option '${subcommand}' is recognized but cannot be executed.`;
    }

    case "exit": {
      if (termuxRishActive) {
        termuxRishActive = false;
        return "Terminated active rish ADB shell environment.\nReturned back to default bash shell: localhost:~$";
      }
      if (termuxRoot) {
        termuxRoot = false;
        return "Logging out of superuser root namespace.\nReturned to standard system client: localhost:~$";
      }
      return "Terminal session requested closed. Re-opening shell console process...";
    }

    default:
      return `sh: command not found: ${cmd}. Type 'help' to review simulated core functions.`;
  }
}

function getLatestCommit(branch: string) {
  // Find latest commit that was generated either under or inherited by the target branch
  const match = gitState.commits.filter(c => c.meta?.branch === branch);
  if (match.length > 0) {
    return match[match.length - 1];
  }
  // Try fallback to main commit
  return gitState.commits.find(c => c.meta?.branch === "main") || gitState.commits[0];
}

startServer();
