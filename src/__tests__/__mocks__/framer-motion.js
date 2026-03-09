/* eslint-disable @typescript-eslint/no-require-imports */
const React = require("react");

const motion = new Proxy({}, {
    get: (_, prop) => {
        const Component = ({ children, ...props }) => {
            const { initial, animate, exit, transition, whileTap, whileHover, layoutId, ...rest } = props;
            return React.createElement(prop, rest, children);
        };
        Component.displayName = `motion.${prop}`;
        return Component;
    },
});

const AnimatePresence = ({ children }) => children;

module.exports = { motion, AnimatePresence };
