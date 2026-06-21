import React from 'react';
import { autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react';

/** 与 SectionText 保持一致的 2K 基准宽度 */
const BASE_VIEWPORT_WIDTH = 2560;

function pxToVw(px: number): string {
  return `${(px / BASE_VIEWPORT_WIDTH) * 100}vw`;
}

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  placement?: 'top' | 'bottom';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  placement = 'top',
}) => {
  const [open, setOpen] = React.useState(false);

  const {
    x,
    y,
    strategy,
    refs: { setReference, setFloating },
  } = useFloating({
    open,
    placement: placement === 'top' ? 'top' : 'bottom',
    middleware: [
      offset(12), // 与原 mb-3 / mt-3 接近
      flip(),
      shift({ padding: 8 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <span
      ref={setReference}
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {open && (
        <div
          ref={setFloating}
          className="pointer-events-none z-50 whitespace-pre-wrap rounded-md bg-white/95 px-4 py-3 text-black shadow-lg"
          style={{
            textAlign: 'left',
            textAlignLast: 'left',
            wordBreak: 'break-word',
            letterSpacing: 'normal',
            position: strategy,
            top: y ?? 0,
            left: x ?? 0,
            fontSize: pxToVw(26),
            lineHeight: 1.6,
            minWidth: '22vw',
            maxWidth: '36vw',
          }}
        >
          {content}
        </div>
      )}
    </span>
  );
};

