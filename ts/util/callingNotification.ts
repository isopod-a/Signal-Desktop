// Copyright 2020 Signal Messenger, LLC
// SPDX-License-Identifier: AGPL-3.0-only

import type { LocalizerType } from '../types/Util';
import { CallMode } from '../types/Calling';
import { missingCaseError } from './missingCaseError';
import type { CallStatus } from '../types/CallDisposition';
import {
  CallDirection,
  DirectCallStatus,
  type CallHistoryDetails,
  CallType,
} from '../types/CallDisposition';
import type { ConversationType } from '../state/ducks/conversations';

export enum CallExternalState {
  Active,
  Full,
  Joined,
  Ended,
  InOtherCall,
}

export type CallingNotificationType = Readonly<{
  callHistory: CallHistoryDetails;
  callCreator: ConversationType | null;
  callExternalState: CallExternalState;
  deviceCount: number;
  maxDevices: number;
}>;

function getDirectCallNotificationText(
  callDirection: CallDirection,
  callType: CallType,
  callStatus: DirectCallStatus,
  i18n: LocalizerType
): string {
  if (callStatus === DirectCallStatus.Pending) {
    if (callDirection === CallDirection.Incoming) {
      return callType === CallType.Video
        ? i18n('icu:incomingVideoCall')
        : i18n('icu:incomingAudioCall');
    }
    return callType === CallType.Video
      ? i18n('icu:outgoingVideoCall')
      : i18n('icu:outgoingAudioCall');
  }

  if (callStatus === DirectCallStatus.Accepted) {
    if (callDirection === CallDirection.Incoming) {
      return callType === CallType.Video
        ? i18n('icu:acceptedIncomingVideoCall')
        : i18n('icu:acceptedIncomingAudioCall');
    }
    return callType === CallType.Video
      ? i18n('icu:acceptedOutgoingVideoCall')
      : i18n('icu:acceptedOutgoingAudioCall');
  }

  if (callStatus === DirectCallStatus.Declined) {
    if (callDirection === CallDirection.Incoming) {
      return callType === CallType.Video
        ? i18n('icu:declinedIncomingVideoCall')
        : i18n('icu:declinedIncomingAudioCall');
    }
    return callType === CallType.Video
      ? i18n('icu:missedOrDeclinedOutgoingVideoCall')
      : i18n('icu:missedOrDeclinedOutgoingAudioCall');
  }

  if (callStatus === DirectCallStatus.Missed) {
    if (callDirection === CallDirection.Incoming) {
      return callType === CallType.Video
        ? i18n('icu:missedIncomingVideoCall')
        : i18n('icu:missedIncomingAudioCall');
    }
    return callType === CallType.Video
      ? i18n('icu:missedOrDeclinedOutgoingVideoCall')
      : i18n('icu:missedOrDeclinedOutgoingAudioCall');
  }

  if (callStatus === DirectCallStatus.Deleted) {
    throw new Error(
      'getDirectCallNotificationText: Cannot render deleted call'
    );
  }

  throw missingCaseError(callStatus);
}

function getGroupCallNotificationText(
  callExternalState: CallExternalState,
  creator: ConversationType | null,
  i18n: LocalizerType
): string {
  if (callExternalState === CallExternalState.Ended) {
    return i18n('icu:calling__call-notification__ended');
  }
  if (creator == null) {
    return i18n('icu:calling__call-notification__started-by-someone');
  }
  if (creator.isMe) {
    return i18n('icu:calling__call-notification__started-by-you');
  }
  return i18n('icu:calling__call-notification__started', {
    name: creator.systemGivenName ?? creator.title,
  });
}

export function getCallingNotificationText(
  callingNotification: CallingNotificationType,
  i18n: LocalizerType
): string {
  const { callHistory, callCreator, callExternalState } = callingNotification;
  if (callHistory.mode === CallMode.Direct) {
    return getDirectCallNotificationText(
      callHistory.direction,
      callHistory.type,
      callHistory.status as DirectCallStatus,
      i18n
    );
  }
  if (callHistory.mode === CallMode.Group) {
    return getGroupCallNotificationText(callExternalState, callCreator, i18n);
  }
  if (callHistory.mode === CallMode.None) {
    throw new Error(
      'getCallingNotificationText: Cannot render call history details with mode = None'
    );
  }
  throw missingCaseError(callHistory.mode);
}

type CallingIconType =
  | 'audio-incoming'
  | 'audio-missed'
  | 'audio-outgoing'
  | 'phone'
  | 'video'
  | 'video-incoming'
  | 'video-missed'
  | 'video-outgoing';

export function getCallingIcon(
  callType: CallType,
  callDirection: CallDirection,
  callStatus: CallStatus
): CallingIconType {
  if (callType === CallType.Audio) {
    if (callStatus === DirectCallStatus.Accepted) {
      return callDirection === CallDirection.Incoming
        ? 'audio-incoming'
        : 'audio-outgoing';
    }
    if (
      callStatus === DirectCallStatus.Missed ||
      callStatus === DirectCallStatus.Declined
    ) {
      return 'audio-missed';
    }
    return 'phone';
  }
  if (callType === CallType.Video) {
    if (callStatus === DirectCallStatus.Accepted) {
      return callDirection === CallDirection.Incoming
        ? 'video-incoming'
        : 'video-outgoing';
    }
    if (
      callStatus === DirectCallStatus.Missed ||
      callStatus === DirectCallStatus.Declined
    ) {
      return 'video-missed';
    }
    return 'video';
  }
  if (callType === CallType.Group) {
    return 'video';
  }
  throw missingCaseError(callType);
}
