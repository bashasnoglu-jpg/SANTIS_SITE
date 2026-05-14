import type { CommandIngressService } from "../services/command-ingress.js";

export async function dispatchCommandHandler(
  rawBody: unknown,
  ingress: CommandIngressService
) {
  return ingress.ingest(rawBody);
}
