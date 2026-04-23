import React from 'react';

export default function RevenuePriorityBanner({ service, showAnchorPrice }) {
  if (!service) return null;

  return (
    <div className="rounded-2xl border border-amber-400/15 bg-amber-400/8 px-4 py-4 text-neutral-200">
      <div className="mb-1 text-2xs uppercase tracking-[0.24em] text-amber-300/80">
        Best Fit Right Now
      </div>

      <div className="text-lg font-semibold">{service.title}</div>

      <div className="mt-1 text-sm text-neutral-400">
        Strong availability and premium value alignment.
      </div>

      <div className="mt-3 flex items-center gap-3 text-sm">
        {service.price != null && (
          <span className="font-medium text-neutral-100">
            €{service.price}
          </span>
        )}

        {showAnchorPrice &&
          service.compareAtPrice != null &&
          service.price != null &&
          service.compareAtPrice > service.price && (
            <span className="text-neutral-500 line-through">
              €{service.compareAtPrice}
            </span>
          )}
      </div>
    </div>
  );
}
