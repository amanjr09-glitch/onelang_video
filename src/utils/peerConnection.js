import { onChildAdded, push, ref } from "firebase/database";
import { firebaseRTDB } from "./firebaseConfig";
// import { store } from "../app/store";

export const createOffer = async (peerConnection, createdId, recieverId, meetId) => {
    const recieverRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offers`);
    const offer = await peerConnection.createOffer();
    // To listenTheAnswering
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            push(ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offerCandidates`), {
                ...event.candidate.toJSON(),
                userId: createdId
            })
        }
    };
    await peerConnection.setLocalDescription(offer);
    const offerPayload = {
        type: offer.type,
        sdp: offer.sdp,
        userId: createdId
    };
    await push(recieverRef, {
        offerPayload
    })
}

// export const initailizeListeners = (meetId, recieverId) => {
//     const offerRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offers`);
//     const offerCandidatesRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/offerCandidates`);
//     const answerRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/answer`);
//     const answerCandidatesRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/answerCandidates`);
//     onChildAdded(offerRef, async (snap) => {
//         const data = snap.val();
//         if (data?.offerPayload) {
//             const createdId = data?.offerPayload.userId;
//             const peerConnection = store.getState().meetings.participants[createdId].peerConnection;
//             await peerConnection.setRemoteDescription(new RTCSessionDescription(data?.offerPayload))
//             createAnswer(peerConnection, recieverId, createdId, meetId);
//         }
//     })
//     onChildAdded(offerCandidatesRef, async (snap) => {
//         const data = snap.val();
//         if (data?.userId) {
//             const peerConnection = store.getState().meetings.participants[data?.userId].peerConnection;
//             peerConnection.addIceCandidate(new RTCIceCandidate(data));
//         }
//     })
//     onChildAdded(answerRef, async (snap) => {
//         const data = snap.val();
//         if (data?.answerPayload) {
//             const createdId = data?.answerPayload.userId;
//             const peerConnection = store.getState().meetings.participants[createdId].peerConnection;
//             await peerConnection.setRemoteDescription(new RTCSessionDescription(data?.answerPayload))
//         }
//     })
//     onChildAdded(answerCandidatesRef, async (snap) => {
//         const data = snap.val();
//         if (data?.userId) {
//             const peerConnection = store.getState().meetings.participants[data?.userId].peerConnection;
//             peerConnection.addIceCandidate(new RTCIceCandidate(data));
//         }
//     })
// }

const createAnswer = async (peerConnection, currentUserId, recieverId, meetId) => {
    const recieverRef = ref(firebaseRTDB, `meetings/${meetId}/participants/${recieverId}/answerCandidates`);
    const answer = await peerConnection.createAnswer();
    // To listenTheAnswering
    peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
            push(recieverRef, {
                ...event.candidate.toJSON(),
                userId: currentUserId
            })
        }
    };
    await peerConnection.setLocalDescription(answer);
    const answerPayload = {
        type: answer.type,
        sdp: answer.sdp,
        userId: currentUserId
    };
    await push(recieverRef, {
        answerPayload
    })
}