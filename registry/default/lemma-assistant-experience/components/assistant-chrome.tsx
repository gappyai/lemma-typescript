import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type {
  AssistantConversationListItem,
  AssistantConversationRenderArgs,
} from "./assistant-types.js";

export type AssistantSurfaceTone = "default" | "subtle" | "flat";
export type AssistantThemeMode = "auto" | "light" | "dark";

export interface AssistantThemeScopeProps extends ComponentPropsWithoutRef<"div"> {
  children: ReactNode;
  theme?: AssistantThemeMode;
}

export const AssistantThemeScope = forwardRef<HTMLDivElement, AssistantThemeScopeProps>(function AssistantThemeScope({
  className,
  children,
  theme = "auto",
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      data-lemma-theme={theme}
      className={cn("lemma-assistant-theme", className)}
      {...props}
    >
      {children}
    </div>
  );
});

export interface AssistantHeaderProps extends Omit<ComponentPropsWithoutRef<"div">, "title"> {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  controls?: ReactNode;
  tone?: AssistantSurfaceTone;
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
      className={cn("lemma-assistant-viewport", className)}
      {...props}
    >
      <div className={cn("lemma-assistant-viewport-inner", innerClassName)}>
        {children}
      </div>
    </div>
  );
});

export interface AssistantShellLayoutProps extends ComponentPropsWithoutRef<"div"> {
  sidebar?: ReactNode;
  sidebarVisible?: boolean;
  main: ReactNode;
}

export const AssistantShellLayout = forwardRef<HTMLDivElement, AssistantShellLayoutProps>(function AssistantShellLayout({
  sidebar,
  sidebarVisible = false,
  main,
  className,
  ...props
}, ref) {
  const hasSidebar = !!sidebar;

  return (
    <div
      ref={ref}
      className={cn(
        "lemma-assistant-shell",
        hasSidebar && "lemma-assistant-shell--with-sidebar",
        hasSidebar && sidebarVisible && "lemma-assistant-shell--sidebar-visible",
        className,
      )}
      {...props}
    >
      {sidebar && sidebarVisible ? (
        <div className="lemma-assistant-shell-sidebar">{sidebar}</div>
      ) : null}
      {main}
    </div>
  );
});

export const AssistantHeader = forwardRef<HTMLDivElement, AssistantHeaderProps>(function AssistantHeader({
  title,
  subtitle,
  badge,
  controls,
  tone = "subtle",
  className,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      data-tone={tone}
      className={cn("lemma-assistant-header", className)}
      {...props}
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
});

export interface AssistantConversationListProps extends Omit<ComponentPropsWithoutRef<"aside">, "title"> {
  conversations: AssistantConversationListItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewConversation?: () => void;
  renderConversationLabel?: (args: AssistantConversationRenderArgs) => ReactNode;
  title?: ReactNode;
  newLabel?: ReactNode;
}

export const AssistantConversationList = forwardRef<HTMLElement, AssistantConversationListProps>(function AssistantConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  renderConversationLabel,
  title = "Conversations",
  newLabel = "New",
  className,
  ...props
}, ref) {
  return (
    <aside ref={ref} className={cn("lemma-assistant-conversation-list", className)} {...props}>
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
              aria-selected={isActive}
              className={cn(
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
});

export interface AssistantModelPickerProps<TValue extends string = string> extends Omit<ComponentPropsWithoutRef<"div">, "onChange"> {
  value: TValue | null;
  options: TValue[];
  disabled?: boolean;
  autoLabel?: ReactNode;
  getOptionLabel?: (value: TValue) => ReactNode;
  onChange: (value: TValue | null) => void;
}

export const AssistantModelPicker = forwardRef(function AssistantModelPicker<TValue extends string = string>({
  value,
  options,
  disabled,
  autoLabel = "Auto",
  getOptionLabel,
  onChange,
  className,
  ...props
}: AssistantModelPickerProps<TValue>, ref: React.ForwardedRef<HTMLDivElement>) {
  const autoValue = "__AUTO__";

  return (
    <div ref={ref} className={className} {...props}>
      <Select
        value={value ?? autoValue}
        onValueChange={(val) => onChange(val === autoValue ? null : (val as TValue))}
        disabled={disabled}
      >
        <SelectTrigger
          className="lemma-assistant-model-picker"
          aria-label="Conversation model"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={autoValue}>{autoLabel}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {getOptionLabel ? getOptionLabel(option) : option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}) as <TValue extends string = string>(
  props: AssistantModelPickerProps<TValue> & React.RefAttributes<HTMLDivElement>
) => React.ReactElement | null;

export interface AssistantAskOverlayProps extends ComponentPropsWithoutRef<"div"> {
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

export const AssistantAskOverlay = forwardRef<HTMLDivElement, AssistantAskOverlayProps>(function AssistantAskOverlay({
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
  className,
  ...props
}, ref) {
  return (
    <div ref={ref} className={cn("lemma-assistant-ask-overlay", className)} {...props}>
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
              className={cn(
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
                    className={cn(
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
            className={cn(
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
});

export interface AssistantPendingFileChipProps extends ComponentPropsWithoutRef<"span"> {
  label: ReactNode;
  onRemove?: () => void;
}

export interface AssistantComposerProps extends ComponentPropsWithoutRef<"div"> {
  floating?: ReactNode;
  status?: ReactNode;
  pendingFiles?: ReactNode;
  children: ReactNode;
  tone?: AssistantSurfaceTone;
}

export const AssistantComposer = forwardRef<HTMLDivElement, AssistantComposerProps>(function AssistantComposer({
  floating,
  status,
  pendingFiles,
  children,
  tone = "subtle",
  className,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      data-tone={tone}
      data-has-status={status ? "true" : "false"}
      data-has-pending-files={pendingFiles ? "true" : "false"}
      data-has-floating={floating ? "true" : "false"}
      className={cn("lemma-assistant-composer", className)}
      {...props}
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
});

export const AssistantPendingFileChip = forwardRef<HTMLSpanElement, AssistantPendingFileChipProps>(function AssistantPendingFileChip({
  label,
  onRemove,
  className,
  ...props
}, ref) {
  return (
    <span ref={ref} className={cn(
      "lemma-assistant-pending-file-chip",
      className,
    )} {...props}>
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
});

export interface AssistantStatusPillProps extends ComponentPropsWithoutRef<"div"> {
  label: ReactNode;
  subtle?: boolean;
}

export const AssistantStatusPill = forwardRef<HTMLDivElement, AssistantStatusPillProps>(function AssistantStatusPill({
  label,
  subtle = false,
  className,
  ...props
}, ref) {
  return (
    <div
      ref={ref}
      className={cn(
        "lemma-assistant-status-pill",
        subtle && "lemma-assistant-status-pill-subtle",
        className,
      )}
      {...props}
    >
      <span className="lemma-assistant-status-pill-dot">
        <span className="lemma-assistant-status-pill-dot-ping" />
        <span className="lemma-assistant-status-pill-dot-core" />
      </span>
      <span className="lemma-assistant-status-pill-label">{label}</span>
    </div>
  );
});
