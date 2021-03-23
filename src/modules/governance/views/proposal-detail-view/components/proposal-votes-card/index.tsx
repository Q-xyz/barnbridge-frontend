import React from 'react';
import { formatBigValue } from 'web3/utils';

import Alert from 'components/antd/alert';
import Button from 'components/antd/button';
import Card from 'components/antd/card';
import Progress from 'components/antd/progress';
import Grid from 'components/custom/grid';
import { Text } from 'components/custom/typography';
import { APIProposalState } from 'modules/governance/api';

import { useProposal } from '../../providers/ProposalProvider';
import ProposalVoteModal, { VoteState } from '../proposal-vote-modal';
import ProposalVotersModal from '../proposal-voters-modal';

import s from './s.module.scss';

type ProposalVotesCardState = {
  showVotersModal: boolean;
  showVoteModal: boolean;
  voteState: VoteState;
};

const InitialState: ProposalVotesCardState = {
  showVotersModal: false,
  showVoteModal: false,
  voteState: VoteState.None,
};

const ProposalVotesCard: React.FC = () => {
  const proposalCtx = useProposal();

  const [state, setState] = React.useState<ProposalVotesCardState>(InitialState);

  function handleShowVotersModal() {
    setState(prevState => ({
      ...prevState,
      showVotersModal: true,
    }));
  }

  function handleHideVotersModal() {
    setState(prevState => ({
      ...prevState,
      showVotersModal: false,
    }));
  }

  function handleVoteForModal() {
    setState(prevState => ({
      ...prevState,
      showVoteModal: true,
      voteState: VoteState.VoteFor,
    }));
  }

  function handleVoteAgainstModal() {
    setState(prevState => ({
      ...prevState,
      showVoteModal: true,
      voteState: VoteState.VoteAgainst,
    }));
  }

  function handleVoteChangeModal() {
    setState(prevState => ({
      ...prevState,
      showVoteModal: true,
      voteState: VoteState.VoteChange,
    }));
  }

  function handleVoteCancelModal() {
    setState(prevState => ({
      ...prevState,
      showVoteModal: true,
      voteState: VoteState.VoteCancel,
    }));
  }

  function handleHideVoteModal() {
    setState(prevState => ({
      ...prevState,
      showVoteModal: false,
      voteState: VoteState.None,
    }));
  }

  if (proposalCtx.proposal?.state === APIProposalState.WARMUP) {
    return (
      <Card
        className={s.component}
        title={
          <Text type="p1" weight="semibold" color="primary">
            Votes
          </Text>
        }>
        <div className="p-24">
          <Alert type="info" message="Voting on this proposal will start after the Warm-Up period ends." />
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={s.component}
      title={
        <Text type="p1" weight="semibold" color="primary">
          Votes
        </Text>
      }
      extra={
        <Button type="link" onClick={handleShowVotersModal}>
          View voters
        </Button>
      }>
      <Grid flow="row" gap={32} className={s.row}>
        <Grid flow="row" gap={16}>
          <Grid flow="col" justify="space-between">
            <Text type="p1" weight="semibold" color="primary">
              For
            </Text>
            <Grid flow="col" gap={8}>
              <Text type="p1" weight="semibold" color="primary">
                {proposalCtx.proposal?.forVotes.toFormat(2)}
              </Text>
              <Text type="p1" color="secondary">
                ({proposalCtx.forRate?.toFixed(2)}%)
              </Text>
            </Grid>
          </Grid>
          <Progress
            percent={proposalCtx.forRate}
            strokeColor="var(--theme-green-color)"
            trailColor="rgba(var(--theme-green-color-rgb), .16)"
          />
        </Grid>
        <Grid flow="row" gap={16}>
          <Grid flow="col" justify="space-between">
            <Text type="p1" weight="semibold" color="primary">
              Against
            </Text>
            <Grid flow="col" gap={8}>
              <Text type="p1" weight="semibold" color="primary">
                {proposalCtx.proposal?.againstVotes.toFormat(2)}
              </Text>
              <Text type="p1" color="secondary">
                ({proposalCtx.againstRate?.toFixed(2)}%)
              </Text>
            </Grid>
          </Grid>
          <Progress
            percent={proposalCtx.againstRate}
            strokeColor="var(--theme-red-color)"
            trailColor="rgba(var(--theme-red-color-rgb), .16)"
          />
        </Grid>
      </Grid>
      <Grid flow="row" gap={24} className={s.row}>
        <Grid flow="row" gap={8}>
          <Text type="p1" color="secondary">
            Your voting power for this proposal
          </Text>
          <Text type="p1" weight="semibold" color="primary">
            {formatBigValue(proposalCtx.votingPower, 2)}
          </Text>
        </Grid>
        <Grid flow="row" gap={24}>
          {!proposalCtx.receipt?.hasVoted ? (
            <Grid gap={24} colsTemplate="1fr 1fr">
              <Button type="primary" className={s.actionBtn} onClick={handleVoteForModal}>
                Vote for
              </Button>
              <Button type="default" className={s.actionBtn} onClick={handleVoteAgainstModal}>
                Vote against
              </Button>
            </Grid>
          ) : (
            <>
              <Alert message={`You already voted ${proposalCtx.receipt?.support ? 'FOR' : 'AGAINST'} the proposal`} />
              <Grid flow="col" gap={24} colsTemplate="1fr 1fr">
                <Button type="primary" className={s.actionBtn} onClick={handleVoteChangeModal}>
                  Change vote
                </Button>
                <Button type="default" className={s.actionBtn} onClick={handleVoteCancelModal}>
                  Cancel vote
                </Button>
              </Grid>
            </>
          )}
        </Grid>
      </Grid>

      {state.showVotersModal && <ProposalVotersModal onCancel={handleHideVotersModal} />}

      {state.showVoteModal && <ProposalVoteModal voteState={state.voteState} onCancel={handleHideVoteModal} />}
    </Card>
  );
};

export default ProposalVotesCard;
