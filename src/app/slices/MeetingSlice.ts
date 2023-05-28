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
      const { newPartcipant, localStream, handleSetBackupPartcipant } = action.payload;
      const currentUserId = state.currentUser ? Object.keys(state.currentUser)[0] : "";
      const newParticipantId = Object.keys(newPartcipant)[0];
      if (currentUserId === newParticipantId) {
        newPartcipant[newParticipantId].currentUser = true;
      }

      // Make connection with other users
      if (localStream && !newPartcipant[newParticipantId].currentUser) {
        console.log("Creating connections!");
        // addConnection(state.currentUser, newPartcipant, localStream, state.meetingData.meetId, setBackupPartcipants)
      }

      handleSetBackupPartcipant(newPartcipant)

      state.participants = {
        ...state.participants,
        ...newPartcipant
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