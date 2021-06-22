import { ButtonHTMLAttributes, FC, ReactNode, forwardRef } from 'react';
import cn from 'classnames';

import { DropdownList } from 'components/custom/dropdown';
import Icon, { TokenIconNames } from 'components/custom/icon';
import { Slider } from 'components/custom/slider';
import { Text } from 'components/custom/typography';
import { KnownTokens, getTokenBySymbol } from 'components/providers/known-tokens-provider';

import s from './s.module.scss';

type TokenAmountType = {
  value: string;
  onChange: (value: string) => void;
  before: ReactNode;
  secondary?: ReactNode;
  className?: string;
  classNameBefore?: string;
  placeholder?: string;
  disabled?: boolean;
  max?: number;
  slider?: boolean;
  decimals?: number;
  error?: string;
};

export const TokenAmount: FC<TokenAmountType> = forwardRef<HTMLInputElement, TokenAmountType>(
  ({ onChange, before, secondary, className, classNameBefore, slider, error, decimals = 6, ...rest }, ref) => {
    return (
      <div className={className}>
        <div className={s.tokenAmount}>
          {before && <div className={cn(s.tokenAmountBefore, classNameBefore)}>{before}</div>}
          <div className={s.tokenAmountValues}>
            <input
              ref={ref}
              className={s.tokenAmountValue}
              type="text"
              onWheel={ev => {
                ev.currentTarget.blur();
              }}
              onChange={e => {
                onChange(e.target.value);
              }}
              {...rest}
            />
            <div className={s.tokenAmountHint}>{secondary}</div>
          </div>
          {Number.isFinite(rest.max) && (
            <button
              type="button"
              className="button-ghost"
              style={{ alignSelf: 'center' }}
              disabled={rest.disabled || rest.max === 0}
              onClick={() => onChange(String(rest.max))}>
              MAX
            </button>
          )}
        </div>
        {Number(rest.value) > Number(rest.max) && (
          <Text type="small" weight="semibold" color="red" style={{ marginTop: '8px' }}>
            insufficient balance
          </Text>
        )}
        {slider && Number.isFinite(rest.max) ? (
          <Slider
            type="range"
            className={s.tokenAmountSlider}
            min="0"
            max={rest.max}
            step={1 / 10 ** Math.min(decimals, 6)}
            value={rest.value ?? 0}
            disabled={rest.disabled || rest.max === 0}
            onChange={e => {
              onChange(e.target.value);
            }}
          />
        ) : null}
      </div>
    );
  },
);

type TokenAmountPreviewType = {
  value?: string;
  before: ReactNode;
  secondary?: ReactNode;
  className?: string;
  classNameBefore?: string;
};

export const TokenAmountPreview: FC<TokenAmountPreviewType> = ({
  value,
  before,
  secondary,
  className,
  classNameBefore,
}) => {
  return (
    <div className={cn(s.tokenAmountPreview, className)}>
      {before && <div className={cn(s.tokenAmountPreviewBefore, classNameBefore)}>{before}</div>}
      <div className={s.tokenAmountPreviewValues}>
        <input className={s.tokenAmountPreviewValue} type="text" value={value || ''} readOnly />
        <div className={s.tokenAmountPreviewHint}>{secondary}</div>
      </div>
    </div>
  );
};

type TokenSelectType = {
  value: KnownTokens;
  onChange: (value: KnownTokens) => void;
  tokens: KnownTokens[];
  className?: string;
  style?: React.CSSProperties;
};

export const TokenSelect: FC<TokenSelectType> = ({ value, onChange, tokens, className, style }) => {
  const foundToken = getTokenBySymbol(value);

  return (
    <DropdownList
      items={tokens.reduce((acc: ButtonHTMLAttributes<HTMLButtonElement>[], token) => {
        const found = getTokenBySymbol(token);
        if (!found) return acc;
        return [
          ...acc,
          {
            onClick: () => {
              onChange(token as KnownTokens);
            },
            children: (
              <>
                <Icon name={getTokenBySymbol(token)?.icon as TokenIconNames} className="mr-8" />
                {getTokenBySymbol(token)?.name}
              </>
            ),
            'aria-selected': foundToken?.symbol === found.symbol ? 'true' : 'false',
          },
        ];
      }, [])}>
      {({ ref, setOpen, open }) => (
        <button
          type="button"
          ref={ref}
          onClick={() => setOpen(isOpen => !isOpen)}
          className={cn(s.tokenAmountSelectToken, className)}
          style={style}>
          {foundToken ? (
            <Icon name={foundToken.icon as TokenIconNames} width={24} height={24} className="mr-16" />
          ) : null}
          <Text type="p1" weight="semibold" color="primary">
            {foundToken?.symbol}
          </Text>
          <Icon
            name="dropdown"
            width="24"
            height="24"
            className="token-select-chevron"
            style={{
              marginLeft: 4,
              transform: open ? 'rotate(180deg)' : '',
            }}
          />
        </button>
      )}
    </DropdownList>
  );
};
