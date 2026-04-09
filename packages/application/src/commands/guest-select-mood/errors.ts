export class SelectMoodPolicyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SelectMoodPolicyError";
  }
}
