import { FC, useEffect, useMemo, useRef, useState } from 'react';
import AntdNotification from 'antd/lib/notification';
import AntdSwitch from 'antd/lib/switch';
import uniqueId from 'lodash/uniqueId';
import { AbiInterface } from 'web3/abiInterface';

import Alert from 'components/antd/alert';
import Input from 'components/antd/input';
import Modal, { ConfirmActionModal, ModalProps } from 'components/antd/modal';
import Select from 'components/antd/select';
import Textarea from 'components/antd/textarea';
import YesNoSelector from 'components/antd/yes-no-selector';
import { FieldLabel, Form, FormArray, FormItem, useForm } from 'components/custom/form';
import { Spinner } from 'components/custom/spinner';
import { Hint, Text } from 'components/custom/typography';
import AddZerosPopup from 'modules/governance/components/add-zeros-popup';
import SimulatedProposalActionModal from 'modules/governance/modals/simulated-proposal-action-modal';
import { useConfig } from 'providers/configProvider';
import { useWeb3 } from 'providers/web3Provider';

import s from 'modules/governance/modals/create-proposal-action-modal/s.module.scss';

type FunctionInputType = {
  name: string;
  type: string;
  value: string;
};

type FormType = {
  targetAddress: string;
  isProxyAddress: boolean;
  implementationAddress: string;
  addValueAttribute: boolean | null;
  actionValue: string;
  addFunctionCall: boolean | null;
  functionSignature: string;
  functionInputs: FunctionInputType[];
};

export type ProposalAction = FormType & {
  id: string;
  encodedParams: string;
};

type Props = ModalProps & {
  actions: ProposalAction[];
  value: ProposalAction | undefined;
  onSubmit: (values: ProposalAction) => void;
};

