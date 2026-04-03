import { forwardRef, type ComponentPropsWithoutRef, type ReactNode } from "react";
import type {
  AssistantConversationListItem,
  AssistantConversationRenderArgs,
} from "./assistant-types.js";

function cx(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(" ");
}

export interface AssistantHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  controls?: ReactNode;
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
      className={cx(
        "min-h-0 flex-1 overflow-y-auto bg-[var(--bg-surface)] px-4 py-4",
        className,
      )}
      {...props}
    >
      <div className={cx("mx-auto flex w-full max-w-5xl flex-col gap-3", innerClassName)}>
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
  return (
    <div className={cx(
      "mx-auto flex h-full w-full min-h-0 flex-col gap-3 font-sans antialiased",
      !!sidebar && sidebarVisible && "lg:grid lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-3",
      className,
    )}>
      {sidebar && sidebarVisible ? (
        <div className="hidden h-full min-h-0 lg:block">{sidebar}</div>
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
  className,
}: AssistantHeaderProps) {
  return (
    <div className={cx(
      "flex items-center justify-between border-b border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] px-4 py-3",
      className,
    )}>
      <div className="flex items-center gap-2.5">
        {badge ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--brand-primary),var(--brand-secondary))] shadow-[var(--shadow-xs)]">
            {badge}
          </div>
        ) : null}
        <div>
          <h3 className="text-[13px] font-semibold leading-tight text-[var(--text-primary)]">{title}</h3>
          {subtitle ? (
            <p className="text-[11px] text-[var(--text-tertiary)]">{subtitle}</p>
          ) : null}
        </div>
      </div>
      {controls ? (
        <div className="flex items-center gap-1">{controls}</div>
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
    <aside className={cx(
      "flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)]",
      className,
    )}>
      <div className="border-b border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</div>
            <div className="mt-1 text-[11px] text-[var(--text-tertiary)]">
              {conversations.length} total
            </div>
          </div>
          {onNewConversation ? (
            <button
              type="button"
              onClick={onNewConversation}
              className="rounded-full border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-1.5 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              {newLabel}
            </button>
          ) : null}
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 space-y-2">
        {conversations.map((conversation) => {
          const isActive = conversation.id === activeConversationId;
          return (
            <button
              key={conversation.id}
              type="button"
              onClick={() => onSelectConversation(conversation.id)}
              className={cx(
                "w-full rounded-xl border px-3 py-2.5 text-left transition-colors",
                isActive
                  ? "border-[color:color-mix(in_srgb,_var(--brand-primary)_44%,_var(--border-default))] bg-[color:color-mix(in_srgb,_var(--brand-glow)_42%,_var(--bg-surface))]"
                  : "border-[var(--border-default)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]",
              )}
            >
              <div className="truncate text-[12px] font-medium text-[var(--text-primary)]">
                {renderConversationLabel
                  ? renderConversationLabel({ conversation, isActive })
                  : (conversation.title || "Untitled conversation")}
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.08em] text-[var(--text-tertiary)]">
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
      className={cx(
        "h-8 rounded-full border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] px-3 text-[11px] text-[var(--text-secondary)]",
        className,
      )}
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
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.12em] text-[var(--text-tertiary)]">
            Question {questionNumber} of {totalQuestions}
          </div>
          <p className="mt-1 text-[14px] font-medium leading-6 text-[var(--text-primary)]">
            {question}
          </p>
        </div>
        {onSkip ? (
          <button
            type="button"
            onClick={onSkip}
            className="rounded-md px-2 py-1 text-[12px] text-[var(--text-tertiary)] transition-colors hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            Skip
          </button>
        ) : null}
      </div>

      <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
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
                "w-full rounded-lg border px-2.5 py-2 text-left text-[13px] transition-colors",
                isSelected
                  ? "border-[color:color-mix(in_srgb,_var(--brand-primary)_64%,_var(--border-subtle))] bg-[color:color-mix(in_srgb,_var(--brand-primary)_14%,_transparent)] text-[var(--text-primary)]"
                  : "border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]",
              )}
            >
              <span className="inline-flex items-center gap-2">
                {rankLabel ? (
                  <span className="inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1 text-[10px] font-semibold text-[var(--text-on-brand)]">
                    {rankLabel}
                  </span>
                ) : (
                  <span
                    className={cx(
                      "inline-block h-2.5 w-2.5 rounded-full border",
                      isSelected
                        ? "border-[var(--brand-primary)] bg-[var(--brand-primary)]"
                        : "border-[var(--border-default)] bg-transparent",
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
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onContinue}
            disabled={!canContinue}
            className={cx(
              "rounded-md px-2.5 py-1.5 text-[12px] font-medium transition-colors",
              canContinue
                ? "bg-[var(--brand-primary)] text-[var(--text-on-brand)] hover:bg-[color:color-mix(in_srgb,_var(--brand-primary)_88%,_var(--text-primary))]"
                : "bg-[var(--bg-subtle)] text-[var(--text-tertiary)]",
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
  className?: string;
}

export function AssistantComposer({
  floating,
  status,
  pendingFiles,
  children,
  className,
}: AssistantComposerProps) {
  return (
    <div className={cx(
      "relative rounded-2xl border border-[color:color-mix(in_srgb,_var(--border-default)_80%,_transparent)] bg-[var(--bg-surface)] p-2 shadow-[var(--shadow-md)]",
      className,
    )}>
      {floating ? (
        <div className="absolute bottom-[calc(100%+8px)] left-0 right-0 z-20">
          {floating}
        </div>
      ) : null}

      <div className="min-h-[34px] px-2 pb-1">
        <div className="flex min-h-[26px] items-center transition-opacity duration-200">
          {status || <span aria-hidden="true" className="inline-block h-[30px]" />}
        </div>
      </div>

      {pendingFiles ? (
        <div className="flex flex-wrap items-center gap-1.5 px-1 pb-1.5">
          {pendingFiles}
        </div>
      ) : null}

      {children}
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
      "inline-flex max-w-full items-center gap-1.5 rounded-full bg-[var(--bg-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)]",
      className,
    )}>
      <span className="truncate max-w-[180px]">{label}</span>
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-[var(--bg-canvas)]"
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
      "inline-flex min-h-[30px] max-w-full items-center gap-2 rounded-full px-3 py-1.5 text-[12px] transition-all duration-200",
      subtle
        ? "border border-[color:color-mix(in_srgb,_var(--border-default)_72%,_transparent)] bg-[color:color-mix(in_srgb,_var(--bg-surface)_90%,_transparent)] text-[var(--text-tertiary)]"
        : "border border-[color:color-mix(in_srgb,_var(--brand-primary)_24%,_var(--border-default))] bg-[color:color-mix(in_srgb,_var(--brand-glow)_28%,_var(--bg-surface))] text-[var(--text-secondary)]",
      className,
    )}>
      <span className="relative inline-flex h-2.5 w-2.5 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-primary)]/45" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[var(--brand-primary)]" />
      </span>
      <span className="truncate">{label}</span>
    </div>
  );
}
