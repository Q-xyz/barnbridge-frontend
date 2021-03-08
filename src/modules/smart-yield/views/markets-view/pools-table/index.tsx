import React from 'react';
import { NavLink } from 'react-router-dom';
import { ColumnsType } from 'antd/lib/table/interface';
import BigNumber from 'bignumber.js';
import { formatBigValue, formatUSDValue, getHumanValue } from 'web3/utils';

import Table from 'components/antd/table';
import Tooltip from 'components/antd/tooltip';
import ExternalLink from 'components/custom/externalLink';
import Grid from 'components/custom/grid';
import IconBubble from 'components/custom/icon-bubble';
import { Hint, Text } from 'components/custom/typography';
import { SYMarketMeta } from 'modules/smart-yield/api';
import { Wallet, useWallet } from 'wallets/wallet';

import { PoolsSYPool, usePools } from '../../../providers/pools-provider';

type PoolEntity = PoolsSYPool;

function getTableColumns(wallet: Wallet): ColumnsType<PoolEntity> {
  return [
    {
      title: 'Token Name',
      render: (_, entity) => (
        <Grid flow="col" gap={16} align="center">
          <IconBubble name={entity.meta?.icon} bubbleName={entity.market?.icon} />
          <Grid flow="row" gap={4} className="ml-auto">
            <Text type="p1" weight="semibold" color="primary">
              {entity.underlyingSymbol}
            </Text>
            <Text type="small" weight="semibold" wrap={false}>
              {entity.meta?.name}
            </Text>
          </Grid>
        </Grid>
      ),
    },
    {
      title: 'Senior Liquidity',
      sorter: (a, b) => a.state.seniorLiquidity - b.state.seniorLiquidity,
      align: 'center',
      render: (_, entity) => (
        <Grid flow="row" gap={4}>
          <Tooltip
            title={
              <>
                <Text type="p1" weight="semibold" color="primary">
                  {formatBigValue(entity.state.seniorLiquidity)}
                </Text>
                <Text type="small" weight="semibold" color="secondary">
                  {formatUSDValue(new BigNumber(entity.state.seniorLiquidity))}
                </Text>
              </>
            }>
            <Text type="p1" weight="semibold" color="primary">
              {Intl.NumberFormat('en', { notation: 'compact' }).format(entity.state.seniorLiquidity)}
            </Text>
            <Text type="small" weight="semibold">
              {Intl.NumberFormat('en', { notation: 'compact', style: 'currency', currency: 'USD' }).format(
                entity.state.seniorLiquidity,
              )}
            </Text>
          </Tooltip>
        </Grid>
      ),
    },
    {
      title: 'Senior APY',
      sorter: (a, b) => a.state.seniorApy - b.state.seniorApy,
      render: (_, entity) => (
        <Text type="p1" weight="semibold" color="green">
          {formatBigValue(entity.state.seniorApy * 100)}%
        </Text>
      ),
    },
    {
      title: 'Junior Liquidity',
      sorter: (a, b) => a.state.juniorLiquidity - b.state.juniorLiquidity,
      align: 'center',
      render: (_, entity) => (
        <Grid flow="row" gap={4}>
          <Tooltip
            title={
              <>
                <Text type="p1" weight="semibold" color="primary">
                  {formatBigValue(entity.state.juniorLiquidity)}
                </Text>
                <Text type="small" weight="semibold" color="secondary">
                  {formatUSDValue(new BigNumber(entity.state.juniorLiquidity))}
                </Text>
              </>
            }>
            <Text type="p1" weight="semibold" color="primary">
              {Intl.NumberFormat('en', { notation: 'compact' }).format(entity.state.juniorLiquidity)}
            </Text>
            <Text type="small" weight="semibold">
              {Intl.NumberFormat('en', { notation: 'compact', style: 'currency', currency: 'USD' }).format(
                entity.state.juniorLiquidity,
              )}
            </Text>
          </Tooltip>
        </Grid>
      ),
    },
    {
      title: (
        <Hint
          text={
            <Grid flow="row" gap={8} align="start">
              <Text type="p2">
                The Junior APY is estimated based on the current state of the pool. The actual APY you get for your
                positions might differ.
              </Text>
              <ExternalLink href="#">Learn more</ExternalLink>
            </Grid>
          }>
          Junior APY
        </Hint>
      ),
      sorter: (a, b) => a.state.juniorApy - b.state.juniorApy,
      render: (_, entity) => (
        <Text type="p1" weight="semibold" color="purple">
          {formatBigValue(entity.state.juniorApy * 100)}%
        </Text>
      ),
    },
    {
      title: 'Originator APY',
      sorter: (a, b) => a.state.originatorApy - b.state.originatorApy,
      render: (_, entity) => (
        <Text type="p1" weight="semibold" color="primary">
          {formatBigValue(entity.state.originatorApy * 100)}%
        </Text>
      ),
    },
    {
      title: 'jToken conversion rate',
      render: (_, entity) => (
        <Grid flow="row" gap={4}>
          <Text type="p1" weight="semibold" color="primary">
            1 {entity.underlyingSymbol}
          </Text>
          <Text type="small" weight="semibold" wrap={false}>
            = {formatBigValue(entity.state.jTokenPrice)} j{entity.underlyingSymbol}
          </Text>
        </Grid>
      ),
    },
    ...(wallet.isActive
      ? ([
          {
            title: 'Wallet balance',
            sorter: (a, b) => (a.underlyingBalance?.toNumber() ?? 0) - (b.underlyingBalance?.toNumber() ?? 0),
            render: (_, entity) => (
              <Grid flow="row" gap={4}>
                <Text type="p1" weight="semibold" color="primary">
                  {formatBigValue(getHumanValue(entity.underlyingBalance, entity.underlyingDecimals))}
                </Text>
                <Text type="small" weight="semibold">
                  {formatUSDValue(getHumanValue(entity.underlyingBalance, entity.underlyingDecimals))}
                </Text>
              </Grid>
            ),
          },
        ] as ColumnsType<PoolEntity>)
      : []),
    {
      render(_, entity) {
        return (
          <NavLink
            to={{
              pathname: `/smart-yield/deposit`,
              search: `?m=${entity.protocolId}&t=${entity.underlyingSymbol}`,
            }}
            {...{ disabled: !wallet.isActive }}
            className="button-ghost">
            Deposit
          </NavLink>
        );
      },
    },
  ];
}

type Props = {
  activeMarket?: SYMarketMeta;
};

const PoolsTable: React.FC<Props> = props => {
  const { activeMarket } = props;

  const wallet = useWallet();
  const poolsCtx = usePools();
  const { pools, loading } = poolsCtx;

  const entities = React.useMemo<PoolEntity[]>(() => {
    return pools.filter(pool => !activeMarket || pool.protocolId === activeMarket.id);
  }, [pools, activeMarket]);

  const columns = React.useMemo<ColumnsType<PoolEntity>>(() => {
    return getTableColumns(wallet);
  }, [wallet]);

  return (
    <Table<PoolEntity>
      columns={columns}
      dataSource={entities}
      rowKey={entity => entity.smartYieldAddress}
      loading={loading}
      scroll={{
        x: true,
      }}
    />
  );
};

export default PoolsTable;