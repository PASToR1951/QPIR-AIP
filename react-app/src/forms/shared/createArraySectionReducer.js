export function updateArrayItemAtIndex(items, index, updater) {
    return items.map((item, currentIndex) => (
        currentIndex === index
            ? (typeof updater === 'function' ? updater(item) : updater)
            : item
    ));
}

export function removeArrayItemAtIndex(items, index, fallbackItems) {
    const nextItems = items.filter((_, currentIndex) => currentIndex !== index);

    if (nextItems.length > 0) {
        return nextItems;
    }

    return typeof fallbackItems === 'function'
        ? fallbackItems()
        : fallbackItems;
}

export function appendArrayItem(items, item) {
    return [...items, item];
}

export function updateArrayItemById(items, id, updater) {
    return items.map((item) => (
        item.id === id
            ? (typeof updater === 'function' ? updater(item) : updater)
            : item
    ));
}

export function resolveExpandedArrayItemId(items, previousExpandedId = null) {
    if (items.length === 0) {
        return null;
    }

    return items.some((item) => item.id === previousExpandedId)
        ? previousExpandedId
        : items[items.length - 1].id;
}

export function appendExpandedArrayItem({
    items,
    item,
    ui,
    uiKey = 'expandedActivityId',
    extraUi = {},
}) {
    const nextItems = appendArrayItem(items, item);

    return {
        items: nextItems,
        ui: {
            ...ui,
            ...extraUi,
            [uiKey]: item.id,
        },
    };
}

export function removeExpandedArrayItem({
    items,
    id,
    ui,
    uiKey = 'expandedActivityId',
    fallbackItems,
}) {
    const nextItems = items.filter((item) => item.id !== id);

    return {
        items: nextItems.length > 0
            ? nextItems
            : (typeof fallbackItems === 'function' ? fallbackItems() : fallbackItems),
        ui: {
            ...ui,
            [uiKey]: resolveExpandedArrayItemId(nextItems, ui?.[uiKey] ?? null),
        },
    };
}

export function replaceExpandedArrayItems({
    nextItems,
    ui,
    uiKey = 'expandedActivityId',
    fallbackItems,
}) {
    return {
        items: nextItems.length > 0
            ? nextItems
            : (typeof fallbackItems === 'function' ? fallbackItems() : fallbackItems),
        ui: {
            ...ui,
            [uiKey]: resolveExpandedArrayItemId(nextItems, ui?.[uiKey] ?? null),
        },
    };
}
