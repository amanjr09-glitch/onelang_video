import { createSlice } from "@reduxjs/toolkit";
import { ToastType } from "../../utils/types";

interface meetingInitialState {
  toasts: Array<ToastType>;
  meetingData: any
}

const initialState: meetingInitialState = {
  toasts: [],
  meetingData: {
  }
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
    }
  },
});

export const { setToasts, setMeeting } = meetingsSlice.actions;
