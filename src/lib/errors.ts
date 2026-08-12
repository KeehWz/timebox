/** Base class for known, user-presentable application errors. */
export class AppError extends Error {
  readonly code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = new.target.name
    this.code = code
  }
}

/** Thrown when starting a session while another is still active or paused. */
export class ActiveSessionExistsError extends AppError {
  constructor() {
    super('A session is already in progress.', 'ACTIVE_SESSION_EXISTS')
  }
}

/** Thrown when an operation references a session id that does not exist. */
export class SessionNotFoundError extends AppError {
  constructor(id: string) {
    super(`Session not found: ${id}`, 'SESSION_NOT_FOUND')
  }
}

/** Thrown when an operation references a task id that does not exist. */
export class TaskNotFoundError extends AppError {
  constructor(id: string) {
    super(`Task not found: ${id}`, 'TASK_NOT_FOUND')
  }
}
