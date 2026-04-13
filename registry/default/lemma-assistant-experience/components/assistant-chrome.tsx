import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type {
  AssistantConversationListItem,
  AssistantConversationRenderArgs,
} from "./assistant-types.js";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export type AssistantSurfaceTone = "default" | "subtle" | "flat";
export type AssistantThemeMode = "auto" | "light" | "dark";

export interface AssistantThemeScopeProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  theme?: AssistantThemeMode;
}

export function AssistantThemeScope({
  className,
  children,
  theme = "auto",
  ...props
}: AssistantThemeScopeProps) {
  return (
    <div
      data-lemma-theme={theme}
      className={cx("lemma-assistant-theme", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export interface AssistantHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  controls?: ReactNode;
  tone?: AssistantSurfaceTone;
  className?: string;
}

export interface AssistantMessageViewportProps extends ComponentPropsWithoutRef<"div"> {
  innerClassName?: string;
  children: ReactNode;
}

export const AssistantMessageViewport = forwardRef<HTMLDivElement, AssistantMessageViewportProps>(function AssistantMessageViewport({
  className,
  innerClassName,
  children,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={cx("lemma-assistant-viewport", className)}
      {...props}
    >
      <div className={cx("lemma-assistant-viewport-inner", innerClassName)}>
        {children}
      </div>
    </div>
  );
});

export interface AssistantShellLayoutProps {
  sidebar?: ReactNode;
  sidebarVisible?: boolean;
  main: ReactNode;
  className?: string;
}

export function AssistantShellLayout({
  sidebar,
  sidebarVisible = false,
  main,
  className,
}: AssistantShellLayoutProps) {
  const hasSidebar = !!sidebar;

  return (
    <div className={cx(
      "lemma-assistant-shell",
      hasSidebar && "lemma-assistant-shell--with-sidebar",
      hasSidebar && sidebarVisible && "lemma-assistant-shell--sidebar-visible",
      className,
    )}>
      {sidebar && sidebarVisible ? (
        <div className="lemma-assistant-shell-sidebar">{sidebar}</div>
      ) : null}
      {main}
    </div>
  );
}

export function AssistantHeader({
  title,
  subtitle,
  badge,
  controls,
  tone = "subtle",
  className,
}: AssistantHeaderProps) {
  return (
    <div
      data-tone={tone}
      className={cx("lemma-assistant-header", className)}
    >
      <div className="lemma-assistant-header-copy">
        {badge ? (
          <div className="lemma-assistant-header-badge">
            {badge}
          </div>
        ) : null}
        <div className="lemma-assistant-header-titles">
          <h3 className="lemma-assistant-header-title">{title}</h3>
          {subtitle ? (
            <p className="lemma-assistant-header-subtitle">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {controls ? (
        <div className="lemma-assistant-header-controls">{controls}</div>
      ) : null}
    </div>
  );
}

export interface AssistantConversationListProps {
  conversations: AssistantConversationListItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation?: () => void;
  renderConversationLabel?: (args: AssistantConversationRenderArgs) => ReactNode;
  title?: ReactNode;
  newLabel?: ReactNode;
  className?: string;
}

export function AssistantConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  renderConversationLabel,
  title = "Conversations",
  newLabel = "New",
  className,
}: AssistantConversationListProps) {
  return (
    <aside className={cx("lemma-assistant-conversation-list", className)}>
      <div className="lemma-assistant-conversation-list-header">
        <div className="lemma-assistant-conversation-list-header-row">
          <div className="lemma-assistant-conversation-list-copy">
            <div className="lemma-assistant-conversation-list-title">{title}</div>
            <div className="lemma-assistant-conversation-list-meta">
              {conversations.length} total
            </div>
          </div>
          {onNewConversation ? (
            <button
              type="button"
              onClick={onNewConversation}
              className="lemma-assistant-conversation-list-new"
            >
              {newLabel}
            </button>
          ) : null}
        </div>
      </div>
      <div className="lemma-assistant-conversation-list-items">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className={cx(
                "lemma-assistant-conversation-list-item",
                isActive && "lemma-assistant-conversation-list-item-active",
              )}
            >
              <div className="lemma-assistant-conversation-list-item-title">
                {renderConversationLabel
                  ? renderConversationLabel({ conversation, isActive })
                  : (conversation.title || "Untitled conversation")}
              </div>
              <div className="lemma-assistant-conversation-list-item-status">
                {(conversation.status || "waiting").toLowerCase()}
              </div>
            </button>
          );
        })}
      </div>
    </aside>
  );
}

export interface AssistantModelPickerProps<TValue extends string = string> {
  value: TValue | null;
  options: TValue[];
  disabled?: boolean;
  autoLabel?: ReactNode;
  getOptionLabel?: (value: TValue) => ReactNode;
  onChange: (value: TValue | null) => void;
  className?: string;
}

export function AssistantModelPicker<TValue extends string = string>({
  value,
  options,
  disabled,
  autoLabel = "Auto",
  getOptionLabel,
  onChange,
  className,
}: AssistantModelPickerProps<TValue>) {
  const autoValue = "__AUTO__";

  return (
    <select
      value={value ?? autoValue}
      onChange={(event) => onChange(event.target.value === autoValue ? null : (event.target.value as TValue))}
      disabled={disabled}
      className={cx("lemma-assistant-model-picker", className)}
      aria-label="Conversation model"
      title="Conversation model"
    >
      <option value={autoValue}>{autoLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {getOptionLabel ? getOptionLabel(option) : option}
        </option>
      ))}
    </select>
  );
}

