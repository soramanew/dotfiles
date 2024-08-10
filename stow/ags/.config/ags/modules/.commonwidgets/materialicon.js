export const MaterialIcon = (icon, size, props = {}) =>
    Widget.Label({
        className: `icon-material txt-${size}`,
        label: icon,
        ...props,
    });
