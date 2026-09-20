export type ActionSuccess<T> = { ok: true; data: T };

export type ActionValidationError = {
  ok: false;
  kind: "validation_error";
  message: string;
  fieldErrors?: Record<string, string>;
};

export type ActionConflict = {
  ok: false;
  kind: "conflict";
  message: string;
  details?: Record<string, unknown>;
};

export type ActionFailure = {
  ok: false;
  kind: "failure";
  message: string;
};

export type ActionResult<T> =
  | ActionSuccess<T>
  | ActionValidationError
  | ActionConflict
  | ActionFailure;

export function success<T>(data: T): ActionSuccess<T> {
  return { ok: true, data };
}

export function validationError(
  message: string,
  fieldErrors?: Record<string, string>,
): ActionValidationError {
  return { ok: false, kind: "validation_error", message, fieldErrors };
}

export function conflict(
  message: string,
  details?: Record<string, unknown>,
): ActionConflict {
  return { ok: false, kind: "conflict", message, details };
}

export function failure(message: string): ActionFailure {
  return { ok: false, kind: "failure", message };
}