export interface AssistantAskOverlayProps {
  questionNumber: number;
  totalQuestions: number;
  question: ReactNode;
  options: string[];
  selectedOptions: string[];
  canContinue: boolean;
  continueLabel: ReactNode;
  onSelectOption: (option: string) => void;
  onContinue?: () => void;
  onSkip?: () => void;
  mode?: "single_select" | "multi_select" | "rank_priorities";
}

export function AssistantAskOverlay({
  questionNumber,
  totalQuestions,
  question,
  options,
  selectedOptions,
  canContinue,
  continueLabel,
  onSelectOption,
  onContinue,
  onSkip,
  mode = "single_select",
}: AssistantAskOverlayProps) {
  return (
    <div className="lemma-assistant-ask-overlay">
      <div className="lemma-assistant-ask-overlay-header">
        <div className="lemma-assistant-ask-overlay-copy">
          <div className="lemma-assistant-ask-overlay-kicker">
            Question {questionNumber} of {totalQuestions}
          </div>
          <p className="lemma-assistant-ask-overlay-question">
            {question}
          </p>
        </div>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="lemma-assistant-ask-overlay-skip"
          >
            Skip
          </button>
        ) : null}
      </div>

      <div className="lemma-assistant-ask-overlay-options">
        {options.map((option, optionIndex) => {
          const isSelected = selectedOptions.includes(option);
          const rankLabel = mode === "rank_priorities" && isSelected
            ? selectedOptions.indexOf(option) + 1
            : null;

          return (
            <button
              key={`${option}-${optionIndex}`}
              type="button"
              onClick={() => onSelectOption(option)}
              className={cx(
                "lemma-assistant-ask-overlay-option",
                isSelected && "lemma-assistant-ask-overlay-option-selected",
              )}
            >
              <span className="lemma-assistant-ask-overlay-option-label">
                {rankLabel ? (
                  <span className="lemma-assistant-ask-overlay-option-rank">
                    {rankLabel}
                  </span>
                ) : (
                  <span
                    className={cx(
                      "lemma-assistant-ask-overlay-option-indicator",
                      isSelected && "lemma-assistant-ask-overlay-option-indicator-selected",
                    )}
                  />
                )}
                {option}
              </span>
            </button>
          );
        })}
      </div>

      {onContinue ? (
        <div className="lemma-assistant-ask-overlay-actions">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={cx(
              "lemma-assistant-ask-overlay-continue",
              canContinue && "lemma-assistant-ask-overlay-continue-enabled",
            )}
          >
            {continueLabel}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export interface AssistantPendingFileChipProps {
  label: ReactNode;
  onRemove?: () => void;
  className?: string;
}

export interface AssistantComposerProps {
  floating?: ReactNode;
  status?: ReactNode;
  pendingFiles?: ReactNode;
  children: ReactNode;
  tone?: AssistantSurfaceTone;
  className?: string;
}

export function AssistantComposer({
  floating,
  status,
  pendingFiles,
  children,
  tone = "subtle",
  className,
}: AssistantComposerProps) {
  return (
    <div
      data-tone={tone}
      data-has-status={status ? "true" : "false"}
      data-has-pending-files={pendingFiles ? "true" : "false"}
      data-has-floating={floating ? "true" : "false"}
      className={cx("lemma-assistant-composer", className)}
    >
      {floating ? (
        <div className="lemma-assistant-composer-floating">
          {floating}
        </div>
      ) : null}

      {status ? (
        <div className="lemma-assistant-composer-status-rail">
          <div className="lemma-assistant-composer-status">
            {status}
          </div>
        </div>
      ) : null}

      {pendingFiles ? (
        <div className="lemma-assistant-composer-pending">
          {pendingFiles}
        </div>
      ) : null}

      <div className="lemma-assistant-composer-body">{children}</div>
    </div>
  );
}

export function AssistantPendingFileChip({
  label,
  onRemove,
  className,
}: AssistantPendingFileChipProps) {
  return (
    <span className={cx(
      "lemma-assistant-pending-file-chip",
      className,
    )}>
      <span className="lemma-assistant-pending-file-chip-label">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="lemma-assistant-pending-file-chip-remove"
          title="Remove file"
        >
          ×
        </button>
      ) : null}
    </span>
  );
}

export interface AssistantStatusPillProps {
  label: ReactNode;
  subtle?: boolean;
  className?: string;
}

export function AssistantStatusPill({
  label,
  subtle = false,
  className,
}: AssistantStatusPillProps) {
  return (
    <div className={cx(
      "lemma-assistant-status-pill",
      subtle && "lemma-assistant-status-pill-subtle",
      className,
    )}>
      <span className="lemma-assistant-status-pill-dot">
        <span className="lemma-assistant-status-pill-dot-ping" />
        <span className="lemma-assistant-status-pill-dot-core" />
      </span>
      <span className="lemma-assistant-status-pill-label">{label}</span>
    </div>
  );
}
