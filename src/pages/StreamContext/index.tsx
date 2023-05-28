import { createContext, useEffect } from 'react';
import { useState } from "react";
import { createOffer } from '../../utils/peerConnection';

// Global state
const stuntServers = {
    'iceServers':
        [{ 'urls': 'stun:stun.l.google.com:19302' }]
}

export const StreamContext = createContext({
    currentUser: null,
    participants: {},
    localStream: null,
    setCurrentUserHandler: (payload: any) => { },
    addParticipant: (payload: any) => { },
    removePartcipant: (payload: string) => { },
    setLocalStreamHandler: (payload: any) => { }
});


function StreamContextProvider({ children }: any) {
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [participants, setParticipants] = useState<any>({});
    const [localStream, setLocalStream] = useState<any>(null);

    const addConnection = (currentUser: any, newPartcipant: any, mediaStream: any, meetId: string) => {
        const peerConnection = new RTCPeerConnection(stuntServers);
        mediaStream.getTracks().forEach((track: any) => {
            peerConnection.addTrack(track, mediaStream);
        });

        const currentUserKey = Object.keys(currentUser)[0];
        const newPartcipantKey = Object.keys(newPartcipant)[0];

        const sortIds = [currentUserKey, newPartcipantKey].sort((a, b) => a.localeCompare(b));

        newPartcipant[newPartcipantKey].peerConnection = peerConnection;
        setParticipants((prev: any) => {
            return {
                ...prev,
                ...newPartcipant
            };
        })
        if (sortIds[1] === newPartcipantKey) {
            console.log("creating offer")
            createOffer(peerConnection, sortIds[0], sortIds[1], meetId)
        }
    }

    const setCurrentUserHandler = (payload: any) => {
        const { currentUser } = payload;
        setCurrentUser(currentUser);
        // initailizeListeners(meetId, Object.keys(currentUser)[0])
    }

    const addParticipant = (payload: any) => {
        const { newPartcipant, localStream, currentUser, meetId } = payload;
        const currentUserId = Object.keys(currentUser)[0];
        const newParticipantId = Object.keys(newPartcipant)[0];
        if (currentUserId === newParticipantId) newPartcipant[newParticipantId].currentUser = true;

        // Make connection with other users
        if (localStream && !newPartcipant[newParticipantId].currentUser) {
            console.log("Creating connections!");
            addConnection(currentUser, newPartcipant, localStream, meetId);
            return;
        }

        setParticipants((prev: any) => ({
            ...prev,
            ...newPartcipant
        }))
    }
    const removePartcipant = (payload: string) => {
        setParticipants((prev: any) => {
            delete prev[payload];
            return prev
        })
    }

    const setLocalStreamHandler = (payload: any) => {
        setLocalStream(payload);
    }

    useEffect(() => {
        console.log(currentUser);
    }, [currentUser])

    useEffect(() => {
        console.log(participants);
    }, [participants])

    useEffect(() => {
        console.log(localStream);
    }, [localStream]);

    return (
        <StreamContext.Provider value={{ currentUser, participants, localStream, setCurrentUserHandler, setLocalStreamHandler, addParticipant, removePartcipant }}>
            {children}
        </StreamContext.Provider >
    );
}

export default StreamContextProvider;
