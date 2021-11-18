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
    canContextBeMemoized,
    didHooksChange,
    canAllChangedHooksBeMemoized,
    hooksNeedingMemoization,
    didPropsChange,
    canPropsBeMemoized,
    propsNeedingMemoization,
    didStateChange,
    canStateBeMemoized,
  } = perfInsight;

  if (isFirstMount) {
    return null;
  }

  const insights = [];

  if (!didContextChange && canContextBeMemoized) {
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
        {key + 1}
      </span>
    ));
    insights.push(
      <div className={styles.Item}>
        {canAllChangedHooksBeMemoized
          ? '• Avoid this component rendering by using memoization for hooks:'
          : '• Some hooks can be memoized to improve performance, but this component will still render.'}
        {hooksList}
      </div>,
    );
  }

  const needsDeepPropsMemo = didPropsChange && canPropsBeMemoized;
  const needsDeepStateMemo = didStateChange && canStateBeMemoized;

  if (needsDeepStateMemo) {
    insights.push(
      <div className={styles.Item}>
        • Use shouldComponentUpdate with deep equality to avoid this component
        rendering.
      </div>,
    );
  } else if (needsDeepPropsMemo) {
    insights.push(
      <div className={styles.Item}>
        • Use shouldComponentUpdate or React.Memo with deep equality to avoid
        this component rendering.
      </div>,
    );
  }

  if (propsNeedingMemoization != null && propsNeedingMemoization.length > 0) {
    insights.push(
      <div className={styles.Item}>
        • Consider memoizing the following props to avoid rendering.
        {propsNeedingMemoization.map(key => (
          <span key={key} className={styles.Key}>
            {key}
          </span>
        ))}
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
