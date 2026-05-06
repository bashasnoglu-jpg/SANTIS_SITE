import type { CognitiveReasoningStep } from "../../types/boardroom.types";

interface ReasoningChainProps {
  steps: CognitiveReasoningStep[];
}

export function ReasoningChain({ steps }: ReasoningChainProps) {
  if (!steps || steps.length === 0) return null;

  return (
    <div className="nv-reasoning-chain">
      <h5 className="nv-reasoning-chain__title">REASONING CHAIN</h5>

      <div className="nv-reasoning-chain__steps">
        {steps.map((step, index) => (
          <div key={index} className="nv-reasoning-step">
            {/* Connector line */}
            {index < steps.length - 1 && (
              <div className="nv-reasoning-step__connector" />
            )}

            {/* Step node */}
            <div className="nv-reasoning-step__node">
              <span className="nv-reasoning-step__index">{index + 1}</span>
            </div>

            {/* Step content */}
            <div className="nv-reasoning-step__content">
              <div className="nv-reasoning-step__cause">
                <span className="nv-reasoning-step__field-label">CAUSE</span>
                <span className="nv-reasoning-step__field-value">{step.cause}</span>
              </div>
              <div className="nv-reasoning-step__context">
                <span className="nv-reasoning-step__field-label">CONTEXT</span>
                <span className="nv-reasoning-step__field-value">{step.context}</span>
              </div>
              <div className="nv-reasoning-step__outcome">
                <span className="nv-reasoning-step__field-label">OUTCOME</span>
                <span className="nv-reasoning-step__field-value nv-text--gold">{step.outcome}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
