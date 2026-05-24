import { spawn } from "child_process";
import { Platform } from "obsidian";
import { lt } from "semver";
import { getEnhancedWindowsEnv } from "./windows-env";
import { resolveCommandDirectory } from "./path-utils";

export interface VersionInfo {
	installed: string | null;
	latest: string | null;
	isOutdated: boolean;
}

/**
 * Maps internal agent IDs to their npm package names.
 */
const NPM_PACKAGES: Record<string, string> = {
	"claude-code-acp": "@agentclientprotocol/claude-agent-acp",
	"codex-acp": "@zed-industries/codex-acp",
	"gemini-cli": "@google/gemini-cli",
};

export function getNpmPackage(agentId: string): string | null {
	return NPM_PACKAGES[agentId] ?? null;
}

/**
 * Run `npm list -g --depth=0 --json` asynchronously and return raw stdout.
 * Uses a login shell so nvm/volta-managed node binaries are found.
 */
function runNpmListGlobal(nodePath: string): Promise<string> {
	return new Promise((resolve) => {
		let env: NodeJS.ProcessEnv = { ...process.env };
		const nodeDir = nodePath.trim()
			? (resolveCommandDirectory(nodePath.trim()) ?? "")
			: "";

		if (Platform.isWin) {
			env = getEnhancedWindowsEnv(env);
		}
		if (nodeDir) {
			const sep = Platform.isWin ? ";" : ":";
			env.PATH = `${nodeDir}${sep}${env.PATH ?? ""}`;
		}

		let command: string;
		let args: string[];

		if (Platform.isWin) {
			command = process.env.ComSpec ?? "cmd.exe";
			args = ["/c", "npm list -g --depth=0 --json"];
		} else {
			const shell = Platform.isMacOS ? "/bin/zsh" : "/bin/bash";
			const nvmSource = `[ -s "$HOME/.nvm/nvm.sh" ] && . "$HOME/.nvm/nvm.sh"`;
			command = shell;
			args = ["-l", "-c", `${nvmSource}; npm list -g --depth=0 --json`];
		}

		const child = spawn(command, args, {
			stdio: ["pipe", "pipe", "pipe"],
			env,
		});

		let stdout = "";
		child.stdout?.on("data", (data: unknown) => {
			stdout += typeof data === "string" ? data : String(data);
		});

		const timer = setTimeout(() => {
			child.kill();
			resolve("");
		}, 10000);

		child.on("close", () => {
			clearTimeout(timer);
			resolve(stdout);
		});

		child.on("error", () => {
			clearTimeout(timer);
			resolve("");
		});
	});
}

/**
 * Return the globally installed version of a built-in agent, or null if not installed / npm unavailable.
 */
export async function getInstalledVersion(
	agentId: string,
	nodePath: string,
): Promise<string | null> {
	const packageName = NPM_PACKAGES[agentId];
	if (!packageName) return null;

	try {
		const stdout = await runNpmListGlobal(nodePath);
		if (!stdout) return null;

		// npm may emit deprecation warnings before the JSON object
		const jsonStart = stdout.indexOf("{");
		if (jsonStart === -1) return null;

		const parsed = JSON.parse(stdout.slice(jsonStart)) as {
			dependencies?: Record<string, { version?: string }>;
		};
		return parsed.dependencies?.[packageName]?.version ?? null;
	} catch {
		return null;
	}
}

/**
 * Fetch the latest published version of a built-in agent from the npm registry.
 */
export async function getLatestVersion(agentId: string): Promise<string | null> {
	const packageName = NPM_PACKAGES[agentId];
	if (!packageName) return null;

	try {
		// The npm registry accepts the literal @scope/name path (no extra encoding needed)
		const url = `https://registry.npmjs.org/${packageName}/latest`;
		const response = await fetch(url, {
			headers: { Accept: "application/json" },
			signal: AbortSignal.timeout(8000),
		});
		if (!response.ok) return null;
		const data = (await response.json()) as { version?: string };
		return data.version ?? null;
	} catch {
		return null;
	}
}

/**
 * Check the installed vs latest version for a built-in agent.
 * Runs both checks in parallel.
 */
export async function checkAgentVersion(
	agentId: string,
	nodePath: string,
): Promise<VersionInfo> {
	const [installed, latest] = await Promise.all([
		getInstalledVersion(agentId, nodePath),
		getLatestVersion(agentId),
	]);

	let isOutdated = false;
	if (installed && latest) {
		try {
			isOutdated = lt(installed, latest);
		} catch {
			// Fallback if semver parse fails (e.g. pre-release suffix edge cases)
			isOutdated = installed !== latest;
		}
	}

	return { installed, latest, isOutdated };
}
