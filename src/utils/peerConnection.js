import { push, ref } from "firebase/database";
import { firebaseRTDB } from "./firebaseConfig";

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



export const createAnswer = async (peerConnection, currentUserId, recieverId, meetId) => {
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