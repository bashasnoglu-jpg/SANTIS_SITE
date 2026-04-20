import React from 'react';

export default function AdaptiveServiceShelf({
  services,
  compact,
  onOpenService,
}) {
  return (
    <div
      className={
        compact
          ? 'grid grid-cols-1 gap-3 md:grid-cols-2'
          : 'grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3'
      }
    >
      {services.map((service, index) => (
        <button
          key={service.id}
          type="button"
          onClick={() => onOpenService?.(service, index)}
          className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/7"
        >
          <div className="mb-1 text-xs uppercase tracking-[0.18em] text-neutral-500">
            {service.category}
          </div>

          <div className="text-base font-medium text-neutral-100">
            {service.title}
          </div>

          <div className="mt-2 flex items-center gap-3 text-sm">
            {service.price != null && (
              <span className="text-neutral-100">€{service.price}</span>
            )}

            {service.compareAtPrice != null &&
              service.price != null &&
              service.compareAtPrice > service.price && (
                <span className="text-neutral-500 line-through">
                  €{service.compareAtPrice}
                </span>
              )}
          </div>

          <div className="mt-3 text-xs text-neutral-500">
            Availability score: {Math.round((service.availabilityScore ?? 0) * 100)}%
          </div>
        </button>
      ))}
    </div>
  );
}
