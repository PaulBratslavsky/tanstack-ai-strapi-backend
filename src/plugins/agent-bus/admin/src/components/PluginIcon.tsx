import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import { useTheme } from 'styled-components';

/**
 * Robot head icon for the Agent Bus menu link.
 *
 * @strapi/icons has no robot, so this mirrors how their icons are built:
 * 32x32 viewBox, a single <path> (the admin nav recolours `svg path` on
 * hover/active), `fill` accepts a theme colour token such as "neutral500"
 * or any CSS colour (default currentColor), and the host's width/height
 * props are passed through (the main nav renders icons at 20x20).
 */
const ROBOT_PATH =
  // antenna ball + stem
  'M16 1a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM15 6h2v3h-2Z' +
  // ears
  'M2.5 15A1.5 1.5 0 0 1 4 16.5v5a1.5 1.5 0 0 1-3 0v-5A1.5 1.5 0 0 1 2.5 15Z' +
  'M29.5 15a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-3 0v-5a1.5 1.5 0 0 1 1.5-1.5Z' +
  // head, with eyes and mouth cut out (evenodd)
  'M9 9h14a5 5 0 0 1 5 5v12a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V14a5 5 0 0 1 5-5Z' +
  'm2.5 6a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Zm9 0a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z' +
  'M11 24a1 1 0 1 0 0 2h10a1 1 0 1 0 0-2H11Z';

const RobotIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ fill = 'currentColor', stroke, ...props }, ref) => {
    const theme = useTheme() as { colors?: Record<string, string> } | undefined;
    const colors = theme?.colors ?? {};
    const resolvedFill = fill && fill in colors ? colors[fill] : fill;
    const resolvedStroke = stroke && stroke in colors ? colors[stroke] : stroke;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 32 32"
        width={16}
        height={16}
        fill={resolvedFill}
        stroke={resolvedStroke}
        aria-hidden="true"
        focusable="false"
        ref={ref}
        {...props}
      >
        <path fillRule="evenodd" clipRule="evenodd" d={ROBOT_PATH} />
      </svg>
    );
  }
);

RobotIcon.displayName = 'RobotIcon';

const PluginIcon = RobotIcon;

export { PluginIcon, RobotIcon };
