export interface BackendErrorDetails {
  [field: string]: string[];
}

export class BackendError extends Error {
  readonly status: number;
  readonly details: BackendErrorDetails | null;

  constructor(status: number, message: string, details: BackendErrorDetails | null = null) {
    super(message);
    this.name = "BackendError";
    this.status = status;
    this.details = details;
    Object.setPrototypeOf(this, BackendError.prototype);
  }
}

interface PydanticErrorItem {
  loc?: (string | number)[];
  msg?: string;
  type?: string;
}

export function normalizeBackendError(
  status: number,
  payload: unknown,
  statusText?: string
): BackendError {
  const fallbackMessage = statusText && statusText.trim().length > 0
    ? statusText
    : "An unexpected error occurred. Please try again.";

  if (!payload) {
    return new BackendError(status, fallbackMessage, null);
  }

  if (typeof payload === "string") {
    const trimmed = payload.trim();
    if (trimmed.startsWith("<") && trimmed.endsWith(">")) {
      return new BackendError(status, fallbackMessage, null);
    }
    return new BackendError(status, trimmed || fallbackMessage, null);
  }

  if (typeof payload === "object" && payload !== null) {
    const data = payload as Record<string, unknown>;

    if (typeof data.detail === "string") {
      return new BackendError(status, data.detail, null);
    }

    if (Array.isArray(data.detail)) {
      const messages: string[] = [];
      const details: BackendErrorDetails = {};
      let hasDetails = false;

      for (const item of data.detail) {
        if (typeof item === "string") {
          messages.push(item);
        } else if (typeof item === "object" && item !== null) {
          const pydanticItem = item as PydanticErrorItem;
          const msg = pydanticItem.msg || "Invalid value";
          messages.push(msg);

          if (Array.isArray(pydanticItem.loc) && pydanticItem.loc.length > 0) {
            // e.g. ["body", "email"] -> "email" or ["body", "nested", "field"] -> "nested.field"
            const locParts = pydanticItem.loc.map(String);
            const field = locParts.length > 1 && (locParts[0] === "body" || locParts[0] === "query" || locParts[0] === "path")
              ? locParts.slice(1).join(".")
              : locParts.join(".");

            if (!details[field]) {
              details[field] = [];
            }
            details[field].push(msg);
            hasDetails = true;
          }
        }
      }

      const combinedMessage = messages.length > 0 ? messages.join(". ") : fallbackMessage;
      return new BackendError(status, combinedMessage, hasDetails ? details : null);
    }

    if (typeof data.message === "string") {
      return new BackendError(status, data.message, null);
    }
  }

  return new BackendError(status, fallbackMessage, null);
}
