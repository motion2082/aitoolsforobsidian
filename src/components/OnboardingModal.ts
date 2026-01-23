import { Modal, App, ButtonComponent, Setting } from "obsidian";
import type AgentClientPlugin from "../plugin";

/**
 * First-run onboarding modal that guides users through initial setup.
 *
 * This modal helps new users:
 * 1. Understand what the plugin does
 * 2. Check prerequisites (Node.js)
 * 3. Install an agent
 * 4. Open the chat view
 */
export class OnboardingModal extends Modal {
	private plugin: AgentClientPlugin;
	private currentStep = 0;
	private stepContainer: HTMLElement;

	constructor(app: App, plugin: AgentClientPlugin) {
		super(app);
		this.plugin = plugin;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();
		contentEl.addClass("obsidianaitools-onboarding-modal");

		// Header
		contentEl.createEl("h2", {
			text: "Welcome to AI Tools for Obsidian",
		});

		contentEl.createEl("p", {
			text: "Chat with AI coding agents directly from your vault",
			cls: "obsidianaitools-onboarding-subtitle",
		});

		// Step container
		this.stepContainer = contentEl.createDiv({
			cls: "obsidianaitools-onboarding-steps",
		});

		// Navigation buttons
		const navContainer = contentEl.createDiv({
			cls: "obsidianaitools-onboarding-nav",
		});

		new ButtonComponent(navContainer)
			.setButtonText("Get Started")
			.setCta()
			.onClick(() => {
				this.nextStep();
			});

		// Close button
		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Close")
					.onClick(() => {
						this.close();
					}),
			);

		this.renderCurrentStep();
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}

	private nextStep() {
		this.currentStep++;
		if (this.currentStep > 4) {
			this.close();
			// Open chat view
			void this.plugin.activateView();
			return;
		}
		this.renderCurrentStep();
	}

	private renderCurrentStep() {
		this.stepContainer.empty();

		switch (this.currentStep) {
			case 0:
				this.renderStep1();
				break;
			case 1:
				this.renderStep2();
				break;
			case 2:
				this.renderStep3();
				break;
			case 3:
				this.renderStep4();
				break;
			case 4:
				this.renderStep5();
				break;
		}
	}

	private renderStep1() {
		// What is this plugin?
		this.stepContainer.createEl("h3", { text: "What is this plugin?" });

		this.stepContainer.createEl("p", {
			text: "AI Tools for Obsidian lets you chat with AI coding agents like Claude Code, Codex, and Gemini CLI directly within your Obsidian vault.",
		});

		const ul = this.stepContainer.createEl("ul");
		ul.createEl("li", { text: "Chat with AI agents about your notes" });
		ul.createEl("li", { text: "Use @mentions to reference your vault files" });
		ul.createEl("li", { text: "Use /commands for quick actions" });
		ul.createEl("li", { text: "Export conversations as Markdown" });

		this.addNavigation("Next: Prerequisites →");
	}

	private renderStep2() {
		// Prerequisites
		this.stepContainer.createEl("h3", { text: "Prerequisites" });

		this.stepContainer.createEl("p", {
			text: "Before setting up an agent, make sure you have:",
		});

		const div = this.stepContainer.createDiv();
		div.createEl("h4", { text: "1. Node.js" });
		div.createEl("p", {
			text: "Required for npm-based agents. Check if you have it:",
			cls: "obsidianaitools-onboarding-code",
		});
		div.createEl("code", { text: "node --version" });

		div.createEl("p", {
			text: "Don't have Node.js? Download from nodejs.org",
		});

		this.addNavigation("Next: Choose an Agent →", "Back", true);
	}

	private renderStep3() {
		// Choose an agent
		this.stepContainer.createEl("h3", { text: "Choose an Agent" });

		this.stepContainer.createEl("p", {
			text: "Select an AI agent to install and configure:",
		});

		// Agent cards
		const cardsContainer = this.stepContainer.createDiv({
			cls: "obsidianaitools-onboarding-cards",
		});

		// Claude Code card
		this.createAgentCard(
			cardsContainer,
			"Claude Code",
			"Anthropic",
			"npm install -g @zed-industries/claude-code-acp",
			"Popular for general coding tasks",
		);

		// Codex card
		this.createAgentCard(
			cardsContainer,
			"Codex",
			"OpenAI",
			"npm install -g @zed-industries/codex-acp",
			"Code generation focused",
		);

		// Gemini CLI card
		this.createAgentCard(
			cardsContainer,
			"Gemini CLI",
			"Google",
			"npm install -g @google/gemini-cli",
			"Experimental ACP support",
		);

		this.addNavigation("Next: Configure →", "Back", true);
	}

	private createAgentCard(
		parent: HTMLElement,
		name: string,
		provider: string,
		installCmd: string,
		description: string,
	) {
		const card = parent.createDiv({
			cls: "obsidianaitools-onboarding-card",
		});
		card.createEl("h4", { text: name });
		card.createEl("span", {
			text: provider,
			cls: "obsidianaitools-provider-badge",
		});
		card.createEl("p", { text: description });
		card.createEl("code", {
			text: installCmd,
			cls: "obsidianaitools-install-cmd",
		});
	}

	private renderStep4() {
		// Configure
		this.stepContainer.createEl("h3", { text: "Configure Your Agent" });

		this.stepContainer.createEl("p", {
			text: "After installing your agent, configure it in settings:",
		});

		const ol = this.stepContainer.createEl("ol");
		ol.createEl("li", { text: "Open Settings → Agent Client" });
		ol.createEl("li", { text: "Select an agent from the dropdown" });
		ol.createEl("li", { text: "Enter the agent path (or click Auto-detect)" });
		ol.createEl("li", { text: "Add your API key if required" });

		this.stepContainer.createEl("p", {
			text: "Tip: Click the robot icon in the sidebar or run 'Open agent chat' command to start chatting.",
			cls: "obsidianaitools-onboarding-tip",
		});

		this.addNavigation("Open Chat →", "Back", true);
	}

	private renderStep5() {
		// Ready!
		this.stepContainer.createEl("h3", { text: "You're All Set!" });

		this.stepContainer.createEl("p", {
			text: "Ready to start chatting with AI agents in Obsidian.",
		});

		const helpLinks = this.stepContainer.createDiv({
			cls: "obsidianaitools-onboarding-help",
		});
		helpLinks.createEl("a", {
			text: "📚 Documentation",
			href: "https://ultimateai-org.github.io/aitoolsforobsidian/",
		});
		helpLinks.createEl("a", {
			text: "❓ FAQ",
			href: "https://ultimateai-org.github.io/aitoolsforobsidian/help/faq/",
		});
		helpLinks.createEl("a", {
			text: "🐛 Troubleshooting",
			href: "https://ultimateai-org.github.io/aitoolsforobsidian/help/troubleshooting/",
		});

		this.addNavigation("Start Chatting!", "Back", true);
	}

	private addNavigation(
		nextText: string,
		backText?: string,
		isPrimary = false,
	) {
		const navContainer = this.stepContainer.createDiv({
			cls: "obsidianaitools-onboarding-nav",
		});

		if (backText) {
			new ButtonComponent(navContainer)
				.setButtonText(backText)
				.onClick(() => {
					this.currentStep--;
					this.renderCurrentStep();
				});
		}

		new ButtonComponent(navContainer)
			.setButtonText(nextText)
			.onClick(() => {
				this.nextStep();
			});
		if (isPrimary) {
			navContainer.lastElementChild?.addClass("mod-cta");
		}
	}
}
