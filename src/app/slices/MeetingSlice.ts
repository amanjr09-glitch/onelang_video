import { createSlice } from "@reduxjs/toolkit";
import { ToastType } from "../../utils/types";
import { createOffer } from "../../utils/peerConnection";

interface meetingInitialState {
  toasts: Array<ToastType>;
  meetingData: any;
  currentUser: any;
  participants: any;
  localStream: any;
}

const initialState: meetingInitialState = {
  toasts: [],
  meetingData: {
  },
  currentUser: null,
  participants: {},
  localStream: null
};

// Global state
const stuntServers = {
  'iceServers':
    [{ 'urls': 'stun:stun.l.google.com:19302' }]
}

const addConnection = (currentUser: any, newPartcipant: any, mediaStream: any, meetId: string) => {
  const peerConnection = new RTCPeerConnection(stuntServers);
  mediaStream.getTracks().forEach((track: any) => {
    peerConnection.addTrack(track, mediaStream);
  });

  const currentUserKey = Object.keys(currentUser)[0];
  const newPartcipantKey = Object.keys(newPartcipant)[0];

  const sortIds = [currentUserKey, newPartcipantKey].sort((a, b) => a.localeCompare(b));

  newPartcipant[newPartcipantKey].peerConnection = peerConnection

  console.log(sortIds);
  console.log([currentUserKey, newPartcipantKey]);

  // if (sortIds[1] === newPartcipantKey) {
  console.log("Creating offer");
  createOffer(peerConnection, sortIds[0], sortIds[1], meetId)
  // }
}

export const meetingsSlice = createSlice({
  name: "meetings",
  initialState,
  reducers: {
    setToasts: (state, action) => {
      state.toasts = action.payload;
    },
    setMeeting: (state, action) => {
      state.meetingData = { ...action.payload, ...state.meetingData };
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
      // initailizeListeners(state.meetingData.meetId, Object.keys(action.payload)[0])
    },
    addParticipant: (state, action) => {
      const currentUserId = state.currentUser ? Object.keys(state.currentUser)[0] : "";
      const newParticipantId = Object.keys(action.payload)[0];
      if (currentUserId === newParticipantId) {
        action.payload[newParticipantId].currentUser = true;
      }

      // Make connection with other users
      if (state.localStream && !action.payload[newParticipantId].currentUser) {
        console.log("Creating connections!");
        addConnection(state.currentUser, action.payload, state.localStream, state.meetingData.meetId)
      }

      state.participants = {
        ...state.participants,
        ...action.payload
      }
    },
    removeParticipants: (state, action) => {
      const participants = state.participants;
      delete participants[action.payload];
      state.participants = participants;
    },
    setLocalStream: (state, action) => {
      state.localStream = action.payload;
    }
  },
});

export const {
  setToasts,
  setMeeting,
  setCurrentUser,
  addParticipant,
  removeParticipants,
  setLocalStream
} = meetingsSlice.actions;
