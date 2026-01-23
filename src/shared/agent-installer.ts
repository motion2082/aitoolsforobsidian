import { spawn, ChildProcess } from "child_process";
import { Platform } from "obsidian";

/**
 * Agent installer for ACP-compatible agents.
 * Handles automatic installation of agents like Claude Code, Gemini CLI, etc.
 */

export interface InstallResult {
	success: boolean;
	output: string;
	error?: string;
}

/**
 * Get the npm install command for a specific agent
 */
export function getAgentInstallCommand(agentId: string): string {
	switch (agentId) {
		case "claude-code-acp":
			return "npm install -g @anthropics/claude-code-acp";
		case "codex-acp":
			return "npm install -g @zed-industries/codex-acp";
		case "gemini-cli":
			return "npm install -g @google/gemini-cli";
		default:
			return "";
	}
}

/**
 * Get the display name for an agent
 */
export function getAgentDisplayName(agentId: string): string {
	switch (agentId) {
		case "claude-code-acp":
			return "Claude Code";
		case "codex-acp":
			return "Codex";
		case "gemini-cli":
			return "Gemini CLI";
		default:
			return agentId;
	}
}

/**
 * Install an agent using npm
 */
export function installAgent(
	agentId: string,
	nodePath: string,
	onOutput?: (data: string) => void,
): ChildProcess | null {
	const installCommand = getAgentInstallCommand(agentId);

	if (!installCommand) {
		return null;
	}

	// Use the node path from settings, or just 'node' to use system node
	const nodeExec = nodePath.trim() || "node";
	const npmExec = nodePath.trim()
		? nodePath.trim().replace(/node$/, "npm")
		: "npm";

	// Build command based on platform
	let command: string;
	let args: string[];

	if (Platform.isWin) {
		// On Windows, use cmd.exe with /c
		command = "cmd.exe";
		args = ["/c", `${npmExec} install -g ${getAgentNpmPackage(agentId)}`];
	} else {
		// On macOS/Linux, use login shell to get proper PATH
		const shell = Platform.isMacOS ? "/bin/zsh" : "/bin/bash";
		command = shell;
		args = [
			"-l",
			"-c",
			`${npmExec} install -g ${getAgentNpmPackage(agentId)}`,
		];
	}

	const childProcess = spawn(command, args, {
		stdio: ["pipe", "pipe", "pipe"],
		env: {
			...process.env,
			// Ensure npm uses the correct node
			...(nodePath.trim()
				? {
						PATH: `${nodePath.replace(/\/node$/, "")}:${
							process.env.PATH || ""
						}`,
				  }
				: {}),
		},
	});

	let output = "";

	childProcess.stdout?.on("data", (data) => {
		const text = data.toString();
		output += text;
		onOutput?.(text);
	});

	childProcess.stderr?.on("data", (data) => {
		const text = data.toString();
		output += text;
		onOutput?.(text);
	});

	return childProcess;
}

/**
 * Get the npm package name for an agent
 */
function getAgentNpmPackage(agentId: string): string {
	switch (agentId) {
		case "claude-code-acp":
			return "@anthropics/claude-code-acp";
		case "codex-acp":
			return "@zed-industries/codex-acp";
		case "gemini-cli":
			return "@google/gemini-cli";
		default:
			return agentId;
	}
}

/**
 * Check if an agent is a known npm-based agent
 */
export function isKnownAgent(agentId: string): boolean {
	return ["claude-code-acp", "codex-acp", "gemini-cli"].includes(agentId);
}
