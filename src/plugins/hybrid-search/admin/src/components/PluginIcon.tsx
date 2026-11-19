import { forwardRef } from 'react';
import type { SVGProps } from 'react';
import { useTheme } from 'styled-components';

const GLASS_PATH =
  'M13.5 2a8.5 8.5 0 1 0 5.3 15.1l6.6 6.6a1.5 1.5 0 0 0 2.1-2.1l-6.6-6.6A8.5 8.5 0 0 0 13.5 2Zm0 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11Z';

const SearchIcon = forwardRef<SVGSVGElement, SVGProps<SVGSVGElement>>(
  ({ fill = 'currentColor', stroke, ...props }, ref) => {
    const theme = useTheme() as unknown as { colors?: Record<string, string> } | undefined;
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
        <path fillRule="evenodd" clipRule="evenodd" d={GLASS_PATH} />
      </svg>
    );
  }
);

SearchIcon.displayName = 'SearchIcon';

const PluginIcon = SearchIcon;

export { PluginIcon };
