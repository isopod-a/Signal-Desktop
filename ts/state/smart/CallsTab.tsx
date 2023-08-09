// Copyright 2023 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { useItemsActions } from '../ducks/items';
import {
  getNavTabsCollapsed,
  getPreferredLeftPaneWidth,
} from '../selectors/items';
import { getIntl, getRegionCode } from '../selectors/user';
import { CallsTab } from '../../components/CallsTab';
import {
  getAllConversations,
  getConversationSelector,
} from '../selectors/conversations';
import { filterAndSortConversationsByRecent } from '../../util/filterAndSortConversations';
import type {
  CallHistoryFilter,
  CallHistoryFilterOptions,
  CallHistoryGroup,
  CallHistoryPagination,
} from '../../types/CallDisposition';
import type { ConversationType } from '../ducks/conversations';
import { SmartConversationDetails } from './ConversationDetails';
import { useCallingActions } from '../ducks/calling';
import { getActiveCallState } from '../selectors/calling';
import { useCallHistoryActions } from '../ducks/callHistory';
import { getCallHistoryEdition } from '../selectors/callHistory';
import * as log from '../../logging/log';

function getCallHistoryFilter(
  allConversations: Array<ConversationType>,
  regionCode: string | undefined,
  options: CallHistoryFilterOptions
): CallHistoryFilter | null {
  const query = options.query.normalize().trim();

  if (query !== '') {
    const currentConversations = allConversations.filter(conversation => {
      return conversation.removalStage == null;
    });

    const filteredConversations = filterAndSortConversationsByRecent(
      currentConversations,
      query,
      regionCode
    );

    // If there are no matching conversations, then no calls will match.
    if (filteredConversations.length === 0) {
      return null;
    }

    return {
      status: options.status,
      conversationIds: filteredConversations.map(conversation => {
        return conversation.id;
      }),
    };
  }

  return {
    status: options.status,
    conversationIds: null,
  };
}

function renderConversationDetails(
  conversationId: string,
  callHistoryGroup: CallHistoryGroup | null
): JSX.Element {
  return (
    <SmartConversationDetails
      conversationId={conversationId}
      callHistoryGroup={callHistoryGroup}
    />
  );
}

export function SmartCallsTab(): JSX.Element {
  const i18n = useSelector(getIntl);
  const navTabsCollapsed = useSelector(getNavTabsCollapsed);
  const preferredLeftPaneWidth = useSelector(getPreferredLeftPaneWidth);
  const { savePreferredLeftPaneWidth, toggleNavTabsCollapse } =
    useItemsActions();

  const allConversations = useSelector(getAllConversations);
  const regionCode = useSelector(getRegionCode);
  const getConversation = useSelector(getConversationSelector);

  const activeCall = useSelector(getActiveCallState);
  const callHistoryEdition = useSelector(getCallHistoryEdition);

  const {
    onOutgoingAudioCallInConversation,
    onOutgoingVideoCallInConversation,
  } = useCallingActions();
  const { clearAllCallHistory: clearCallHistory } = useCallHistoryActions();

  const getCallHistoryGroupsCount = useCallback(
    async (options: CallHistoryFilterOptions) => {
      // Informs us if the call history has changed
      log.info('getCallHistoryGroupsCount: edition', callHistoryEdition);
      const callHistoryFilter = getCallHistoryFilter(
        allConversations,
        regionCode,
        options
      );
      if (callHistoryFilter == null) {
        return 0;
      }
      const count = await window.Signal.Data.getCallHistoryGroupsCount(
        callHistoryFilter
      );
      log.info('getCallHistoryGroupsCount: count', count, callHistoryFilter);
      return count;
    },
    [allConversations, regionCode, callHistoryEdition]
  );

  const getCallHistoryGroups = useCallback(
    async (
      options: CallHistoryFilterOptions,
      pagination: CallHistoryPagination
    ) => {
      // Informs us if the call history has changed
      log.info('getCallHistoryGroups: edition', callHistoryEdition);
      const callHistoryFilter = getCallHistoryFilter(
        allConversations,
        regionCode,
        options
      );
      if (callHistoryFilter == null) {
        return [];
      }
      const results = await window.Signal.Data.getCallHistoryGroups(
        callHistoryFilter,
        pagination
      );
      log.info(
        'getCallHistoryGroupsCount: results',
        results,
        callHistoryFilter
      );
      return results;
    },
    [allConversations, regionCode, callHistoryEdition]
  );

  return (
    <CallsTab
      activeCall={activeCall}
      allConversations={allConversations}
      getConversation={getConversation}
      getCallHistoryGroupsCount={getCallHistoryGroupsCount}
      getCallHistoryGroups={getCallHistoryGroups}
      i18n={i18n}
      navTabsCollapsed={navTabsCollapsed}
      onClearCallHistory={clearCallHistory}
      onToggleNavTabsCollapse={toggleNavTabsCollapse}
      onOutgoingAudioCallInConversation={onOutgoingAudioCallInConversation}
      onOutgoingVideoCallInConversation={onOutgoingVideoCallInConversation}
      preferredLeftPaneWidth={preferredLeftPaneWidth}
      renderConversationDetails={renderConversationDetails}
      regionCode={regionCode}
      savePreferredLeftPaneWidth={savePreferredLeftPaneWidth}
    />
  );
}
