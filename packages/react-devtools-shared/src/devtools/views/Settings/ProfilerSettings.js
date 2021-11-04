/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import * as React from 'react';
import {useCallback, useContext, useRef, useSyncExternalStore} from 'react';
import {StoreContext} from '../context';
import {enableProfilerPerfInsights} from 'react-devtools-feature-flags';
import {ProfilerContext} from 'react-devtools-shared/src/devtools/views/Profiler/ProfilerContext';

import styles from './SettingsShared.css';

export default function ProfilerSettings(_: {||}) {
  const {
    isCommitFilterEnabled,
    minCommitDuration,
    setIsCommitFilterEnabled,
    setMinCommitDuration,
  } = useContext(ProfilerContext);
  const store = useContext(StoreContext);

  const updateRecordChangeDescriptions = useCallback(
    ({currentTarget}) => {
      store.recordChangeDescriptions = currentTarget.checked;
    },
    [store],
  );

  const recordChangeDescriptions = useSyncExternalStore(
    function subscribe(callback) {
      store.addListener('recordChangeDescriptions', callback);
      return function unsubscribe() {
        store.removeListener('recordChangeDescriptions', callback);
      };
    },
    function getState() {
      return store.recordChangeDescriptions;
    },
  );

  const recordPerfInsights = useSyncExternalStore(
    function subscribe(callback) {
      store.addListener('recordPerfInsights', callback);
      return function unsubscribe() {
        store.removeListener('recordPerfInsights', callback);
      };
    },
    function getState() {
      return store.recordPerfInsights;
    },
  );

  const updateRecordPerfInsights = useCallback(
    ({currentTarget}) => {
      store.recordPerfInsights = currentTarget.checked;
    },
    [store],
  );

  const updateMinCommitDuration = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const newValue = parseFloat(event.currentTarget.value);
      setMinCommitDuration(
        Number.isNaN(newValue) || newValue <= 0 ? 0 : newValue,
      );
    },
    [setMinCommitDuration],
  );
  const updateIsCommitFilterEnabled = useCallback(
    (event: SyntheticEvent<HTMLInputElement>) => {
      const checked = event.currentTarget.checked;
      setIsCommitFilterEnabled(checked);
      if (checked) {
        if (minCommitDurationInputRef.current !== null) {
          minCommitDurationInputRef.current.focus();
        }
      }
    },
    [setIsCommitFilterEnabled],
  );

  const minCommitDurationInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className={styles.Settings}>
      <div className={styles.Setting}>
        <label>
          <input
            type="checkbox"
            checked={recordChangeDescriptions}
            onChange={updateRecordChangeDescriptions}
          />{' '}
          Record why each component rendered while profiling.
        </label>
      </div>

      {enableProfilerPerfInsights && (
        <div className={styles.Setting}>
          <label>
            <input
              type="checkbox"
              checked={recordPerfInsights}
              onChange={updateRecordPerfInsights}
            />{' '}
            Get performance insights for each component while profiling.
          </label>
        </div>
      )}

      <div className={styles.Setting}>
        <label>
          <input
            checked={isCommitFilterEnabled}
            onChange={updateIsCommitFilterEnabled}
            type="checkbox"
          />{' '}
          Hide commits below
        </label>{' '}
        <input
          className={styles.Input}
          onChange={updateMinCommitDuration}
          ref={minCommitDurationInputRef}
          type="number"
          value={minCommitDuration}
        />{' '}
        (ms)
      </div>
    </div>
  );
}
