/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useContext} from 'react';
import {enableProfilerPerfInsights} from 'react-devtools-feature-flags';
import {ProfilerContext} from '../Profiler/ProfilerContext';
import {StoreContext} from '../context';

import styles from './PerfInsight.css';

type Props = {|
  fiberID: number,
|};

export default function PerfInsight({fiberID}: Props) {
  const {profilerStore} = useContext(StoreContext);
  const {rootID, selectedCommitIndex} = useContext(ProfilerContext);

  if (!enableProfilerPerfInsights) {
    return null;
  }

  // TRICKY
  // Handle edge case where no commit is selected because of a min-duration filter update.
  // If the commit index is null, suspending for data below would throw an error.
  // TODO (ProfilerContext) This check should not be necessary.
  if (selectedCommitIndex === null) {
    return null;
  }

  const {perfInsights} = profilerStore.getCommitData(
    ((rootID: any): number),
    selectedCommitIndex,
  );

  if (perfInsights === null) {
    return null;
  }

  const perfInsight = perfInsights.get(fiberID);
  if (perfInsight == null) {
    return null;
  }

  const {
    isFirstMount,
    didContextChange,
    didContextDeepChange,
    didHooksChange,
    didHooksDeeplyChange,
    hooksNeedingMemoization,
    didPropsChange,
    didPropsDeepChange,
    propsNeedingMemoization,
    didStateChange,
    didStateDeepChange,
  } = perfInsight;

  if (isFirstMount) {
    return null;
  }

  const insights = [];

  if (!didContextChange && didContextDeepChange) {
    insights.push(
      <div key="context" className={styles.Item}>
        • Context deep value changed
      </div>,
    );
  }

  // If context and hooks didn't change and  props/state are shallow equal,
  // then this component needs basic memo.
  if (
    !didContextChange &&
    !didHooksChange &&
    !didPropsChange &&
    !didStateChange
  ) {
    insights.push(
      <div className={styles.Item}>
        • Use React.PureComponent or React.Memo to avoid this component
        rendering.
      </div>,
    );
  }

  if (hooksNeedingMemoization != null && hooksNeedingMemoization.length > 0) {
    const hooksList = hooksNeedingMemoization.map(key => (
      <span key={key} className={styles.Key}>
        {key}
      </span>
    ));
    insights.push(
      <div className={styles.Item}>
        {didHooksDeeplyChange
          ? '• Some hooks could avoid updating by using memoization:'
          : '• This component could avoid updating by using memoization for hooks:'}
        {hooksList}
      </div>,
    );
  }

  if (didPropsChange && !didPropsDeepChange) {
    insights.push(
      <div className={styles.Item}>
        • Use shouldComponentUpdate or React.Memo with deep equality to avoid
        this component rendering.
      </div>,
    );
  }

  if (didStateChange && !didStateDeepChange) {
    insights.push(
      <div className={styles.Item}>
        • Use shouldComponentUpdate with deep equality to avoid this component
        rendering.
      </div>,
    );
  }

  if (propsNeedingMemoization != null && propsNeedingMemoization.length > 0) {
    insights.push(
      <div className={styles.Item}>
        • Can't deep compare props:
        {propsNeedingMemoization.map(key => (
          <span key={key} className={styles.Key}>
            {key}
          </span>
        ))}
        . Consider memorizing these to avoid rendering.
      </div>,
    );
  }

  if (insights.length === 0) {
    insights.push(
      <div key="context" className={styles.Item}>
        • No insights available.
      </div>,
    );
  }

  return (
    <div className={styles.Component}>
      <label className={styles.Label}>Performance insights:</label>
      {insights}
    </div>
  );
}
