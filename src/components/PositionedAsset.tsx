import type { CSSProperties, ImgHTMLAttributes } from 'react';

export type AssetPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  canvas: {
    width: number;
    height: number;
  };
  density?: number;
};

type PositionedAssetProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src: string;
  position: AssetPosition;
};

/**
 * Positions an illustration from its adjacent JSON file. The parent must be
 * the full logical canvas and have `position: relative`.
 */
export default function PositionedAsset({
  src,
  position,
  style,
  ...imageProps
}: PositionedAssetProps) {
  const positionStyle: CSSProperties = {
    position: 'absolute',
    left: `${(position.x / position.canvas.width) * 100}%`,
    top: `${(position.y / position.canvas.height) * 100}%`,
    width: `${(position.width / position.canvas.width) * 100}%`,
    height: `${(position.height / position.canvas.height) * 100}%`,
    objectFit: 'fill',
    ...style,
  };

  return <img src={src} style={positionStyle} {...imageProps} />;
}
