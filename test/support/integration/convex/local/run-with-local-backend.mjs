import { spawn, spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import {
	cpSync,
	existsSync,
	mkdtempSync,
	readFileSync,
	rmSync,
	symlinkSync,
	writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";
import { parseEnv } from "node:util";

const workspace = process.cwd();
const suite = process.argv[2];
const suiteArgs = process.argv.slice(3);
if (suite !== "integration" && suite !== "e2e") {
	throw new Error("Expected the integration or e2e suite.");
}

function parseEnvironment(path) {
	if (!existsSync(path)) return {};
	return parseEnv(readFileSync(path, "utf8"));
}

function clerkFrontendApiUrl(publishableKey) {
	if (!publishableKey) return "https://clerk.example.test";
	const encoded = publishableKey.replace(/^pk_(?:test|live)_/u, "");
	return `https://${Buffer.from(encoded, "base64url").toString("utf8").replace(/\$$/u, "")}`;
}

function run(command, args, options = {}) {
	const result = spawnSync(command, args, {
		cwd: options.cwd ?? workspace,
		env: options.env,
		stdio: options.stdio ?? "inherit",
	});
	if (result.error) throw result.error;
	if (result.status !== 0) {
		throw new Error(`${basename(command)} exited with status ${result.status}`);
	}
}

async function stop(child) {
	if (!child || child.exitCode !== null) return;
	const exited = new Promise((resolvePromise) =>
		child.once("exit", resolvePromise),
	);
	if (process.platform === "win32") {
		spawnSync("taskkill", ["/pid", String(child.pid), "/t", "/f"], {
			stdio: "ignore",
		});
	} else {
		child.kill("SIGTERM");
	}
	await Promise.race([
		exited,
		new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000)),
	]);
	if (child.exitCode === null && process.platform !== "win32") {
		child.kill("SIGKILL");
		await Promise.race([
			exited,
			new Promise((resolvePromise) => setTimeout(resolvePromise, 5_000)),
		]);
	}
}

async function removeTemporaryProject(path) {
	const deadline = Date.now() + 30_000;
	while (true) {
		try {
			rmSync(path, { force: true, recursive: true });
			return;
		} catch (error) {
			const retryable =
				error &&
				typeof error === "object" &&
				"code" in error &&
				["EBUSY", "ENOTEMPTY", "EPERM"].includes(error.code);
			if (!retryable || Date.now() >= deadline) throw error;
			await new Promise((resolvePromise) => setTimeout(resolvePromise, 500));
		}
	}
}

async function startConvex(project, environment) {
	const cli = resolve(workspace, "node_modules/convex/bin/main.js");
	const child = spawn(
		process.execPath,
		[
			cli,
			"dev",
			"--codegen",
			"disable",
			"--typecheck",
			"disable",
			"--tail-logs",
			"disable",
		],
		{
			cwd: project,
			env: environment,
			stdio: ["ignore", "pipe", "pipe"],
			windowsHide: true,
		},
	);
	await new Promise((resolvePromise, reject) => {
		const timeout = setTimeout(
			() => reject(new Error("Timed out starting the local Convex backend.")),
			90_000,
		);
		let output = "";
		const observe = (chunk, destination) => {
			destination.write(chunk);
			output = `${output}${chunk}`.slice(-2_000);
			if (output.includes("Convex functions ready!")) {
				clearTimeout(timeout);
				resolvePromise();
			}
		};
		child.stdout.on("data", (chunk) => observe(chunk, process.stdout));
		child.stderr.on("data", (chunk) => observe(chunk, process.stderr));
		child.once("error", (error) => {
			clearTimeout(timeout);
			reject(error);
		});
		child.once("exit", (code) => {
			clearTimeout(timeout);
			reject(
				new Error(`Convex exited before becoming ready with status ${code}.`),
			);
		});
	});
	return child;
}

