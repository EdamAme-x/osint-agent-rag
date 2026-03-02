import { Effect, pipe } from "effect";
import * as v from "valibot";
import { errorText, jsonText, toErrorMessage } from "./toolResponse.js";

function formatValidationIssues(issues: v.BaseIssue<unknown>[]): string {
  const messages = issues.map((issue) => issue.message).filter((message) => message.length > 0);
  if (messages.length === 0) {
    return "Invalid input";
  }
  return `Invalid input: ${messages.join("; ")}`;
}

export async function runValidatedTool<TInput, TOutput>(
  schema: v.BaseSchema<unknown, TInput, v.BaseIssue<unknown>>,
  input: unknown,
  handler: (validated: TInput) => Promise<TOutput> | TOutput
) {
  return Effect.runPromise(
    pipe(
      Effect.try({
        try: () => {
          const parsed = v.safeParse(schema, input, {
            abortEarly: false,
            abortPipeEarly: false,
          });
          if (!parsed.success) {
            throw new Error(formatValidationIssues(parsed.issues));
          }
          return parsed.output;
        },
        catch: (error) => error,
      }),
      Effect.flatMap((validated) =>
        Effect.tryPromise({
          try: () => Promise.resolve(handler(validated)),
          catch: (error) => error,
        })
      ),
      Effect.map((result) => jsonText(result)),
      Effect.catchAll((error) => Effect.succeed(errorText(toErrorMessage(error))))
    )
  );
}