const CreateProposalActionModal: FC<Props> = props => {
  const config = useConfig();
  const { getContractAbi, tryCall } = useWeb3();

  const isEditMode = Boolean(props.value);

  const form = useForm<FormType>({
    defaultValues: {
      targetAddress: '',
      isProxyAddress: false,
      implementationAddress: '',
      addValueAttribute: null,
      actionValue: '',
      addFunctionCall: null,
      functionSignature: '',
      functionInputs: [],
      ...props.value,
    },
    validationScheme: {
      targetAddress: {
        rules: {
          required: true,
        },
        messages: {
          required: 'Value is required.',
        },
      },
      implementationAddress: {
        rules: {
          required: (value, rule, obj) => {
            if (obj.isProxyAddress) {
              return Boolean(value);
            }

            return true;
          },
        },
        messages: {
          required: 'Value is required.',
        },
      },
      addValueAttribute: {
        rules: {
          required: value => {
            return value !== null;
          },
          atLeastOne: (value, rule, obj) => {
            return value !== false || obj.addFunctionCall !== false;
          },
        },
        messages: {
          required: 'Selection is required.',
          atLeastOne: ' ',
        },
      },
      addFunctionCall: {
        rules: {
          required: value => {
            return value !== null;
          },
        },
        messages: {
          required: 'Selection is required.',
        },
      },
    },
  });

  const formRef = useRef(form);
  formRef.current = form;

  const { formState, watch } = form;
  const { isDirty } = formState;
  const [
    targetAddress,
    isProxyAddress,
    implementationAddress,
    addValueAttribute,
    actionValue,
    addFunctionCall,
    functionSignature,
    functionInputs,
  ] = watch([
    'targetAddress',
    'isProxyAddress',
    'implementationAddress',
    'addValueAttribute',
    'actionValue',
    'addFunctionCall',
    'functionSignature',
    'functionInputs',
  ]);

  const [abiLoading, setAbiLoading] = useState(false);
  const [abiInterface, setAbiInterface] = useState<AbiInterface | undefined>();
  const [isSubmitting, setSubmitting] = useState(false);
  const [isDirtyClose, setDirtyClose] = useState(false);
  const [isSimulatedActionModal, showSimulatedActionModal] = useState(false);

  const abiAddress = isProxyAddress ? implementationAddress : targetAddress;

  const abiFunctionOptions = useMemo(() => {
    return (
      abiInterface?.writableFunctions.map(fn => ({
        label: fn.format(),
        value: fn.format(),
      })) ?? []
    );
  }, [abiInterface]);

  const abiSelectedFunction = useMemo(() => {
    return abiInterface?.writableFunctions.find(fn => fn.format() === functionSignature);
  }, [abiInterface, functionSignature]);

  const abiSelectedFunctionParams = useMemo(() => {
    const params =
      abiSelectedFunction?.inputs.map(({ name, type }) => ({
        name,
        type,
      })) ?? [];
    const paramsStr = JSON.stringify(params, null, 2);
    return `Parameters:\n${paramsStr}`;
  }, [abiSelectedFunction]);

  const abiSelectedFunctionEncoded = useMemo(() => {
    const paramsValues = functionInputs.map(input => input.value);
    return abiSelectedFunction ? AbiInterface.encodeFunctionData(abiSelectedFunction, paramsValues) ?? '0x' : '0x';
  }, [abiSelectedFunction, functionInputs]);

  const abiSelectedFunctionEncodedRef = useRef(abiSelectedFunctionEncoded);
  abiSelectedFunctionEncodedRef.current = abiSelectedFunctionEncoded;

  useEffect(() => {
    if (!addFunctionCall) {
      return;
    }

    setAbiInterface(undefined);
    formRef.current.updateValue('functionSignature', '');
    formRef.current.updateValue('functionInputs', []);

    if (!abiAddress) {
      return;
    }

    (async () => {
      setAbiLoading(true);

      try {
        const abi = await getContractAbi(abiAddress);

        if (abi) {
          setAbiInterface(new AbiInterface(abi as any));

          if (isEditMode) {
            formRef.current.updateValue('functionSignature', props.value?.functionSignature ?? '');
            formRef.current.updateValue('functionInputs', props.value?.functionInputs ?? []);
          }
        }
      } catch (e) {
        console.error(e);
      }

      setAbiLoading(false);
    })();
  }, [addFunctionCall, abiAddress, getContractAbi]);

  useEffect(() => {
    if (!abiSelectedFunction) {
      return;
    }

    const inputs = abiSelectedFunction.inputs.map(input => ({
      name: input.name,
      type: input.type,
      value: '',
    }));

    formRef.current.updateValue('functionInputs', inputs);
  }, [abiSelectedFunction]);

  async function tryAction(values: FormType) {
    if (!abiInterface || !abiSelectedFunction || !config.contracts.dao) {
      throw new Error('Invalid action');
    }

    const params = values.functionInputs.map(input => input.value);
    const encodedFunction = abiInterface.encodeFunctionData(abiSelectedFunction, params);

    await tryCall(
      values.targetAddress,
      config.contracts.dao.governance,
      encodedFunction ?? '0x',
      values.actionValue ?? '',
    );
  }

  function handleCancel() {
    if (isDirty) {
      setDirtyClose(true);
    } else {
      props.onCancel();
    }
  }

  function save() {
    const values = formRef.current.getValues();
    const actionId = props.value?.id ?? uniqueId('action-');

    props.onSubmit({
      ...values,
      id: actionId,
      encodedParams: abiSelectedFunctionEncoded,
    });
  }

  async function handleSubmit(values: FormType) {
    const hasSimilar = props.actions.some(action => {
      return (
        action.targetAddress === values.targetAddress &&
        action.actionValue === values.actionValue &&
        action.functionSignature === values.functionSignature &&
        action.encodedParams === abiSelectedFunctionEncoded
      );
    });

    if (hasSimilar) {
      AntdNotification.error({
        message: 'Duplicate actions are disallowed!',
      });
    }

    try {
      setSubmitting(true);
      await tryAction(values);
      setSubmitting(false);
      save();
    } catch (e) {
      console.error(e);
      setSubmitting(false);
      showSimulatedActionModal(true);
    }
  }

  return (
    <Modal className={s.component} {...props} onCancel={handleCancel}>
      <Form form={form} disabled={isSubmitting} onSubmit={handleSubmit}>
        <div className="container-thin flex flow-row row-gap-32">
          <Text type="h2" weight="semibold" color="primary">
            {props.value ? 'Edit action' : 'Add new action'}
          </Text>
          <div className="flex flow-row row-gap-8">
            <FormItem
              name="targetAddress"
              label="Target address"
              labelProps={{
                hint: 'This is the address to which the transaction will be sent.',
              }}>
              {({ field }) => <Input value={field.value} onChange={field.onChange} />}
            </FormItem>
            <div className="flex flow-col align-center justify-space-between">
              <Hint text="In case you are using a proxy address as the target, please specify the address where the function implementation is found.">
                <Text type="small" weight="semibold" color="secondary">
                  Is this a proxy address?
                </Text>
              </Hint>
              <FormItem name="isProxyAddress">
                {({ field }) => <AntdSwitch checked={field.value} onChange={field.onChange} />}
              </FormItem>
            </div>
            {isProxyAddress && (
              <FormItem name="implementationAddress">
                {({ field }) => (
                  <Input placeholder="Implementation address" value={field.value} onChange={field.onChange} />
                )}
              </FormItem>
            )}
          </div>
          <FormItem
            name="addValueAttribute"
            label="Add a value attribute to your action?"
            labelProps={{
              hint: 'This field allows you to send some ETH along with your transaction.',
            }}>
            {({ field }) => <YesNoSelector value={field.value} onChange={field.onChange} />}
          </FormItem>
          {addValueAttribute && (
            <FormItem
              name="actionValue"
              label={
                <div className="flex flow-col col-gap-8">
                  <Text type="small" weight="semibold" color="secondary">
                    Action Value
                  </Text>
                  <AddZerosPopup
                    value={actionValue}
                    onSubmit={value => formRef.current.updateValue('actionValue', value)}
                  />
                </div>
              }>
              {({ field }) => <Input value={field.value} onChange={field.onChange} />}
            </FormItem>
          )}

          <FormItem
            name="addFunctionCall"
            label="Add a function call to your action?"
            labelProps={{
              hint: 'This field allows you to call a function on a smart contract.',
            }}>
            {({ field }) => <YesNoSelector value={field.value} onChange={field.onChange} />}
          </FormItem>

          {addFunctionCall && (
            <>
              <FormItem name="functionSignature" label="Select function">
                {({ field }) => (
                  <Select
                    loading={abiLoading}
                    options={abiFunctionOptions}
                    fixScroll
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              </FormItem>
              <FormArray name="functionInputs">
                {({ fields }) =>
                  fields.map((input, index) => (
                    <div key={input.name ?? String(index)} className="flex flow-row row-gap-8">
                      <div className="flex flow-col col-gap-8">
                        <Text type="small" weight="semibold" color="secondary">
                          {input.name} ({input.type})
                        </Text>
                        {/(u?int\d+)/g.test(input.type) && (
                          <AddZerosPopup
                            value={formRef.current.getValues().functionInputs[index].value}
                            onSubmit={value =>
                              formRef.current.updateValue(`functionInputs.${index}.value` as const, value)
                            }
                          />
                        )}
                      </div>
                      <FormItem name={`functionInputs.${index}.value`}>
                        {({ field }) => (
                          <Input
                            placeholder={`${input.name} (${input.type})`}
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      </FormItem>
                    </div>
                  ))
                }
              </FormArray>
              {abiSelectedFunction && (
                <>
                  <FieldLabel label={`Function type: ${abiSelectedFunction.name}`}>
                    <Textarea className={s.textarea} rows={5} value={abiSelectedFunctionParams} disabled />
                  </FieldLabel>
                  <FieldLabel label="Hex data">
                    <Textarea
                      className={s.textarea}
                      rows={5}
                      placeholder="Fill in the arguments above"
                      value={abiSelectedFunctionEncoded}
                      disabled
                    />
                  </FieldLabel>
                </>
              )}
              {abiAddress && !abiLoading && !abiInterface && (
                <Alert
                  type="error"
                  message="The target address you entered is not a validated contract address. Please check the information you entered and try again"
                />
              )}
            </>
          )}

          {addValueAttribute === false && addFunctionCall === false && (
            <Alert
              type="error"
              message="You need to provide at least one: a value attribute or a function call to your action"
            />
          )}

          <div className="flex flow-col justify-space-between">
            <button type="button" className="button-ghost-monochrome" onClick={handleCancel}>
              {props.value ? 'Cancel changes' : 'Cancel'}
            </button>
            <button type="submit" className="button-primary">
              {isSubmitting && <Spinner className="mr-8" />}
              {props.value ? 'Save changes' : 'Add action'}
            </button>
          </div>
        </div>
      </Form>

      {isDirtyClose && (
        <ConfirmActionModal
          width={460}
          text="Are you sure you want to close this form?"
          onCancel={() => setDirtyClose(false)}
          onOk={() => {
            setDirtyClose(false);
            props.onCancel();
          }}
        />
      )}
      {isSimulatedActionModal && (
        <SimulatedProposalActionModal
          targetAddress={targetAddress}
          functionSignature={functionSignature}
          functionEncodedParams={abiSelectedFunctionEncoded}
          onOk={() => {
            showSimulatedActionModal(false);
            save();
          }}
          onCancel={() => {
            showSimulatedActionModal(false);
          }}
        />
      )}
    </Modal>
  );
};

export default CreateProposalActionModal;
