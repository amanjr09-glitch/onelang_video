import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc, updateDoc, collection, addDoc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useToast from "../hooks/useToast";
import { firebaseAuth, firebaseDB, meetingsRef } from "../utils/firebaseConfig";
import "./index.css"
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setMeeting } from "../app/slices/MeetingSlice";
import { setUser } from "../app/slices/AuthSlice";


export default function JoinMeeting() {
  const { meetId } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { meetingData } = useAppSelector((state) => state.meetings);
  const { userInfo } = useAppSelector((state) => state.auth);
  const [createToast] = useToast();

  const [localStream, setLocalStream] = useState<MediaStream>(new MediaStream());

  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    const displayRemoteStream = (stream: MediaStream, streamId: string) => {
      // Check if the video element for the remote stream already exists
      const existingVideoElement = document.getElementById(streamId) as HTMLVideoElement;
      if (existingVideoElement) {
        // If the video element exists, update its srcObject with the new stream
        existingVideoElement.srcObject = stream;
      } else {
        // If the video element does not exist, create a new one
        const remoteVideo = document.createElement('video');
        remoteVideo.id = streamId;
        remoteVideo.srcObject = stream;
        remoteVideo.autoplay = true;

        // Append the video element to the video container
        const videoContainer = document.getElementById('lobby-container') as HTMLDivElement;
        videoContainer.appendChild(remoteVideo);
      }
    }

    const requestTheLocalStream = () => {
      // Request access to the user's media devices
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          const localStreamVideo = document.getElementById('localStreamVideo') as HTMLVideoElement;
          localStreamVideo.srcObject = stream;
          // Push tracks from local stream to peer connection
          stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, localStream)
          });
          // Pull tracks from remote stream, add to video stream
          peerConnection.ontrack = (event) => {
            // get the remote stream from the event
            const remoteStream = event.streams[0];

            //  Generate a unique ID for the remote stream
            const remoteStreamId = remoteStream.id;

            // Store the remote stream in the data structure
            setRemoteStreams(prev => ({
              ...prev,
              [remoteStreamId]: remoteStream
            }))

            event.streams[0].getTracks().forEach((track) => {
              remoteStream.addTrack(track);
            });

            // This will stream the current stream
            displayRemoteStream(remoteStream, remoteStreamId);
          };
        })
        .catch((error) => {
          console.error('Error accessing media devices:', error);
        });
    }

    const answerToOthers = async () => {
      try {
        const offerCandidates = collection(firebaseDB, `meetings/${meetId}/offerCandidates`);
        const answerCandidates = collection(firebaseDB, `meetings/${meetId}/answerCandidates`);
        // To listenTheAnswering
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(answerCandidates, event.candidate.toJSON());
          }
        };

        const meetSnapshot = await getDoc(doc(firebaseDB, "meetings", meetId || ""));
        const meetData = meetSnapshot.data();
        const offerDescription = meetData?.offer;
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offerDescription));
        const answerDescription = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answerDescription);

        const answer = {
          type: answerDescription.type,
          sdp: answerDescription.sdp,
        };

        await updateDoc(doc(firebaseDB, "meetings", meetId || ""), { answer });
        onSnapshot(offerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            console.log(change);
            if (change.type === 'added') {
              let data = change.doc.data();
              peerConnection.addIceCandidate(new RTCIceCandidate(data));
            }
          });
        });


      } catch (error) {
        console.log(error);
        return error
      }
    }

    const generateICECandidates = async () => {
      const offerCandidates = collection(firebaseDB, `meetings/${meetId}/offerCandidates`);
      const answerCandidates = collection(firebaseDB, `meetings/${meetId}/answerCandidates`);

      try {
        // Get candidates for caller, save to db
        peerConnection.onicecandidate = (event) => {
          if (event.candidate) {
            addDoc(offerCandidates, event.candidate.toJSON());
          }
        };
        // Create offer
        const offerDescription = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offerDescription);

        const offer = {
          sdp: offerDescription.sdp,
          type: offerDescription.type,
        };

        await updateDoc(doc(firebaseDB, "meetings", meetId || ""), { offer });

        // Listen for remote answer
        onSnapshot(doc(firebaseDB, "meetings", meetId || ""), (snapshot) => {
          const data = snapshot.data();
          if (!peerConnection.currentRemoteDescription && data?.answer) {
            const answerDescription = new RTCSessionDescription(data.answer);
            peerConnection.setRemoteDescription(answerDescription);
          }
        });

        // When answered, add candidate to peer connection
        onSnapshot(answerCandidates, (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const candidate = new RTCIceCandidate(change.doc.data());
              peerConnection.addIceCandidate(candidate);
            }
          });
        });
        // await answerToOthers();
      } catch (error) {
        console.log(error);
        return error;
      }
    }

    const joinRoom = async (uid: string) => {
      const participants = meetingData.participants || [];
      // Add the current user to the room participants
      participants.push(uid);
      try {
        // Update The partcipants
        await updateDoc(doc(firebaseDB, "meetings", meetId || ""), {
          participants
        });
        await generateICECandidates();
      } catch (err) {
        console.log(err);
        setIsLoading(false);
      }
    }

    if (!userInfo?.uid) {
      setIsLoading(true);
      onAuthStateChanged(firebaseAuth, (currentUser) => {
        if (currentUser) {
          dispatch(setUser({
            uid: currentUser.uid,
            email: currentUser.email || "",
            name: currentUser.displayName || ""
          }))
          if (meetId) {
            getDoc(doc(firebaseDB, "meetings", meetId)).then((fetchedMeetings) => {
              if (fetchedMeetings.exists()) {
                const meeting = fetchedMeetings.data();
                dispatch(setMeeting({
                  ...meeting,
                  meetId
                }));
                const isCreator = meeting.createdBy === currentUser.uid;
                const index = meeting.invitedUsers.findIndex(
                  (invitedUser: string) => invitedUser === currentUser.uid
                );
                // allowed in the invited or it is creator or anyone can join
                if (index !== -1 || isCreator || !meeting.invitedUsers.length) {
                  requestTheLocalStream();
                  joinRoom(currentUser.uid).then(() => {
                    setIsLoading(false);
                  }).catch((err) => {
                    console.log(err);
                  });
                } else {
                  createToast({
                    title: `You are not invited to the meeting.`,
                    type: "danger",
                  });
                  navigate(currentUser ? "/" : "/login");
                  setIsLoading(false);
                }
              }
            }).catch((error) => {
              console.log(error);
              setIsLoading(false);
            });
          }
        } else {
          navigate("/login");
        }
      });
    }
  }, [meetId, userInfo, createToast, navigate, isLoading, dispatch, localStream, peerConnection, meetingData])

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
      <div className="lobby-container">
        <div className="lobby-item">
          <video id="localStreamVideo" autoPlay playsInline muted></video>
        </div>
      </div>
    </div>
  ) : <h1>Joining....</h1>
}
