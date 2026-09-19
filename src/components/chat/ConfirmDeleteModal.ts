/**
 * Confirmation Modal for Session Deletion
 *
 * Obsidian Modal that prompts user to confirm before deleting one or more
 * sessions. Prevents accidental deletion due to misclicks.
 */

import { Modal, App } from "obsidian";

/**
 * Text shown by the confirmation modal.
 */
export interface ConfirmDeleteOptions {
	/** Modal heading, e.g. "Delete session?" */
	title: string;
	/** Main question, e.g. `Are you sure you want to delete "Esteem"?` */
	message: string;
	/** Secondary note explaining the scope of the deletion */
	warning?: string;
	/** Label of the destructive button (defaults to "Delete") */
	confirmLabel?: string;
}

/** Default note explaining that deletion is plugin-side only. */
const AGENT_SIDE_NOTE =
	"This only removes the session from this plugin. The session data will remain on the agent side.";

/**
 * Confirmation modal for session deletion.
 *
 * Calls onConfirm callback only when user clicks the confirm button.
 */
export class ConfirmDeleteModal extends Modal {
	private options: ConfirmDeleteOptions;
	private onConfirm: () => void | Promise<void>;

	constructor(
		app: App,
		options: ConfirmDeleteOptions,
		onConfirm: () => void | Promise<void>,
	) {
		super(app);
		this.options = options;
		this.onConfirm = onConfirm;
	}

	/**
	 * Build the options for deleting a single session.
	 */
	static forSession(sessionTitle: string): ConfirmDeleteOptions {
		return {
			title: "Delete session?",
			message: `Are you sure you want to delete "${sessionTitle}"?`,
			warning: AGENT_SIDE_NOTE,
		};
	}

	/**
	 * Build the options for deleting every listed session.
	 */
	static forAllSessions(count: number): ConfirmDeleteOptions {
		const plural = count === 1 ? "session" : "sessions";
		return {
			title: "Delete all sessions?",
			message: `Are you sure you want to delete all ${count} ${plural} shown? This cannot be undone.`,
			warning: AGENT_SIDE_NOTE,
			confirmLabel: "Delete all",
		};
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		// Title
		contentEl.createEl("h2", { text: this.options.title });

		// Message
		contentEl.createEl("p", {
			text: this.options.message,
			cls: "obsidianaitools-confirm-delete-message",
		});

		if (this.options.warning) {
			contentEl.createEl("p", {
				text: this.options.warning,
				cls: "obsidianaitools-confirm-delete-warning",
			});
		}

		// Buttons container
		const buttonContainer = contentEl.createDiv({
			cls: "obsidianaitools-confirm-delete-buttons",
		});

		// Cancel button
		const cancelButton = buttonContainer.createEl("button", {
			text: "Cancel",
			cls: "obsidianaitools-confirm-delete-cancel",
		});
		cancelButton.addEventListener("click", () => {
			this.close();
		});

		// Delete button
		const deleteButton = buttonContainer.createEl("button", {
			text: this.options.confirmLabel ?? "Delete",
			cls: "obsidianaitools-confirm-delete-confirm mod-warning",
		});
		deleteButton.addEventListener("click", () => {
			this.close();
			void this.onConfirm();
		});
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