const project = mkdtempSync(join(tmpdir(), "repliery-convex-"));
const workspaceEnvironment = {
	...parseEnvironment(resolve(workspace, ".env.local")),
	...parseEnvironment(resolve(workspace, ".env.test.local")),
	...process.env,
};
const convexEnvironment = {
	...workspaceEnvironment,
	CONVEX_AGENT_MODE: "anonymous",
};
for (const name of [
	"CONVEX_DEPLOYMENT",
	"CONVEX_DEPLOY_KEY",
	"CONVEX_SELF_HOSTED_ADMIN_KEY",
	"CONVEX_SELF_HOSTED_URL",
]) {
	delete convexEnvironment[name];
}

let convex;
try {
	cpSync(resolve(workspace, "convex"), resolve(project, "convex"), {
		recursive: true,
	});
	cpSync(resolve(workspace, "shared"), resolve(project, "shared"), {
		recursive: true,
	});
	cpSync(resolve(workspace, "package.json"), resolve(project, "package.json"));
	writeFileSync(
		resolve(project, "convex.json"),
		JSON.stringify({ aiFiles: { enabled: false } }),
	);
	symlinkSync(
		resolve(workspace, "node_modules"),
		resolve(project, "node_modules"),
		process.platform === "win32" ? "junction" : "dir",
	);
	writeFileSync(
		resolve(project, "convex/testing.ts"),
		readFileSync(
			resolve(
				workspace,
				"test/support/integration/convex/local/test-functions.ts",
			),
			"utf8",
		).replaceAll('"../../../../../convex/_generated/', '"./_generated/'),
	);

	const cli = resolve(workspace, "node_modules/convex/bin/main.js");
	run(process.execPath, [cli, "init"], {
		cwd: project,
		env: convexEnvironment,
		stdio: ["ignore", "inherit", "inherit"],
	});
	const deploymentEnvironment = {
		...convexEnvironment,
		...parseEnvironment(resolve(project, ".env.local")),
	};
	const environmentFile = resolve(project, "local.env");
	writeFileSync(
		environmentFile,
		[
			`CLERK_FRONTEND_API_URL=${clerkFrontendApiUrl(workspaceEnvironment.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY)}`,
			"CLERK_SECRET_KEY=sk_test_local_integration",
			"CLERK_WEBHOOK_SIGNING_SECRET=whsec_Y2xlcmstd2ViaG9vay10ZXN0LXNlY3JldA==",
		].join("\n"),
	);
	run(
		process.execPath,
		[cli, "env", "set", "--force", "--from-file", environmentFile],
		{
			cwd: project,
			env: deploymentEnvironment,
			stdio: ["ignore", "inherit", "inherit"],
		},
	);
	convex = await startConvex(project, deploymentEnvironment);
	const localConfig = JSON.parse(
		readFileSync(resolve(project, ".convex/local/default/config.json"), "utf8"),
	);
	const childEnvironment = {
		...workspaceEnvironment,
		CONVEX_TEST_ADMIN_KEY: localConfig.adminKey,
		E2E_CLERK_USER_EMAIL:
			workspaceEnvironment.E2E_CLERK_USER_EMAIL ??
			`e2e+clerk_test_local_${randomUUID()}@example.com`,
		NEXT_PUBLIC_CONVEX_SITE_URL:
			deploymentEnvironment.NEXT_PUBLIC_CONVEX_SITE_URL,
		NEXT_PUBLIC_CONVEX_URL: deploymentEnvironment.NEXT_PUBLIC_CONVEX_URL,
		NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:3100",
	};
	if (suite === "integration") {
		run(
			process.execPath,
			[
				resolve(workspace, "node_modules/vitest/vitest.mjs"),
				"run",
				"--project=convex-local",
				...suiteArgs,
			],
			{ env: childEnvironment },
		);
	} else {
		run(
			process.execPath,
			[
				resolve(workspace, "node_modules/@playwright/test/cli.js"),
				"test",
				...suiteArgs,
			],
			{ env: childEnvironment },
		);
	}
} finally {
	await stop(convex);
	await removeTemporaryProject(project);
}
