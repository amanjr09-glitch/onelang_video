import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import { firebaseAuth, firebaseRTDB, connectedRef } from "../utils/firebaseConfig";
import "./index.css"
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { removeParticipants, setCurrentUser, setLocalStream, setMeeting } from "../app/slices/MeetingSlice";
import { setUser } from "../app/slices/AuthSlice";
import { child, get, onChildAdded, onChildRemoved, onDisconnect, onValue, push, ref } from "firebase/database";
import { addParticipant } from "../app/slices/MeetingSlice";
import MeetScreenWrap from "./MeetScreenWrap";

export default function JoinMeeting() {
  const { meetId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { meetingData } = useAppSelector((state) => state.meetings);
  const { userInfo } = useAppSelector((state) => state.auth);
  const [createToast] = useToast();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check user exists or not
    if (!userInfo?.uid && !isLoading) {
      setIsLoading(true);
      // Fetch it
      onAuthStateChanged(firebaseAuth, (currentUser) => {
        if (currentUser) {
          // Set it to the current User
          dispatch(setUser({
            uid: currentUser.uid,
            email: currentUser.email || "",
            name: currentUser.displayName || ""
          }))
          if (meetId) {
            get(child(ref(firebaseRTDB), `meetings/${meetId}`)).then((snap) => {
              if (snap.exists()) {
                const meetingVal = snap.val();
                dispatch(setMeeting({
                  ...meetingVal,
                  meetId
                }));
                const isCreator = meetingVal.createdBy === currentUser.uid;
                const index = meetingVal.invitedUsers?.findIndex(
                  (invitedUser: string) => invitedUser === currentUser.uid
                );
                // allowed in the invited or it is creator or anyone can join
                if (index !== -1 || isCreator || !meetingVal.invitedUsers.length) {
                  // Ask for media strream permissions
                  navigator.mediaDevices.getUserMedia({
                    audio: true,
                    video: true
                  }).then((stream) => {
                    stream.getVideoTracks()[0].enabled = false;
                    dispatch(setLocalStream(stream));
                  })
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
                      uid: currentUser.uid,
                      preferences,
                      fullName: currentUser.displayName
                    }).then((val) => {
                      // Here user is connected successfully so we need to set current User
                      dispatch(setCurrentUser({
                        [val.key || ""]: {
                          uid: currentUser.uid,
                          preferences,
                          fullName: currentUser.displayName
                        }
                      }))
                      // Listeners for partcipant added or removed
                      const participantRef = ref(firebaseRTDB, `meetings/${meetId}/participants`);
                      // another event listener that to add the user
                      onChildAdded(participantRef, (snap) => {
                        const { preferences, uid } = snap.val();
                        dispatch(addParticipant({
                          [snap.key || ""]: {
                            uid,
                            preferences,
                            fullName: currentUser.displayName
                          }
                        }))
                      });
                      // another event listenet to remove the user
                      onChildRemoved(participantRef, (snap) => {
                        dispatch(removeParticipants(snap.key));
                      })

                      onDisconnect(ref(firebaseRTDB, `meetings/${meetId}/participants/${val.key}`)).remove();
                    })
                  });
                }
              } else {
                createToast({
                  title: `You are not invited to the meeting.`,
                  type: "danger",
                });
                navigate(currentUser ? "/" : "/login");
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


  // useEffect(() => {
  //   const displayRemoteStream = (stream: MediaStream, streamId: string) => {
  //     // Check if the video element for the remote stream already exists
  //     const existingVideoElement = document.getElementById(streamId) as HTMLVideoElement;
  //     if (existingVideoElement) {
  //       // If the video element exists, update its srcObject with the new stream
  //       existingVideoElement.srcObject = stream;
  //     } else {
  //       // If the video element does not exist, create a new one
  //       const remoteVideo = document.createElement('video');
  //       remoteVideo.id = streamId;
  //       remoteVideo.srcObject = stream;
  //       remoteVideo.autoplay = true;

  //       // Append the video element to the video container
  //       const videoContainer = document.getElementById('lobby-container') as HTMLDivElement;
  //       videoContainer.appendChild(remoteVideo);
  //     }
  //   }

  //   const requestTheLocalStream = () => {
  //     // Request access to the user's media devices
  //     navigator.mediaDevices.getUserMedia({ video: true, audio: true })
  //       .then((stream) => {
  //         setLocalStream(stream);
  //         const localStreamVideo = document.getElementById('localStreamVideo') as HTMLVideoElement;
  //         localStreamVideo.srcObject = stream;
  //         // Push tracks from local stream to peer connection
  //         stream.getTracks().forEach((track) => {
  //           peerConnection.addTrack(track, localStream)
  //         });
  //         // Pull tracks from remote stream, add to video stream
  //         peerConnection.ontrack = (event) => {
  //           // get the remote stream from the event
  //           const remoteStream = event.streams[0];

  //           //  Generate a unique ID for the remote stream
  //           const remoteStreamId = remoteStream.id;

  //           // Store the remote stream in the data structure
  //           setRemoteStreams(prev => ({
  //             ...prev,
  //             [remoteStreamId]: remoteStream
  //           }))

  //           event.streams[0].getTracks().forEach((track) => {
  //             remoteStream.addTrack(track);
  //           });

  //           // This will stream the current stream
  //           displayRemoteStream(remoteStream, remoteStreamId);
  //         };
  //       })
  //       .catch((error) => {
  //         console.error('Error accessing media devices:', error);
  //       });
  //   }

  //   const answerToOthers = async () => {
  //     try {
  //       const offerCandidates = collection(firebaseDB, `meetings/${meetId}/offerCandidates`);
  //       const answerCandidates = collection(firebaseDB, `meetings/${meetId}/answerCandidates`);
  //       // To listenTheAnswering
  //       peerConnection.onicecandidate = (event) => {
  //         if (event.candidate) {
  //           addDoc(answerCandidates, event.candidate.toJSON());
  //         }
  //       };

  //       const meetSnapshot = await getDoc(doc(firebaseDB, "meetings", meetId || ""));
  //       const meetData = meetSnapshot.data();
  //       const offerDescription = meetData?.offer;
  //       await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
  //       const answerDescription = await peerConnection.createAnswer();
  //       await peerConnection.setLocalDescription(answerDescription);

  //       const answer = {
  //         type: answerDescription.type,
  //         sdp: answerDescription.sdp,
  //       };

  //       await updateDoc(doc(firebaseDB, "meetings", meetId || ""), { answer });
  //       onSnapshot(offerCandidates, (snapshot) => {
  //         snapshot.docChanges().forEach((change) => {
  //           console.log(change);
  //           if (change.type === 'added') {
  //             let data = change.doc.data();
  //             peerConnection.addIceCandidate(new RTCIceCandidate(data));
  //           }
  //         });
  //       });


  //     } catch (error) {
  //       console.log(error);
  //       return error
  //     }
  //   }

  //   const generateICECandidates = async () => {
  //     const offerCandidates = collection(firebaseDB, `meetings/${meetId}/offerCandidates`);
  //     const answerCandidates = collection(firebaseDB, `meetings/${meetId}/answerCandidates`);

  //     try {
  //       // Get candidates for caller, save to db
  //       peerConnection.onicecandidate = (event) => {
  //         if (event.candidate) {
  //           addDoc(offerCandidates, event.candidate.toJSON());
  //         }
  //       };
  //       // Create offer
  //       const offerDescription = await peerConnection.createOffer();
  //       await peerConnection.setLocalDescription(offerDescription);

  //       const offer = {
  //         sdp: offerDescription.sdp,
  //         type: offerDescription.type,
  //       };

  //       await updateDoc(doc(firebaseDB, "meetings", meetId || ""), { offer });

  //       // Listen for remote answer
  //       onSnapshot(doc(firebaseDB, "meetings", meetId || ""), (snapshot) => {
  //         const data = snapshot.data();
  //         if (!peerConnection.currentRemoteDescription && data?.answer) {
  //           const answerDescription = new RTCSessionDescription(data.answer);
  //           peerConnection.setRemoteDescription(answerDescription);
  //         }
  //       });

  //       // When answered, add candidate to peer connection
  //       onSnapshot(answerCandidates, (snapshot) => {
  //         snapshot.docChanges().forEach((change) => {
  //           if (change.type === 'added') {
  //             const candidate = new RTCIceCandidate(change.doc.data());
  //             peerConnection.addIceCandidate(candidate);
  //           }
  //         });
  //       });
  //       // await answerToOthers();
  //     } catch (error) {
  //       console.log(error);
  //       return error;
  //     }
  //   }

  //   const joinRoom = async (uid: string) => {
  //     const participants = meetingData.participants || [];
  //     // Add the current user to the room participants
  //     participants.push(uid);
  //     try {
  //       // Update The partcipants
  //       await updateDoc(doc(firebaseDB, "meetings", meetId || ""), {
  //         participants
  //       });
  //       await generateICECandidates();
  //     } catch (err) {
  //       console.log(err);
  //       setIsLoading(false);
  //     }
  //   }

  // }, [meetId, userInfo, createToast, navigate, isLoading, dispatch, localStream, peerConnection, meetingData])

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
