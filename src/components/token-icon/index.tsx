import { useMemo } from 'react';
import classNames from 'classnames';
import { nanoid } from 'nanoid';

import s from './s.module.scss';

export type TokenIconNames =
  | 'aave'
  | 'stkaave'
  | 'cream'
  | 'bond'
  | 'compound'
  | 'cream'
  | 'yearn'
  | 'polygon'
  | 'bond'
  | 'usdc'
  | 'dai'
  | 'rai'
  | 'susd'
  | 'eth'
  | 'wbtc'
  | 'gusd'
  | 'usdt'
  | 'sy-pools'
  | 'unknown'
  | 'weth'
  | 'fiat'
  | 'usd'
  | 'uniswap'
  | 'wmatic'
  | 'xsushi'
  | 'link'
  | 'uni'
  | 'fei'
  | 'all';

type TokenIconProps = {
  name: TokenIconNames;
  bubble1Name?: TokenIconNames;
  bubble2Name?: TokenIconNames;
  size?: number | string;
  className?: string;
  style?: React.CSSProperties;
  outline?: 'green' | 'purple' | ['green', 'purple'] | ['purple', 'green'];
};

const staticNames: TokenIconNames[] = ['aave', 'stkaave', 'cream', 'bond', 'uniswap', 'rai', 'xsushi'];

const svgPath = `${process.env.PUBLIC_URL}/token-icons-sprite.svg`;

export const TokenIcon: React.FC<TokenIconProps> = props => {
  const { name, size = 24, className, style, bubble1Name, bubble2Name, outline, ...rest } = props;

  const id = useMemo(nanoid, []);

  return (
    <svg className={classNames(s.tokenIcon, className)} width={size} height={size} style={style} {...rest}>
      <mask id={id}>
        <circle cx="50%" cy="50%" r="50%" fill="white" />
        {bubble1Name && <circle cx="80%" cy="20%" r="25%" fill="black" />}
        {bubble2Name && <circle cx="80%" cy="80%" r="25%" fill="black" />}
      </mask>
      <mask id={`${id}-outline`}>
        <circle cx="50%" cy="50%" r="50%" fill="black" />
        <circle cx="50%" cy="50%" r="42%" fill="white" />
      </mask>
      <g mask={bubble1Name || bubble2Name ? `url(#${id})` : ''}>
        <g mask={outline ? `url(#${id}-outline)` : ''}>
          <use xlinkHref={`${staticNames.includes(name) ? '' : svgPath}#icon__${name}`} />
        </g>
        {outline ? (
          <>
            <defs>
              <linearGradient id={`${id}-gradient`} gradientTransform="rotate(90)">
                {getOutlineColor(outline)}
              </linearGradient>
            </defs>
            <circle cx="50%" cy="50%" r="48%" fill="none" strokeWidth="4%" stroke={`url(#${id}-gradient)`} />
          </>
        ) : null}
      </g>

      {bubble1Name && (
        <use
          xlinkHref={`${staticNames.includes(bubble1Name) ? '' : svgPath}#icon__${bubble1Name}`}
          width="40%"
          height="40%"
          x="60%"
          y="0"
        />
      )}
      {bubble2Name && (
        <use
          xlinkHref={`${staticNames.includes(bubble2Name) ? '' : svgPath}#icon__${bubble2Name}`}
          width="40%"
          height="40%"
          x="60%"
          y="60%"
        />
      )}
    </svg>
  );
};

function getOutlineColor(outline: TokenIconProps['outline']) {
  if (Array.isArray(outline)) {
    return (
      <>
        <stop offset="0%" stop-color={`var(--theme-${outline[0]}-color)`} />
        <stop offset="50%" stop-color={`var(--theme-${outline[0]}-color)`} />
        <stop offset="50%" stop-color={`var(--theme-${outline[1]}-color)`} />
        <stop offset="100%" stop-color={`var(--theme-${outline[1]}-color)`} />
      </>
    );
  }

  return (
    <>
      <stop offset="0%" stop-color={`var(--theme-${outline}-color)`} />
      <stop offset="100%" stop-color={`var(--theme-${outline}-color)`} />
    </>
  );
}

export type TokenPairProps = {
  name1: TokenIconNames;
  name2: TokenIconNames;
  size?: number;
  gap?: number;
  className?: string;
  style?: React.CSSProperties;
};

export const TokenIconPair: React.FC<TokenPairProps> = props => {
  const { name1, name2, size = 40, gap = 2, className, style } = props;
  const id = useMemo(nanoid, []);

  if (!name1 || !name2) {
    return null;
  }

  const iconSize = size * 0.75;
  const iconIndent = size - iconSize;
  const cutSize = iconSize / 2 + gap;

  return (
    <svg width={size} height={size} className={classNames(className, s.tokenIconPair)} style={style}>
      <mask id={id}>
        <rect width={size} height={size} fill="white" />
        <circle cx={iconSize / 2} cy={iconSize / 2 + iconIndent} r={cutSize} fill="black" />
      </mask>
      <use
        xlinkHref={`${staticNames.includes(name1) ? '' : svgPath}#icon__${name1}`}
        width={iconSize}
        height={iconSize}
        x="0"
        y={iconIndent}
      />
      <g mask={`url(#${id})`}>
        <use
          xlinkHref={`${staticNames.includes(name2) ? '' : svgPath}#icon__${name2}`}
          width={iconSize}
          height={iconSize}
          x={iconIndent}
          y="0"
        />
      </g>
    </svg>
  );
};
