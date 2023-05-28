import { onAuthStateChanged } from "firebase/auth";
import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import { firebaseAuth, firebaseRTDB, connectedRef } from "../utils/firebaseConfig";
import "./index.css"
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setMeeting } from "../app/slices/MeetingSlice";
import { setUser } from "../app/slices/AuthSlice";
import { child, get, onChildAdded, onChildRemoved, onDisconnect, onValue, push, ref } from "firebase/database";
import MeetScreenWrap from "./MeetScreenWrap";
import { StreamContext } from "./StreamContext";
import { createAnswer } from "../utils/peerConnection";

export default function JoinMeeting() {
  const { meetId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { meetingData } = useAppSelector((state) => state.meetings);
  const { userInfo } = useAppSelector((state) => state.auth);
  const [createToast] = useToast();

  const {
    currentUser,
    participants,
    localStream,
    setCurrentUserHandler,
    setLocalStreamHandler,
    addParticipant,
    removePartcipant
  } = useContext(StreamContext);

  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
    // Check user exists or not
    if (!userInfo?.uid && !isLoading) {
      setIsLoading(true);
      // Fetch it
      onAuthStateChanged(firebaseAuth, (user) => {
        if (user) {
          // Set it to the current User
          dispatch(setUser({
            uid: user.uid,
            email: user.email || "",
            name: user.displayName || ""
          }))
          if (meetId) {
            get(child(ref(firebaseRTDB), `meetings/${meetId}`)).then((snap) => {
              if (snap.exists()) {
                const meetingVal = snap.val();
                dispatch(setMeeting({
                  ...meetingVal,
                  meetId
                }));
                const isCreator = meetingVal.createdBy === user.uid;
                const index = meetingVal.invitedUsers?.findIndex(
                  (invitedUser: string) => invitedUser === user.uid
                );
                // allowed in the invited or it is creator or anyone can join
                if (index !== -1 || isCreator || !meetingVal.invitedUsers.length) {
                  // Ask for media strream permissions
                  navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                  }).then((stream) => {
                    stream.getVideoTracks()[0].enabled = false;
                    setLocalStreamHandler(stream);
                    // This will check for client connection
                    onValue(connectedRef, (snap) => {
                      console.log(snap.val());
                      const preferences = {
                        audio: true,
                        video: false,
                        screen: false
                      }
                      // Push the participants
                      push(ref(firebaseRTDB, `meetings/${meetId}/participants`), {
                        uid: user.uid,
                        preferences,
                        fullName: user.displayName
                      }).then((val) => {
                        // Here user is connected successfully so we need to set current User
                        (setCurrentUserHandler({
                          currentUser: {
                            [val.key || ""]: {
                              uid: user.uid,
                              preferences,
                              fullName: user.displayName
                            }
                          },
                          meetId
                        }))
                        // Listeners for partcipant added or removed
                        const participantRef = ref(firebaseRTDB, `meetings/${meetId}/participants`);
                        // another event listener that to add the user
                        onChildAdded(participantRef, (snap) => {
                          const { preferences, uid } = snap.val();
                          (addParticipant({
                            newPartcipant: {
                              [snap.key || ""]: {
                                uid,
                                preferences,
                                fullName: user.displayName
                              }
                            },
                            localStream: stream,
                            currentUser: {
                              [val.key || ""]: {
                                uid: user.uid,
                                preferences,
                                fullName: user.displayName
                              }
                            },
                            meetId
                          }))
                        });
                        // another event listenet to remove the user
                        onChildRemoved(participantRef, (snap) => {
                          // remove it from the backup
                          (removePartcipant(snap.key || ""));
                        })
                        onDisconnect(ref(firebaseRTDB, `meetings/${meetId}/participants/${val.key}`)).remove();
                      })
                    });
                  })
                }
              } else {
                createToast({
                  title: `You are not invited to the meeting.`,
                  type: "danger",
                });
                navigate(user ? "/" : "/login");
              }
              setIsLoading(false);
            }).catch(err => {
              console.log(err);
              setIsLoading(false);
            })
          }
        } else {
          navigate("/login");
        }
      });
    }
  }, [createToast, meetId, dispatch, navigate, userInfo, isLoading])

  useEffect(() => {
    const initailizeListeners = (recieverId: string) => {
      const offerRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offers`);
      const offerCandidatesRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offerCandidates`);
      const answerRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/answer`);
      const answerCandidatesRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/answerCandidates`);
      onChildAdded(offerRef, async (snap) => {
        const data = snap.val();
        if (data?.offerPayload) {
          const createdId = data?.offerPayload.userId;
          /* @ts-ignore */
          console.log(participants[createdId]);
          /* @ts-ignore */
          const peerConnection = participants[createdId].peerConnection;
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data?.offerPayload))
          createAnswer(peerConnection, recieverId, createdId, meetId);
        }
      })
      onChildAdded(offerCandidatesRef, async (snap) => {
        const data = snap.val();
        if (data?.userId) {
          /* @ts-ignore */
          const peerConnection = participants[data?.userId].peerConnection;
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      })
      onChildAdded(answerRef, async (snap) => {
        const data = snap.val();
        if (data?.answerPayload) {
          const createdId = data?.answerPayload.userId;
          /* @ts-ignore */
          const peerConnection = participants[createdId].peerConnection;
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data?.answerPayload))
        }
      })
      onChildAdded(answerCandidatesRef, async (snap) => {
        const data = snap.val();
        if (data?.userId) {
          /* @ts-ignore */
          if (!Boolean(participants[data?.userId])) return;
          /* @ts-ignore */
          const peerConnection = participants[data?.userId].peerConnection;
          console.log(data);
          peerConnection.addIceCandidate(new RTCIceCandidate(data));
        }
      })
    }
    if (userInfo?.uid && currentUser && Object.keys(participants).length) {
      initailizeListeners(Object.keys(currentUser || {})[0] || "");
    };
  }, [participants, currentUser, userInfo, meetId])

  return !isLoading ? (
    <div
      className="root"
      style={{
        display: "flex",
        minHeight: "100vh",
        flexDirection: "column",
        width: "100vw"
      }}
    >
      <h1>{meetingData.meetingName}</h1>
      <MeetScreenWrap />
      {/* <div className="lobby-container">
        <div className="lobby-item">
          <video id="localStreamVideo" autoPlay playsInline muted></video>
        </div>
      </div> */}
    </div>
  ) : <h1>Joining....</h1>
}
