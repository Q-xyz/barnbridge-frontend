import React from 'react';
import * as Antd from 'antd';
import { ModalProps as AntdModalProps } from 'antd/lib/modal';
import cx from 'classnames';

import { ReactComponent as CloseSvg } from 'resources/svg/icons/close.svg';

import s from './styles.module.scss';

export type ModalProps = AntdModalProps & {
  onCancel: (e?: React.MouseEvent<HTMLElement>) => void;
};

const Modal: React.FunctionComponent<ModalProps> = props => {
  const { className, children, ...modalProps } = props;

  return (
    <Antd.Modal
      className={cx(s.component, className)}
      footer={null}
      closeIcon={<CloseSvg />}
      {...modalProps}>
      {children}
    </Antd.Modal>
  );
};

export default Modal;
