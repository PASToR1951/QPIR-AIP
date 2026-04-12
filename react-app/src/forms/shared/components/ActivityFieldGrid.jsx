import React from 'react';

function resolveValue(value, context) {
  return typeof value === 'function' ? value(context) : value;
}

function resolveFieldKey(field, index) {
  if (field.key) return field.key;
  if (field.id) return field.id;
  return `field-${index}`;
}

const DEFAULT_GRID_CLASSNAMES = {
  wizard: 'grid grid-cols-1 gap-4 md:grid-cols-2',
  mobile: 'grid grid-cols-1 gap-4 md:grid-cols-2',
  desktop: 'grid grid-cols-1 gap-4',
};

const DEFAULT_LABEL_CLASSNAME = 'mb-1 block text-[10px] font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400';

export default React.memo(function ActivityFieldGrid({
  fields = [],
  activity,
  context,
  variant = 'wizard',
  className,
}) {
  if (!fields.length) {
    return null;
  }

  const gridClassName = className ?? DEFAULT_GRID_CLASSNAMES[variant] ?? DEFAULT_GRID_CLASSNAMES.wizard;

  return (
    <div className={gridClassName}>
      {fields.map((field, index) => {
        const fieldContext = { activity, context, variant, field, index };
        const wrapperClassName = resolveValue(field.wrapperClassName, fieldContext);
        const label = resolveValue(field.label, fieldContext);
        const labelClassName = resolveValue(field.labelClassName, fieldContext) ?? DEFAULT_LABEL_CLASSNAME;
        const content = field.render?.(fieldContext);

        if (content == null) {
          return null;
        }

        return (
          <div key={resolveFieldKey(field, index)} className={wrapperClassName}>
            {!field.hideLabel && label ? (
              <label className={labelClassName}>
                {label}
              </label>
            ) : null}
            {content}
          </div>
        );
      })}
    </div>
  );
});
